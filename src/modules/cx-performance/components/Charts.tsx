'use client';

import React, { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend,
} from 'recharts';
import type { CSATRecord } from '@/modules/common/types';

interface Props {
  records: CSATRecord[];
}

const SCORE_COLORS: Record<number, string> = {
  1: '#ef4444', 2: '#f59e0b', 3: '#eab308', 4: '#3b82f6', 5: '#10b981',
};

const SENTIMENT_COLORS: Record<string, string> = {
  Positive: '#10b981',
  Neutral: '#6366f1',
  Negative: '#ef4444',
};

export function CSATDistributionChart({ records }: Props) {
  const data = useMemo(() => {
    const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    records.forEach(r => {
      const s = Math.round(r.overall_score);
      if (s >= 1 && s <= 5) counts[s]++;
    });
    return Object.entries(counts).map(([score, count]) => ({
      score: `Score ${score}`,
      count,
      fill: SCORE_COLORS[Number(score)],
    }));
  }, [records]);

  const avg = records.length
    ? (records.reduce((a, r) => a + r.overall_score, 0) / records.length).toFixed(2)
    : '0';

  return (
    <div className="glass-card animate-in">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">CSAT Score Distribution</h3>
        <span className="text-xs font-medium px-2 py-1 rounded-full bg-[var(--accent-primary)]/20 text-[var(--accent-primary-light)]">
          Avg: {avg}
        </span>
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey="score" tick={{ fill: '#94a3b8', fontSize: 11 }} />
          <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
          <Tooltip
            contentStyle={{ background: '#1a2235', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#f1f5f9' }}
          />
          <Bar dataKey="count" radius={[6, 6, 0, 0]}>
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function SentimentDonut({ records }: Props) {
  const data = useMemo(() => {
    const counts: Record<string, number> = { Positive: 0, Neutral: 0, Negative: 0 };
    records.forEach(r => { if (counts[r.sentiment] !== undefined) counts[r.sentiment]++; });
    return Object.entries(counts).map(([name, value]) => ({ name, value, fill: SENTIMENT_COLORS[name] }));
  }, [records]);

  const total = records.length;
  const positive = data.find(d => d.name === 'Positive')?.value || 0;
  const pctPositive = total ? ((positive / total) * 100).toFixed(1) : '0';

  return (
    <div className="glass-card animate-in">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">Sentiment Breakdown</h3>
        <span className="text-xs font-medium px-2 py-1 rounded-full bg-[var(--accent-success)]/20 text-[var(--accent-success)]">
          {pctPositive}% Positive
        </span>
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie
            data={data}
            cx="50%" cy="50%"
            innerRadius={60} outerRadius={90}
            paddingAngle={4}
            dataKey="value"
          >
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.fill} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ background: '#1a2235', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#f1f5f9' }}
          />
          <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function SentimentByBUChart({ records }: Props) {
  const data = useMemo(() => {
    const groups: Record<string, Record<string, number>> = {};
    records.forEach(r => {
      if (!r.source) return;
      if (!groups[r.source]) groups[r.source] = { Positive: 0, Neutral: 0, Negative: 0 };
      if (groups[r.source][r.sentiment] !== undefined) groups[r.source][r.sentiment]++;
    });
    return Object.entries(groups).map(([bu, counts]) => ({ bu, ...counts })).sort((a, b) => a.bu.localeCompare(b.bu));
  }, [records]);

  return (
    <div className="glass-card animate-in">
      <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Sentiment Distribution by Business Unit</h3>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey="bu" tick={{ fill: '#94a3b8', fontSize: 10 }} angle={-20} textAnchor="end" height={50} />
          <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
          <Tooltip contentStyle={{ background: '#1a2235', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#f1f5f9' }} />
          <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="Positive" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
          <Bar dataKey="Neutral" stackId="a" fill="#6366f1" />
          <Bar dataKey="Negative" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ResponseVolumeChart({ records }: Props) {
  const data = useMemo(() => {
    const monthly: Record<string, number> = {};
    records.forEach(r => {
      if (!r.response_date) return;
      const key = r.response_date.substring(0, 7); // YYYY-MM
      monthly[key] = (monthly[key] || 0) + 1;
    });
    return Object.entries(monthly)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, count]) => ({
        month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        count,
      }));
  }, [records]);

  return (
    <div className="glass-card animate-in">
      <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Monthly Response Volume</h3>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 10 }} />
          <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
          <Tooltip contentStyle={{ background: '#1a2235', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#f1f5f9' }} />
          <Bar dataKey="count" fill="#6366f1" radius={[6, 6, 0, 0]} name="Responses" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
