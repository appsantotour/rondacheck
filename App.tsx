
import React, { useState, useCallback, useMemo } from 'react';
import { Header } from './components/Header';
import { InputPanel } from './components/InputPanel';
import { SettingsPanel } from './components/SettingsPanel';
import { ResultsDashboard } from './components/ResultsDashboard';
import { analyzeRounds } from './services/reportProcessor';
import type { AnalysisResult, Settings, NonConformity } from './types';
import { DEFAULT_SETTINGS } from './constants';

const App: React.FC = () => {
    const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
    const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [activeFilters, setActiveFilters] = useState<{ guard: string; shift: string; date: string }>({ guard: 'all', shift: 'all', date: '' });
    
    const handleAnalyze = useCallback((text: string) => {
        if (!text.trim()) {
            setError("A caixa de texto está vazia. Cole ou carregue um relatório.");
            setAnalysisResult(null);
            return;
        }
        setIsLoading(true);
        setError(null);
        setAnalysisResult(null);

        // Simulate processing time for better UX
        setTimeout(() => {
            try {
                const result = analyzeRounds(text, settings);
                if (result.nonConformities.length === 0 && !result.hasRounds) {
                     setError("Nenhum evento de ronda válido encontrado no relatório. Verifique o formato do texto.");
                } else {
                    setAnalysisResult(result);
                }
            } catch (e) {
                console.error(e);
                setError(`Ocorreu um erro na análise: ${(e as Error).message}. Verifique o formato do relatório.`);
            } finally {
                setIsLoading(false);
            }
        }, 500);
    }, [settings]);

    const filteredData = useMemo(() => {
        if (!analysisResult) return [];
        
        return analysisResult.nonConformities.filter(nc => {
            const guardMatch = activeFilters.guard === 'all' || nc.guard === activeFilters.guard;
            
            const dateMatch = activeFilters.date === '' || new Date(nc.date).toISOString().split('T')[0] === activeFilters.date;

            const hour = new Date(nc.date).getHours();
            const shiftMatch = activeFilters.shift === 'all' ||
                (activeFilters.shift === 'day' && hour >= 6 && hour < 18) ||
                (activeFilters.shift === 'night' && (hour >= 18 || hour < 6));

            return guardMatch && dateMatch && shiftMatch;
        });
    }, [analysisResult, activeFilters]);


    const uniqueGuards = useMemo(() => {
        if (!analysisResult) return [];
        const guards = new Set(analysisResult.nonConformities.map(nc => nc.guard));
        return Array.from(guards);
    }, [analysisResult]);


    return (
        <div className="min-h-screen bg-background font-sans">
            <Header />
            <main className="container mx-auto p-4 md:p-6 lg:p-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                    <div className="lg:col-span-1 flex flex-col gap-8">
                        <InputPanel onAnalyze={handleAnalyze} isLoading={isLoading} />
                        <SettingsPanel settings={settings} onSettingsChange={setSettings} />
                    </div>
                    <div className="lg:col-span-2">
                        {isLoading && (
                            <div className="flex justify-center items-center p-16 bg-card rounded-lg shadow-md">
                                <svg className="animate-spin h-10 w-10 text-brand-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <p className="ml-4 text-lg text-text-secondary">Analisando relatório...</p>
                            </div>
                        )}
                        {error && (
                            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg shadow-md" role="alert">
                                <p className="font-bold">Erro</p>
                                <p>{error}</p>
                            </div>
                        )}
                        {analysisResult && !error && (
                             <ResultsDashboard 
                                key={JSON.stringify(filteredData)} // Force re-render on filter change
                                nonConformities={filteredData} 
                                allNonConformities={analysisResult.nonConformities}
                                chartDataByType={analysisResult.chartData.byType}
                                chartDataByGuard={analysisResult.chartData.byGuard}
                                onFilterChange={setActiveFilters}
                                activeFilters={activeFilters}
                                uniqueGuards={uniqueGuards}
                            />
                        )}
                        {!isLoading && !analysisResult && !error && (
                            <div className="flex flex-col justify-center items-center text-center p-16 bg-card rounded-lg shadow-md border-2 border-dashed border-gray-300">
                                <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 mb-4"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/></svg>
                                <h2 className="text-xl font-semibold text-text-primary">Aguardando Análise</h2>
                                <p className="text-text-secondary mt-2">Use o painel à esquerda para carregar ou colar os dados do relatório e iniciar a verificação.</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default App;