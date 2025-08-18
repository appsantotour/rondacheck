
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
                <div className="grid grid-cols-2 gap-4">
                    <SettingsInput 
                        label="Início da Janta"
                        id="dinnerStart"
                        value={settings.dinnerStart}
                        onChange={handleChange}
                        type="time"
                    />
                    <SettingsInput 
                        label="Fim da Janta"
                        id="dinnerEnd"
                        value={settings.dinnerEnd}
                        onChange={handleChange}
                        type="time"
                    />
                </div>
            </div>
        </div>
    );
};