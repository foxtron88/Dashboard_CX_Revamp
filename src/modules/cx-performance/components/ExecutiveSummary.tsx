'use client';

import React from 'react';
import type { CSATRecord } from '@/modules/common/types';

interface Props {
  records: CSATRecord[];
}

function getScore(records: CSATRecord[], field: 'overall_score' | 'staff_score' | 'facility_score' | 'cleanliness_score') {
  if (!records.length) return 0;
  const sum = records.reduce((a, r) => a + (r[field] || 0), 0);
  return Number((sum / records.length).toFixed(2));
}

function getScoreColor(score: number) {
  if (score >= 4.5) return 'var(--accent-success)';
  if (score >= 3.5) return 'var(--accent-info)';
  if (score >= 2.5) return 'var(--accent-warning)';
  return 'var(--accent-danger)';
}

export default function ExecutiveSummary({ records }: Props) {
  const overall = getScore(records, 'overall_score');
  const ppl = getScore(records, 'staff_score');
  const prc = getScore(records, 'cleanliness_score');
  const prm = getScore(records, 'facility_score');

  const drivers = [
    { label: 'People (PPL)', value: ppl, icon: '👥', sub: 'Staff & Service', gradient: 'from-indigo-500 to-purple-600' },
    { label: 'Process (PRC)', value: prc, icon: '🔄', sub: 'Cleanliness & Flow', gradient: 'from-cyan-500 to-blue-600' },
    { label: 'Premises (PRM)', value: prm, icon: '🏢', sub: 'Facility Quality', gradient: 'from-violet-500 to-pink-600' },
  ];

  return (
    <section className="animate-in">
      <div className="flex items-center gap-3 mb-6">
        <span className="text-2xl">📊</span>
        <div>
          <h2 className="text-xl font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>
            Executive Summary
          </h2>
          <p className="text-sm text-[var(--text-muted)]">{records.length.toLocaleString()} total responses</p>
        </div>
      </div>

      {/* Overall CSAT */}
      <div className="glass-card text-center mb-6">
        <p className="text-sm text-[var(--text-muted)] uppercase tracking-wider mb-2">Overall CSAT Score</p>
        <p className="text-5xl font-extrabold gradient-text" style={{ fontFamily: 'var(--font-display)' }}>
          {overall.toFixed(2)}
        </p>
        <p className="text-sm text-[var(--text-secondary)] mt-1">out of 5.00</p>
        <div className="w-full bg-[var(--bg-tertiary)] rounded-full h-2 mt-4 max-w-md mx-auto">
          <div
            className="h-2 rounded-full transition-all duration-700"
            style={{ width: `${(overall / 5) * 100}%`, background: getScoreColor(overall) }}
          />
        </div>
      </div>

      {/* 3 Driver Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {drivers.map(d => (
          <div key={d.label} className="glass-card text-center">
            <span className="text-3xl">{d.icon}</span>
            <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider mt-2">{d.label}</p>
            <p className="text-3xl font-bold mt-1" style={{ color: getScoreColor(d.value), fontFamily: 'var(--font-display)' }}>
              {d.value.toFixed(2)}
            </p>
            <p className="text-xs text-[var(--text-muted)] mt-1">{d.sub}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
