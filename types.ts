
export interface Settings {
    maxIntervalMinutes: number;
    dinnerStart: string;
    dinnerEnd: string;
    roundStartToleranceMinutes: number;
    roundEndToleranceMinutes: number;
}

export interface RawEvent {
    timestamp: Date;
    text: string;
    line: number;
}

export enum EventType {
    INICIO_RONDA = "INICIO RONDA PORTARIA",
    DESCARGA_COLETOR = "DESCARGA DE COLETOR EFETUADA",
    LOCAL = "LOCAL",
    VIGIA = "VIGIA",
    UNKNOWN = "UNKNOWN",
}

export interface ProcessedEvent extends RawEvent {
    type: EventType;
    data?: {
        name?: string;
        localNumber?: number;
    };
}

export enum NonConformityType {
    RONDA_NAO_INICIADA = "Ronda não iniciada corretamente",
    INTERVALO_EXCEDIDO = "Intervalo entre locais excedido",
    SEQUENCIA_INCORRETA = "Sequência de locais incorreta",
    DESCARGA_AUSENTE = "Descarga de coletor ausente",
    INICIOS_MULTIPLOS = "Múltiplos inícios de ronda",
    JANTA_FORA_HORARIO = "Pausa longa fora do horário de janta",
    // Future rules can be added here
}

export interface NonConformity {
    id: string;
    date: Date;
    guard: string;
    type: NonConformityType;
    details: string;
    roundEvents: ProcessedEvent[];
}

export interface ChartDataItem {
    name: string;
    count: number;
}

export interface AnalysisResult {
    nonConformities: NonConformity[];
    chartData: {
        byType: ChartDataItem[];
        byGuard: ChartDataItem[];
    };
    hasRounds: boolean;
}

declare global {
    const jspdf: any;
    const XLSX: any;
}