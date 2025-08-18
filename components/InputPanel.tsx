
import React, { useState, useCallback, useRef } from 'react';
import { UploadIcon, ClipboardPasteIcon } from './Icons';

interface InputPanelProps {
    onAnalyze: (text: string) => void;
    isLoading: boolean;
}

export const InputPanel: React.FC<InputPanelProps> = ({ onAnalyze, isLoading }) => {
    const [text, setText] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const fileText = e.target?.result as string;
                setText(fileText);
            };
            reader.readAsText(file);
        }
        // Reset file input to allow uploading the same file again
        if(event.target) {
            event.target.value = '';
        }
    }, []);

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handlePaste = async () => {
        try {
            const clipboardText = await navigator.clipboard.readText();
            setText(prev => prev + clipboardText);
        } catch (err) {
            console.error('Failed to read clipboard contents: ', err);
            alert('Não foi possível colar o conteúdo. Verifique as permissões do navegador.');
        }
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onAnalyze(text);
    };

    return (
        <div className="bg-card p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4 text-text-primary">1. Entrada de Dados</h2>
            <form onSubmit={handleSubmit}>
                <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Cole o relatório aqui ou use os botões abaixo..."
                    className="w-full h-64 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-primary focus:border-transparent transition duration-200"
                    disabled={isLoading}
                />
                <div className="mt-4 flex flex-col sm:flex-row gap-3">
                    <input
                        type="file"
                        accept=".csv,.txt"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                        disabled={isLoading}
                    />
                    <button
                        type="button"
                        onClick={handleUploadClick}
                        disabled={isLoading}
                        className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-brand-primary bg-sky-100 hover:bg-sky-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary transition disabled:opacity-50"
                    >
                        <UploadIcon className="w-5 h-5 mr-2" />
                        Carregar Arquivo (.txt, .csv)
                    </button>
                     <button
                        type="button"
                        onClick={handlePaste}
                        disabled={isLoading}
                        className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-brand-primary bg-sky-100 hover:bg-sky-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary transition disabled:opacity-50"
                    >
                        <ClipboardPasteIcon className="w-5 h-5 mr-2" />
                        Colar da Área de Transferência
                    </button>
                </div>
                <div className="mt-6">
                    <button
                        type="submit"
                        disabled={isLoading || !text}
                        className="w-full inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-brand-primary hover:bg-sky-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        {isLoading ? 'Analisando...' : 'Analisar Relatório'}
                    </button>
                </div>
            </form>
        </div>
    );
};