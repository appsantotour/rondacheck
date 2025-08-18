
import type { RawEvent, ProcessedEvent, AnalysisResult, NonConformity, Settings, ChartDataItem } from '../types';
import { EventType, NonConformityType } from '../types';
import { KNOWN_GUARDS } from '../constants';

const parseDateTime = (dateStr: string, timeStr: string): Date => {
    const [day, month, year] = dateStr.split('/').map(Number);
    const [hours, minutes] = timeStr.split(':').map(Number);
    // Month is 0-indexed in JavaScript Date
    return new Date(year, month - 1, day, hours, minutes);
};

const parseLog = (text: string): RawEvent[] => {
    const lines = text.split('\n').filter(line => line.trim() !== '');
    const events: RawEvent[] = [];
    const lineRegex = /^(\d{2}\/\d{2}\/\d{4})\s+(\d{2}:\d{2})\s*\|\s*(.*)$/;

    lines.forEach((line, index) => {
        const match = line.trim().match(lineRegex);
        if (match) {
            const [, dateStr, timeStr, message] = match;
            try {
                const timestamp = parseDateTime(dateStr, timeStr);
                 if (isNaN(timestamp.getTime())) return;
                events.push({ timestamp, text: message.trim(), line: index + 1 });
            } catch (e) {
                console.warn(`Invalid date format on line ${index + 1}: ${line}`);
            }
        }
    });
    return events.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
};

const processEvents = (rawEvents: RawEvent[]): ProcessedEvent[] => {
    return rawEvents.map(event => {
        const textUpper = event.text.toUpperCase();
        
        if (textUpper.includes("INICIO RONDA PORTARIA")) {
            return { ...event, type: EventType.INICIO_RONDA };
        }
        if (textUpper.includes("DESCARGA DE COLETOR EFETUADA")) {
            return { ...event, type: EventType.DESCARGA_COLETOR };
        }

        const knownGuard = KNOWN_GUARDS.find(guard => textUpper === guard);
        if (knownGuard) {
            return { ...event, type: EventType.VIGIA, data: { name: knownGuard } };
        }

        const localMatch = textUpper.match(/(?:LOCAL\s*(\d+)|(\d+)\s*LOCAL)/);
        if (localMatch) {
            const localNumber = parseInt(localMatch[1] || localMatch[2], 10);
            return { ...event, type: EventType.LOCAL, data: { localNumber } };
        }

        return { ...event, type: EventType.UNKNOWN };
    });
};

const getTimeInMinutes = (date: Date): number => date.getHours() * 60 + date.getMinutes();

export const analyzeRounds = (text: string, settings: Settings): AnalysisResult => {
    const rawEvents = parseLog(text);
    const processedEvents = processEvents(rawEvents);
    const nonConformities: NonConformity[] = [];
    let currentRound: ProcessedEvent[] = [];
    let inRound = false;
    let currentGuard = "Desconhecido";

    const addNonConformity = (type: NonConformityType, event: ProcessedEvent, details: string) => {
        nonConformities.push({
            id: `${event.timestamp.toISOString()}-${type}-${Math.random()}`,
            date: event.timestamp,
            guard: currentGuard,
            type,
            details,
            roundEvents: [...currentRound, event],
        });
    };

    processedEvents.forEach((event, index) => {
        if (event.type === EventType.VIGIA && event.data?.name) {
            currentGuard = event.data.name;
            if (inRound) {
                currentRound.push(event);
            }
        } else if (event.type === EventType.INICIO_RONDA) {
            if (inRound) {
                addNonConformity(NonConformityType.INICIOS_MULTIPLOS, event, `Nova ronda iniciada sem a finalização da anterior (iniciada em ${currentRound[0].timestamp.toLocaleTimeString()}).`);
                currentRound = []; // Reset and start a new round
            }
            inRound = true;
            currentRound.push(event);
            
            // Check if a guard name immediately follows
            const nextEvent = processedEvents[index+1];
            if(nextEvent && nextEvent.type === EventType.VIGIA && nextEvent.data?.name) {
                 currentGuard = nextEvent.data.name;
            }

        } else if (event.type === EventType.LOCAL) {
            if (!inRound) {
                addNonConformity(NonConformityType.RONDA_NAO_INICIADA, event, `Registro de local #${event.data?.localNumber} encontrado fora de uma ronda ativa.`);
                return; // Don't process this event as part of a round
            }
            const lastLocal = [...currentRound].reverse().find(e => e.type === EventType.LOCAL);
            currentRound.push(event);

            if (lastLocal && lastLocal.data?.localNumber && event.data?.localNumber) {
                // Check sequence
                if (event.data.localNumber !== lastLocal.data.localNumber + 1) {
                    addNonConformity(NonConformityType.SEQUENCIA_INCORRETA, event, `Sequência incorreta: pulou de Local ${lastLocal.data.localNumber} para Local ${event.data.localNumber}.`);
                }

                // Check interval
                const intervalMinutes = (event.timestamp.getTime() - lastLocal.timestamp.getTime()) / (1000 * 60);
                if (intervalMinutes > settings.maxIntervalMinutes) {
                    const dinnerStartMinutes = parseInt(settings.dinnerStart.split(':')[0]) * 60 + parseInt(settings.dinnerStart.split(':')[1]);
                    const dinnerEndMinutes = parseInt(settings.dinnerEnd.split(':')[0]) * 60 + parseInt(settings.dinnerEnd.split(':')[1]);
                    const eventTimeMinutes = getTimeInMinutes(event.timestamp);

                    if (eventTimeMinutes >= dinnerStartMinutes && eventTimeMinutes <= dinnerEndMinutes) {
                       // It's a long break, but within dinner time. Potentially ok.
                       // For simplicity, we will still flag long intervals, but a more complex rule could be added.
                       // Let's create a specific non-conformity for long breaks outside dinner time.
                    } else {
                       addNonConformity(NonConformityType.INTERVALO_EXCEDIDO, event, `Intervalo de ${intervalMinutes.toFixed(0)} min entre Local ${lastLocal.data.localNumber} e ${event.data.localNumber} (limite: ${settings.maxIntervalMinutes} min).`);
                    }
                }
            }
        } else if (event.type === EventType.DESCARGA_COLETOR) {
            if (inRound) {
                currentRound.push(event);
                inRound = false;
                currentRound = [];
            }
        } else {
             if (inRound) {
                currentRound.push(event);
            }
        }
    });

    if (inRound) {
        addNonConformity(NonConformityType.DESCARGA_AUSENTE, currentRound[currentRound.length - 1], `A ronda iniciada em ${currentRound[0].timestamp.toLocaleString()} não teve registro de descarga.`);
    }

    // Chart data generation
    const byType: { [key: string]: number } = {};
    const byGuard: { [key: string]: number } = {};
    nonConformities.forEach(nc => {
        byType[nc.type] = (byType[nc.type] || 0) + 1;
        byGuard[nc.guard] = (byGuard[nc.guard] || 0) + 1;
    });

    const chartDataByType: ChartDataItem[] = Object.entries(byType).map(([name, count]) => ({ name, count })).sort((a,b) => b.count - a.count);
    const chartDataByGuard: ChartDataItem[] = Object.entries(byGuard).map(([name, count]) => ({ name, count })).sort((a,b) => b.count - a.count);

    return {
        nonConformities,
        chartData: {
            byType: chartDataByType,
            byGuard: chartDataByGuard,
        },
        hasRounds: processedEvents.some(e => e.type === EventType.INICIO_RONDA),
    };
};