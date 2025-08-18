
import React, { useState } from 'react';
import type { NonConformity } from '../types';
import { ChevronDownIcon, ChevronUpIcon, AlertTriangleIcon } from './Icons';

export const NonConformityTable: React.FC<{ nonConformities: NonConformity[] }> = ({ nonConformities }) => {
    const [expandedRow, setExpandedRow] = useState<string | null>(null);

    const toggleRow = (id: string) => {
        setExpandedRow(expandedRow === id ? null : id);
    };

    if(nonConformities.length === 0){
         return (
             <div className="bg-card p-6 rounded-lg shadow-md text-center">
                <h3 className="text-lg font-semibold text-text-primary">Nenhum resultado para os filtros aplicados</h3>
                <p className="text-text-secondary mt-2">Tente ajustar os filtros para encontrar não conformidades.</p>
            </div>
         )
    }

    return (
        <div className="bg-card rounded-lg shadow-md overflow-hidden">
            <div className="p-6">
                <h3 className="text-lg leading-6 font-semibold text-text-primary">Lista de Não Conformidades</h3>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data/Hora</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vigia</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo da Falha</th>
                             <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Detalhes</th>
                            <th scope="col" className="relative px-6 py-3">
                                <span className="sr-only">Expandir</span>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {nonConformities.map((nc) => (
                            <React.Fragment key={nc.id}>
                                <tr className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{new Date(nc.date).toLocaleString('pt-BR')}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{nc.guard}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        <div className="flex items-center">
                                            <AlertTriangleIcon className="w-4 h-4 text-accent-amber mr-2" />
                                            {nc.type}
                                        </div>
                                    </td>
                                     <td className="px-6 py-4 whitespace-normal text-sm text-gray-500 hidden md:table-cell max-w-xs truncate">{nc.details}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button onClick={() => toggleRow(nc.id)} className="text-brand-primary hover:text-sky-800">
                                            {expandedRow === nc.id ? <ChevronUpIcon/> : <ChevronDownIcon/>}
                                        </button>
                                    </td>
                                </tr>
                                {expandedRow === nc.id && (
                                    <tr className="bg-gray-50">
                                        <td colSpan={5} className="px-6 py-4">
                                            <div className="md:hidden mb-2">
                                                <p className="text-sm font-semibold text-gray-700">Detalhes:</p>
                                                <p className="text-sm text-gray-600">{nc.details}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-gray-700">Eventos da Ronda Associada:</p>
                                                <ul className="list-disc list-inside mt-1 text-xs text-gray-600 font-mono bg-gray-100 p-2 rounded">
                                                    {nc.roundEvents.map(e => (
                                                        <li key={e.line}>
                                                           {new Date(e.timestamp).toLocaleTimeString('pt-BR')} | {e.text}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};