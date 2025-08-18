
import React from 'react';
import type { NonConformity, ChartDataItem } from '../types';
import { NonConformityTable } from './NonConformityTable';
import { AnalysisCharts } from './AnalysisCharts';
import { exportToPDF, exportToExcel } from '../services/exportService';
import { DownloadIcon } from './Icons';


interface ResultsDashboardProps {
    nonConformities: NonConformity[];
    allNonConformities: NonConformity[];
    chartDataByType: ChartDataItem[];
    chartDataByGuard: ChartDataItem[];
    onFilterChange: (filters: { guard: string; shift: string, date: string }) => void;
    activeFilters: { guard: string; shift: string, date: string };
    uniqueGuards: string[];
}

export const ResultsDashboard: React.FC<ResultsDashboardProps> = ({ 
    nonConformities, allNonConformities, chartDataByType, chartDataByGuard, onFilterChange, activeFilters, uniqueGuards 
}) => {

    const handleExportPDF = () => {
        exportToPDF(nonConformities, "Relatório de Não Conformidades");
    };

    const handleExportExcel = () => {
        exportToExcel(nonConformities, "Relatório de Não Conformidades");
    };

    if (allNonConformities.length === 0) {
        return (
             <div className="bg-card p-6 rounded-lg shadow-md text-center">
                 <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-accent-green mx-auto mb-4"><path d="M8 11.8579L10.9161 14.774L16.5701 9.12012"/><path d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"/></svg>
                <h3 className="text-xl font-semibold text-text-primary">Tudo Certo!</h3>
                <p className="text-text-secondary mt-2">Nenhuma não conformidade encontrada no relatório analisado.</p>
            </div>
        )
    }

    return (
        <div className="space-y-8">
            <div className="bg-card p-6 rounded-lg shadow-md">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h2 className="text-xl font-semibold text-text-primary">3. Resultados da Análise</h2>
                        <p className="text-sm text-text-secondary mt-1">Filtre e exporte os resultados encontrados.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={handleExportPDF} className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary">
                            <DownloadIcon className="w-4 h-4 mr-2"/> PDF
                        </button>
                         <button onClick={handleExportExcel} className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary">
                            <DownloadIcon className="w-4 h-4 mr-2"/> Excel
                        </button>
                    </div>
                </div>

                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                         <label htmlFor="guard-filter" className="block text-sm font-medium text-gray-700">Vigia</label>
                        <select id="guard-filter" value={activeFilters.guard} onChange={e => onFilterChange({...activeFilters, guard: e.target.value})} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm rounded-md">
                            <option value="all">Todos</option>
                            {uniqueGuards.map(g => <option key={g} value={g}>{g}</option>)}
                        </select>
                    </div>
                     <div>
                         <label htmlFor="shift-filter" className="block text-sm font-medium text-gray-700">Turno</label>
                        <select id="shift-filter" value={activeFilters.shift} onChange={e => onFilterChange({...activeFilters, shift: e.target.value})} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm rounded-md">
                            <option value="all">Todos</option>
                            <option value="day">Dia (06:00 - 17:59)</option>
                            <option value="night">Noite (18:00 - 05:59)</option>
                        </select>
                    </div>
                     <div>
                        <label htmlFor="date-filter" className="block text-sm font-medium text-gray-700">Data</label>
                        <input type="date" id="date-filter" value={activeFilters.date} onChange={e => onFilterChange({...activeFilters, date: e.target.value})} className="mt-1 block w-full pl-3 pr-2 py-2 text-base border-gray-300 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm rounded-md"/>
                    </div>
                </div>
            </div>

            <AnalysisCharts byType={chartDataByType} byGuard={chartDataByGuard} />
            <NonConformityTable nonConformities={nonConformities} />
        </div>
    );
};