'use client';

import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import type { CSATRecord } from '@/modules/common/types';

interface Props { records: CSATRecord[]; }

const SENTIMENT_COLORS: Record<string, string> = {
  Positive: '#10b981',
  Neutral: '#f59e0b',
  Negative: '#ef4444',
};

const BU_COLORS: Record<string, string> = {
  'API':     '#6366f1',
  'IDM':     '#06b6d4',
  'IAS':     '#8b5cf6',
  'ITDC':    '#ec4899',
  'Sarinah': '#f59e0b',
};

/* ── CSAT Distribution (Bar Chart) ── */
export function CSATDistributionChart({ records }: Props) {
  const data = useMemo(() => {
    const groups = [
      { name: 'Very Satisfied (5)', range: [5, 5], color: '#10b981' },
      { name: 'Satisfied (4)', range: [4, 4.99], color: '#3b82f6' },
      { name: 'Neutral (3)', range: [3, 3.99], color: '#f59e0b' },
      { name: 'Dissatisfied (2)', range: [2, 2.99], color: '#f97316' },
      { name: 'Very Dissatisfied (1)', range: [1, 1.99], color: '#ef4444' },
    ];
    return groups.map(g => ({
      name: g.name,
      count: records.filter(r => r.overall_score !== null && r.overall_score >= g.range[0] && r.overall_score <= g.range[1]).length,
      fill: g.color,
    }));
  }, [records]);

  return (
    <div className="glass-card">
      <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">CSAT Score Distribution</h3>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
          <XAxis dataKey="name" tick={{ fill: 'var(--text-secondary)', fontSize: 10 }} angle={-15} textAnchor="end" height={60} />
          <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} />
          <Tooltip
            contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 12 }}
          />
          <Bar dataKey="count" radius={[6, 6, 0, 0]}>
            {data.map((entry, idx) => (
              <Cell key={idx} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ── Sentiment Donut ── */
export function SentimentDonut({ records }: Props) {
  const data = useMemo(() => {
    const counts: Record<string, number> = { Positive: 0, Neutral: 0, Negative: 0 };
    records.forEach(r => {
      if (r.sentiment && counts[r.sentiment] !== undefined) counts[r.sentiment]++;
    });
    return Object.entries(counts)
      .filter(([, v]) => v > 0)
      .map(([name, value]) => ({ name, value }));
  }, [records]);

  const total = data.reduce((a, d) => a + d.value, 0);

  return (
    <div className="glass-card">
      <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Sentiment Breakdown</h3>
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3} dataKey="value">
            {data.map((entry, idx) => (
              <Cell key={idx} fill={SENTIMENT_COLORS[entry.name] || '#64748b'} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number, name: string) => [`${value.toLocaleString()} (${total > 0 ? ((value / total) * 100).toFixed(1) : 0}%)`, name]}
            contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 12 }}
          />
          <Legend
            formatter={(value: string) => <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ── Sentiment By BU (Stacked Bar) ── */
export function SentimentByBUChart({ records }: Props) {
  const data = useMemo(() => {
    const buNames = Array.from(new Set(records.map(r => r.bu))).filter(Boolean).sort();
    return buNames.map(bu => {
      const buRecs = records.filter(r => r.bu === bu);
      return {
        bu,
        Positive: buRecs.filter(r => r.sentiment === 'Positive').length,
        Neutral: buRecs.filter(r => r.sentiment === 'Neutral').length,
        Negative: buRecs.filter(r => r.sentiment === 'Negative').length,
      };
    });
  }, [records]);

  return (
    <div className="glass-card">
      <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Sentiment by Business Unit</h3>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
          <XAxis dataKey="bu" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} />
          <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} />
          <Tooltip contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 12 }} />
          <Legend formatter={(value: string) => <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{value}</span>} />
          <Bar dataKey="Positive" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
          <Bar dataKey="Neutral" stackId="a" fill="#f59e0b" />
          <Bar dataKey="Negative" stackId="a" fill="#ef4444" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ── Response Volume By BU ── */
export function ResponseVolumeChart({ records }: Props) {
  const data = useMemo(() => {
    const buNames = Array.from(new Set(records.map(r => r.bu))).filter(Boolean).sort();
    return buNames.map(bu => ({
      bu,
      count: records.filter(r => r.bu === bu).length,
      fill: BU_COLORS[bu] || '#64748b',
    }));
  }, [records]);

  return (
    <div className="glass-card">
      <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Response Volume by BU</h3>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
          <XAxis dataKey="bu" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} />
          <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} />
          <Tooltip contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 12 }} />
          <Bar dataKey="count" radius={[6, 6, 0, 0]}>
            {data.map((entry, idx) => (
              <Cell key={idx} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
