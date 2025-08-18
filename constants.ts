
import type { Settings } from './types';

export const KNOWN_GUARDS: string[] = [
    "JOÃO", "ROBSON", "MATIAS", "EDUARDO", "CARLOS", "FERNANDO", "MARCOS", "PAULO"
];

export const DEFAULT_SETTINGS: Settings = {
    maxIntervalMinutes: 10,
    dinnerStart: "23:00",
    dinnerEnd: "23:30",
    roundStartToleranceMinutes: 5,
    roundEndToleranceMinutes: 5,
};