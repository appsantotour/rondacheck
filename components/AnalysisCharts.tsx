
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { ChartDataItem } from '../types';

interface AnalysisChartsProps {
    byType: ChartDataItem[];
    byGuard: ChartDataItem[];
}

const CustomTooltip: React.FC<any> = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 border border-gray-300 rounded shadow-lg">
          <p className="font-semibold">{label}</p>
          <p className="text-sm text-brand-primary">{`Ocorrências: ${payload[0].value}`}</p>
        </div>
      );
    }
    return null;
  };
  

export const AnalysisCharts: React.FC<AnalysisChartsProps> = ({ byType, byGuard }) => {
    return (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            <div className="bg-card p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold text-text-primary mb-4">Ocorrências por Tipo</h3>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={byType} layout="vertical" margin={{ top: 5, right: 20, left: 80, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" allowDecimals={false} />
                        <YAxis type="category" dataKey="name" width={150} tick={{ fontSize: 12 }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="count" fill="#38bdf8" name="Ocorrências" barSize={20} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
            <div className="bg-card p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold text-text-primary mb-4">Ranking de Vigias por Ocorrências</h3>
                 <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={byGuard} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis allowDecimals={false} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="count" fill="#0284c7" name="Ocorrências" />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};