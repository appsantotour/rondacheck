
import type { RawEvent, ProcessedEvent, AnalysisResult, NonConformity, Settings, ChartDataItem } from '../types';
import { EventType, NonConformityType } from '../types';
import { KNOWN_GUARDS } from '../constants';

const parseDateTime = (dateStr: string, timeStr: string): Date => {
    // User-specified input format is mm/dd/yyyy.
    const [month, day, year] = dateStr.split('/').map(Number);
    const timeParts = timeStr.split(':').map(Number);
    const hours = timeParts[0] || 0;
    const minutes = timeParts[1] || 0;
    const seconds = timeParts[2] || 0; // handle optional seconds
    // JavaScript's Date month is 0-indexed.
    return new Date(year, month - 1, day, hours, minutes, seconds);
};

const parseLog = (text: string): RawEvent[] => {
    const lines = text.split('\n').filter(line => line.trim() !== '' && !line.startsWith("Data e Hora"));
    const events: RawEvent[] = [];
    // Flexible regex to handle formats like "mm/dd/yyyy, HH:MM:SS" or "mm/dd/yyyy HH:MM |"
    const lineRegex = /^(\d{2}\/\d{2}\/\d{4}),?\s+(\d{2}:\d{2}(?::\d{2})?)\s*(?:\|\s*)?(.*)$/;

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
                const localEvents = currentRound.filter(e => e.type === EventType.LOCAL);
                if (localEvents.length < settings.totalLocations) {
                    const lastLocalEvent = localEvents.length > 0 ? localEvents[localEvents.length - 1] : null;
                    const details = lastLocalEvent
                        ? `Ronda anterior interrompida com ${localEvents.length} de ${settings.totalLocations} locais. Último local: #${lastLocalEvent.data?.localNumber}.`
                        : `Ronda anterior interrompida com ${localEvents.length} de ${settings.totalLocations} locais. Nenhum local foi visitado.`;
                    
                    const roundStartDate = currentRound.length > 0 ? currentRound[0].timestamp : event.timestamp;

                    nonConformities.push({
                        id: `${roundStartDate.toISOString()}-${NonConformityType.RONDA_INCOMPLETA}-${Math.random()}`,
                        date: roundStartDate,
                        guard: currentGuard,
                        type: NonConformityType.RONDA_INCOMPLETA,
                        details,
                        roundEvents: [...currentRound],
                    });
                }
                
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
                    const eventTimeMinutes = getTimeInMinutes(event.timestamp);

                    const isDinnerTime = settings.dinnerIntervals.some(interval => {
                        if (!interval.start || !interval.end) return false;
                        const dinnerStartMinutes = parseInt(interval.start.split(':')[0]) * 60 + parseInt(interval.start.split(':')[1]);
                        const dinnerEndMinutes = parseInt(interval.end.split(':')[0]) * 60 + parseInt(interval.end.split(':')[1]);

                        // Handle overnight intervals (e.g., 23:00 to 01:00)
                        if (dinnerEndMinutes < dinnerStartMinutes) {
                            return eventTimeMinutes >= dinnerStartMinutes || eventTimeMinutes <= dinnerEndMinutes;
                        }
                        
                        // Handle same-day intervals
                        return eventTimeMinutes >= dinnerStartMinutes && eventTimeMinutes <= dinnerEndMinutes;
                    });

                    if (!isDinnerTime) {
                       addNonConformity(NonConformityType.INTERVALO_EXCEDIDO, event, `Intervalo de ${intervalMinutes.toFixed(0)} min entre Local ${lastLocal.data.localNumber} e ${event.data.localNumber} (limite: ${settings.maxIntervalMinutes} min). Pausa longa fora do horário de janta.`);
                    }
                }
            }
        } else if (event.type === EventType.DESCARGA_COLETOR) {
            if (inRound) {
                currentRound.push(event);
                
                const localEvents = currentRound.filter(e => e.type === EventType.LOCAL);
                if (localEvents.length < settings.totalLocations) {
                    const lastLocalEvent = localEvents.length > 0 ? localEvents[localEvents.length - 1] : null;
                    const details = lastLocalEvent
                        ? `Ronda finalizada com ${localEvents.length} de ${settings.totalLocations} locais. Último local: #${lastLocalEvent.data?.localNumber}.`
                        : `Ronda finalizada com ${localEvents.length} de ${settings.totalLocations} locais. Nenhum local foi visitado.`;

                     nonConformities.push({
                        id: `${event.timestamp.toISOString()}-${NonConformityType.RONDA_INCOMPLETA}-${Math.random()}`,
                        date: event.timestamp,
                        guard: currentGuard,
                        type: NonConformityType.RONDA_INCOMPLETA,
                        details,
                        roundEvents: [...currentRound],
                    });
                }

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
        const lastEvent = currentRound[currentRound.length - 1];
        const localEvents = currentRound.filter(e => e.type === EventType.LOCAL);

        if (localEvents.length < settings.totalLocations) {
             const lastLocalEvent = localEvents.length > 0 ? localEvents[localEvents.length - 1] : null;
             const details = lastLocalEvent
                ? `Ronda não finalizada, com ${localEvents.length} de ${settings.totalLocations} locais. Último local: #${lastLocalEvent.data?.localNumber}.`
                : `Ronda não finalizada com ${localEvents.length} de ${settings.totalLocations} locais. Nenhum local foi visitado.`;
             
             nonConformities.push({
                id: `${lastEvent.timestamp.toISOString()}-${NonConformityType.RONDA_INCOMPLETA}-${Math.random()}`,
                date: lastEvent.timestamp,
                guard: currentGuard,
                type: NonConformityType.RONDA_INCOMPLETA,
                details,
                roundEvents: [...currentRound],
            });
        }

        addNonConformity(NonConformityType.DESCARGA_AUSENTE, lastEvent, `A ronda iniciada em ${currentRound[0].timestamp.toLocaleString('pt-BR')} não teve registro de descarga.`);
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
