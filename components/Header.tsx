
import React from 'react';
import { ShieldCheckIcon } from './Icons';

export const Header: React.FC = () => {
    return (
        <header className="bg-card shadow-md">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center">
                        <ShieldCheckIcon className="h-8 w-8 text-brand-primary" />
                        <h1 className="ml-3 text-2xl font-bold text-text-primary tracking-tight">
                            RondaCheck
                        </h1>
                    </div>
                     <p className="hidden md:block text-sm text-text-secondary">Análise de Relatórios de Rondas de Segurança</p>
                </div>
            </div>
        </header>
    );
};