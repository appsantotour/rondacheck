import type { Settings } from './types';

export const KNOWN_GUARDS: string[] = [
    "JOÃO", "ROBSON", "MATIAS", "EDUARDO", "CARLOS", "FERNANDO", "MARCOS", "PAULO"
];

export const DEFAULT_SETTINGS: Settings = {
    maxIntervalMinutes: 7,
    dinnerIntervals: [
        { start: "21:00", end: "22:00" },
        { start: "00:30", end: "01:30" },
    ],
    roundStartToleranceMinutes: 3,
    roundEndToleranceMinutes: 3,
    totalLocations: 8,
};