
import React from 'react';
import type { Settings } from '../types';

interface SettingsPanelProps {
    settings: Settings;
    onSettingsChange: React.Dispatch<React.SetStateAction<Settings>>;
}

const SettingsInput: React.FC<{
    label: string, 
    id: keyof Settings, 
    value: string | number, 
    onChange: (id: keyof Settings, value: string | number) => void, 
    type?: string,
    unit?: string
}> = ({ label, id, value, onChange, type = "number", unit }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-text-secondary">{label}</label>
        <div className="mt-1 relative rounded-md shadow-sm">
            <input
                type={type}
                name={id}
                id={id}
                value={value}
                onChange={(e) => onChange(id, type === 'number' ? Number(e.target.value) : e.target.value)}
                className="focus:ring-brand-primary focus:border-brand-primary block w-full sm:text-sm border-gray-300 rounded-md p-2"
            />
            {unit && <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">{unit}</span>
            </div>}
        </div>
    </div>
);


export const SettingsPanel: React.FC<SettingsPanelProps> = ({ settings, onSettingsChange }) => {
    
    const handleChange = (id: keyof Settings, value: string | number) => {
        onSettingsChange(prev => ({ ...prev, [id]: value }));
    };

    const handleDinnerChange = (index: number, field: 'start' | 'end', value: string) => {
        onSettingsChange(prev => {
            const newIntervals = [...(prev.dinnerIntervals || [])];
            newIntervals[index] = { ...newIntervals[index], [field]: value };
            return { ...prev, dinnerIntervals: newIntervals };
        });
    };

    const addDinnerInterval = () => {
        onSettingsChange(prev => ({
            ...prev,
            dinnerIntervals: [...(prev.dinnerIntervals || []), { start: '00:00', end: '01:00' }]
        }));
    };

    const removeDinnerInterval = (index: number) => {
        onSettingsChange(prev => ({
            ...prev,
            dinnerIntervals: (prev.dinnerIntervals || []).filter((_, i) => i !== index)
        }));
    };

    return (
        <div className="bg-card p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4 text-text-primary">2. Configurações das Regras</h2>
            <div className="space-y-4">
                <SettingsInput 
                    label="Intervalo máximo entre locais"
                    id="maxIntervalMinutes"
                    value={settings.maxIntervalMinutes}
                    onChange={handleChange}
                    unit="min"
                />
                 <SettingsInput 
                    label="Número de locais por ronda"
                    id="totalLocations"
                    value={settings.totalLocations}
                    onChange={handleChange}
                    unit="locais"
                />
                <div>
                    <label className="block text-sm font-medium text-text-secondary">Horários de Janta</label>
                    <div className="mt-2 space-y-3">
                        {(settings.dinnerIntervals || []).map((interval, index) => (
                            <div key={index} className="flex items-center gap-2">
                                <input
                                    type="time"
                                    value={interval.start}
                                    onChange={(e) => handleDinnerChange(index, 'start', e.target.value)}
                                    className="focus:ring-brand-primary focus:border-brand-primary block w-full sm:text-sm border-gray-300 rounded-md p-2"
                                    aria-label={`Início da janta ${index + 1}`}
                                />
                                <span className="text-gray-500">às</span>
                                 <input
                                    type="time"
                                    value={interval.end}
                                    onChange={(e) => handleDinnerChange(index, 'end', e.target.value)}
                                    className="focus:ring-brand-primary focus:border-brand-primary block w-full sm:text-sm border-gray-300 rounded-md p-2"
                                    aria-label={`Fim da janta ${index + 1}`}
                                />
                                <button
                                    type="button"
                                    onClick={() => removeDinnerInterval(index)}
                                    className="text-red-500 hover:text-red-700 p-1 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-red-500"
                                    aria-label={`Remover horário de janta ${index + 1}`}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            </div>
                        ))}
                    </div>
                     <button
                        type="button"
                        onClick={addDinnerInterval}
                        className="mt-3 text-sm font-medium text-brand-primary hover:text-sky-800 transition-colors"
                    >
                        + Adicionar horário de janta
                    </button>
                </div>
            </div>
        </div>
    );
};