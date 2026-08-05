'use client';

import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { CSATRecord } from '@/modules/common/types';

interface Props { records: CSATRecord[]; }

const BU_COLORS: Record<string, string> = {
  'API':     '#6366f1',
  'IDM':     '#06b6d4',
  'IAS':     '#8b5cf6',
  'ITDC':    '#ec4899',
  'Sarinah': '#f59e0b',
};

function getHeatColor(score: number): string {
  if (score >= 4.5) return '#10b981';
  if (score >= 4.0) return '#3b82f6';
  if (score >= 3.5) return '#06b6d4';
  if (score >= 3.0) return '#f59e0b';
  if (score >= 2.0) return '#f97316';
  if (score > 0) return '#ef4444';
  return 'transparent';
}

/* ── CSAT Trend Line Chart ── */
export function CSATTrendChart({ records }: Props) {
  const data = useMemo(() => {
    const buNames = Array.from(new Set(records.map(r => r.bu))).filter(Boolean).sort();
    const months = Array.from(new Set(records.map(r => r.month).filter(Boolean))).sort();

    return months.map(month => {
      const point: Record<string, string | number> = { month };
      buNames.forEach(bu => {
        const buMonthRecs = records.filter(r => r.bu === bu && r.month === month && r.overall_score !== null);
        const scores = buMonthRecs.map(r => r.overall_score!);
        point[bu] = scores.length ? Number((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2)) : 0;
      });
      return point;
    });
  }, [records]);

  const buNames = Array.from(new Set(records.map(r => r.bu))).filter(Boolean).sort();

  return (
    <div className="glass-card mb-6">
      <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">CSAT Trend</h3>
      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
          <XAxis dataKey="month" tick={{ fill: 'var(--text-secondary)', fontSize: 10 }} />
          <YAxis domain={[1, 5]} tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} />
          <Tooltip itemStyle={{ color: "#ffffff", fontSize: 12, fontWeight: 600 }} labelStyle={{ color: "#94a3b8", fontSize: 11 }} contentStyle={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8, color: "#ffffff" }} />
          <Legend formatter={(value: string) => <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{value}</span>} />
          {buNames.map(bu => (
            <Line
              key={bu}
              type="monotone"
              dataKey={bu}
              stroke={BU_COLORS[bu] || '#64748b'}
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ── CSAT Heatmap (BU × Month Matrix) ── */
export function CSATHeatmap({ records }: Props) {
  const { buNames, months, matrix } = useMemo(() => {
    const buNames = Array.from(new Set(records.map(r => r.bu))).filter(Boolean).sort();
    const months = Array.from(new Set(records.map(r => r.month).filter(Boolean))).sort();

    const matrix: Record<string, Record<string, { avg: number; count: number }>> = {};
    buNames.forEach(bu => {
      matrix[bu] = {};
      months.forEach(m => {
        const recs = records.filter(r => r.bu === bu && r.month === m && r.overall_score !== null);
        const scores = recs.map(r => r.overall_score!);
        matrix[bu][m] = {
          avg: scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0,
          count: scores.length,
        };
      });
    });

    return { buNames, months, matrix };
  }, [records]);

  if (!months.length) return null;

  return (
    <div className="glass-card !p-0 overflow-hidden">
      <div className="p-4 border-b border-[var(--glass-border)] bg-[var(--bg-secondary)]">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">CSAT Heatmap — BU × Month</h3>
        <p className="text-[10px] text-[var(--text-muted)]">Color intensity indicates average overall satisfaction score</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-[var(--glass-border)]">
              <th className="p-3 text-left text-[var(--text-muted)] uppercase tracking-wider font-medium sticky left-0 bg-[var(--bg-secondary)] z-10">BU</th>
              {months.map(m => (
                <th key={m} className="p-2 text-center text-[var(--text-muted)] font-medium whitespace-nowrap">
                  {m}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {buNames.map(bu => (
              <tr key={bu} className="border-b border-[var(--glass-border)] hover:bg-[var(--glass-bg)]">
                <td className="p-3 font-semibold text-[var(--text-primary)] sticky left-0 bg-[var(--bg-primary)] z-10">{bu}</td>
                {months.map(m => {
                  const cell = matrix[bu][m];
                  return (
                    <td key={m} className="p-1 text-center">
                      {cell.count > 0 ? (
                        <div
                          className="rounded-md py-1.5 px-2 text-white font-bold text-[11px] mx-auto min-w-[40px] transition-all"
                          style={{ background: getHeatColor(cell.avg) }}
                          title={`${bu} | ${m} | Avg: ${cell.avg.toFixed(2)} | N: ${cell.count}`}
                        >
                          {cell.avg.toFixed(1)}
                        </div>
                      ) : (
                        <span className="text-[var(--text-muted)]">—</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
