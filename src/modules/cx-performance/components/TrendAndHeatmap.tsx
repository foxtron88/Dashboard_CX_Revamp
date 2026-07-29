'use client';

import React, { useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import type { CSATRecord } from '@/modules/common/types';

interface Props {
  records: CSATRecord[];
}

const BU_COLORS: Record<string, string> = {
  'API': '#6366f1',
  'HIN': '#06b6d4',
  'IAS': '#8b5cf6',
  'IDM - TMII': '#f59e0b',
  'IDM - TWC': '#10b981',
  'ITDC': '#ef4444',
  'Sarinah': '#ec4899',
};

export function CSATTrendChart({ records }: Props) {
  const data = useMemo(() => {
    const monthly: Record<string, Record<string, { sum: number; count: number }>> = {};
    const allBUs = new Set<string>();

    records.forEach(r => {
      if (!r.response_date || !r.source) return;
      const month = r.response_date.substring(0, 7);
      allBUs.add(r.source);
      if (!monthly[month]) monthly[month] = {};
      if (!monthly[month][r.source]) monthly[month][r.source] = { sum: 0, count: 0 };
      monthly[month][r.source].sum += r.overall_score;
      monthly[month][r.source].count++;
    });

    return {
      chartData: Object.entries(monthly)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, bus]) => {
          const point: Record<string, string | number> = {
            month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
          };
          Object.entries(bus).forEach(([bu, { sum, count }]) => {
            point[bu] = Number((sum / count).toFixed(2));
          });
          return point;
        }),
      allBUs: [...allBUs].sort(),
    };
  }, [records]);

  return (
    <div className="glass-card animate-in">
      <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">CSAT Trend Over Time (by Business Unit)</h3>
      <ResponsiveContainer width="100%" height={340}>
        <LineChart data={data.chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 10 }} />
          <YAxis domain={[1, 5]} tick={{ fill: '#94a3b8', fontSize: 11 }} />
          <Tooltip contentStyle={{ background: '#1a2235', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#f1f5f9' }} />
          <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
          {data.allBUs.map(bu => (
            <Line
              key={bu}
              type="monotone"
              dataKey={bu}
              stroke={BU_COLORS[bu] || '#94a3b8'}
              strokeWidth={2}
              dot={false}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function CSATHeatmap({ records }: Props) {
  const { rows, months } = useMemo(() => {
    const grid: Record<string, Record<string, { sum: number; count: number }>> = {};
    const allMonths = new Set<string>();

    records.forEach(r => {
      if (!r.response_date || !r.source) return;
      const month = r.response_date.substring(0, 7);
      allMonths.add(month);
      if (!grid[r.source]) grid[r.source] = {};
      if (!grid[r.source][month]) grid[r.source][month] = { sum: 0, count: 0 };
      grid[r.source][month].sum += r.overall_score;
      grid[r.source][month].count++;
    });

    const sortedMonths = [...allMonths].sort();

    const rows = Object.entries(grid).sort(([a], [b]) => a.localeCompare(b)).map(([bu, monthData]) => ({
      bu,
      cells: sortedMonths.map(m => {
        const d = monthData[m];
        return d ? Number((d.sum / d.count).toFixed(2)) : null;
      }),
    }));

    return {
      rows,
      months: sortedMonths.map(m => new Date(m + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' })),
    };
  }, [records]);

  function cellColor(v: number | null) {
    if (v === null) return 'var(--bg-tertiary)';
    if (v >= 4.5) return '#10b981';
    if (v >= 4.0) return '#3b82f6';
    if (v >= 3.5) return '#6366f1';
    if (v >= 3.0) return '#f59e0b';
    return '#ef4444';
  }

  return (
    <div className="glass-card animate-in mt-6">
      <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">CSAT Heatmap — Business Unit × Month</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr>
              <th className="text-left p-2 text-[var(--text-muted)] font-medium sticky left-0 bg-[var(--bg-secondary)]">BU</th>
              {months.map(m => (
                <th key={m} className="p-2 text-[var(--text-muted)] font-medium text-center whitespace-nowrap">{m}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(row => (
              <tr key={row.bu}>
                <td className="p-2 text-[var(--text-primary)] font-medium sticky left-0 bg-[var(--bg-secondary)] whitespace-nowrap">{row.bu}</td>
                {row.cells.map((cell, i) => (
                  <td key={i} className="p-1 text-center">
                    <div
                      className="rounded-md py-1.5 px-2 text-white font-semibold transition-all duration-200 hover:scale-110"
                      style={{ background: cellColor(cell), opacity: cell === null ? 0.2 : 1 }}
                    >
                      {cell !== null ? cell.toFixed(1) : '—'}
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
