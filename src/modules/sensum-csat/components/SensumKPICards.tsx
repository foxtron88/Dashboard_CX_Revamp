'use client';

import React, { useMemo } from 'react';
import type { SensumRecord } from '../hooks/use-sensum-data';

interface Props { records: SensumRecord[]; }

const SCORE_COLOR = (score: number) => {
  if (score >= 4.5) return 'var(--accent-success)';
  if (score >= 4.0) return 'var(--accent-info)';
  if (score >= 3.0) return 'var(--accent-warning)';
  return 'var(--accent-danger)';
};

export default function SensumKPICards({ records }: Props) {
  const stats = useMemo(() => {
    const withScore = records.filter(r => r.overall_score !== null);
    const total = records.length;
    const avg = withScore.length ? withScore.reduce((s, r) => s + (r.overall_score ?? 0), 0) / withScore.length : 0;
    const satisfied = records.filter(r => r.overall_group === 'Satisfied').length;
    const unsatisfied = records.filter(r => r.overall_group === 'Not Satisfied').length;
    const positive = records.filter(r => r.sentiment === 'Positive').length;
    const negative = records.filter(r => r.sentiment === 'Negative').length;
    const satRate = total > 0 ? (satisfied / total) * 100 : 0;
    const nss = total > 0 ? ((positive - negative) / total) * 100 : 0;
    return { total, avg, satRate, satisfied, unsatisfied, positive, negative, nss };
  }, [records]);

  const cards = [
    {
      label: 'Total Responses', value: stats.total.toLocaleString(),
      icon: '📋', color: 'var(--accent-info)', sub: 'distinct respondents'
    },
    {
      label: 'Avg CSAT Score', value: stats.avg.toFixed(2),
      icon: '⭐', color: SCORE_COLOR(stats.avg), sub: 'out of 5.00'
    },
    {
      label: 'Satisfaction Rate', value: `${stats.satRate.toFixed(1)}%`,
      icon: '😊', color: 'var(--accent-success)', sub: `${stats.satisfied.toLocaleString()} satisfied`
    },
    {
      label: 'Not Satisfied', value: stats.unsatisfied.toLocaleString(),
      icon: '😔', color: 'var(--accent-danger)', sub: `${stats.total > 0 ? ((stats.unsatisfied / stats.total) * 100).toFixed(1) : 0}% of total`
    },
    {
      label: 'Net Sentiment Score', value: `${stats.nss > 0 ? '+' : ''}${stats.nss.toFixed(1)}`,
      icon: '🧠', color: stats.nss >= 0 ? 'var(--accent-success)' : 'var(--accent-danger)',
      sub: `${stats.positive.toLocaleString()} positive`
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 animate-in">
      {cards.map(c => (
        <div key={c.label} className="glass-card text-center flex flex-col items-center justify-center">
          <span className="text-2xl">{c.icon}</span>
          <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mt-2">{c.label}</p>
          <p className="text-3xl font-bold mt-1" style={{ color: c.color, fontFamily: 'var(--font-display)' }}>
            {c.value}
          </p>
          <p className="text-xs text-[var(--text-secondary)] mt-1">{c.sub}</p>
        </div>
      ))}
    </div>
  );
}
