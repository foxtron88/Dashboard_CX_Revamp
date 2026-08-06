'use client';

import React, { useMemo } from 'react';
import type { CSATRecord } from '@/modules/common/types';

interface Props {
  records: CSATRecord[];
}

function getScoreColor(score: number) {
  if (score >= 4.0) return 'var(--accent-success)';
  if (score >= 3.0) return 'var(--accent-warning)';
  return 'var(--accent-danger)';
}

export default function ExecutiveSummary({ records }: Props) {
  const currentBU = useMemo(() => {
    const uniqueBUs = new Set(records.map(r => r.bu));
    return uniqueBUs.size === 1 ? Array.from(uniqueBUs)[0] : 'ALL';
  }, [records]);

  const targetCSAT = 4.40;

  const stats = useMemo(() => {
    const calcAvg = (key: 'overall_score' | 'people_score' | 'process_score' | 'premises_score') => {
      const vals = records.map(r => r[key]).filter((v): v is number => v !== null);
      return {
        avg: vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0,
        count: vals.length,
        csatPct: vals.length ? (vals.filter(v => v >= 4).length / vals.length) * 100 : 0,
      };
    };

    const overall  = calcAvg('overall_score');
    const people   = calcAvg('people_score');
    const process  = calcAvg('process_score');
    const premises = calcAvg('premises_score');

    const total = records.length;
    const ratedTotal = records.filter(r => r.overall_score !== null).length;
    const satisfied = records.filter(r => r.overall_group === 'Satisfied').length;
    const dissatisfied = records.filter(r => r.overall_group === 'Dissatisfied').length;
    const neutral = records.filter(r => r.overall_group === 'Neutral').length;
    const positive = records.filter(r => r.sentiment === 'Positive').length;
    const negative = records.filter(r => r.sentiment === 'Negative').length;
    const satRate = ratedTotal > 0 ? (satisfied / ratedTotal) * 100 : 0;
    const nss = total > 0 ? ((positive - negative) / total) * 100 : 0;

    return {
      total, ratedTotal, satisfied, dissatisfied, neutral, positive, negative, satRate, nss,
      overall, people, process, premises
    };
  }, [records]);

  const csatPillars = [
    {
      label: 'Overall CSAT', val: stats.overall.avg, count: stats.overall.count,
      csatPct: stats.overall.csatPct, target: targetCSAT,
      icon: '⭐', badge: 'Master Score',
      gradient: 'from-emerald-500/20 to-teal-500/10',
      borderColor: 'border-emerald-500/30',
      color: getScoreColor(stats.overall.avg),
    },
    {
      label: 'People (PPL)', val: stats.people.avg, count: stats.people.count,
      csatPct: stats.people.csatPct, target: targetCSAT,
      icon: '👥', badge: 'Staff & Service',
      gradient: 'from-indigo-500/20 to-purple-500/10',
      borderColor: 'border-indigo-500/30',
      color: getScoreColor(stats.people.avg),
    },
    {
      label: 'Process (PRC)', val: stats.process.avg, count: stats.process.count,
      csatPct: stats.process.csatPct, target: targetCSAT,
      icon: '🔄', badge: 'Flow & Operations',
      gradient: 'from-cyan-500/20 to-blue-500/10',
      borderColor: 'border-cyan-500/30',
      color: getScoreColor(stats.process.avg),
    },
    {
      label: 'Premises (PRM)', val: stats.premises.avg, count: stats.premises.count,
      csatPct: stats.premises.csatPct, target: targetCSAT,
      icon: '🏢', badge: 'Facility Setup',
      gradient: 'from-violet-500/20 to-pink-500/10',
      borderColor: 'border-violet-500/30',
      color: getScoreColor(stats.premises.avg),
    },
  ];

  const operationalCards = [
    { label: 'Total Responses', value: stats.total.toLocaleString(), icon: '📋', color: 'var(--accent-info)', sub: 'distinct respondents' },
    { label: 'Satisfaction Rate', value: `${stats.satRate.toFixed(1)}%`, icon: '😊', color: 'var(--accent-success)', sub: `${stats.satisfied.toLocaleString()} satisfied (≥4)` },
    { label: 'Dissatisfied', value: stats.dissatisfied.toLocaleString(), icon: '😔', color: 'var(--accent-danger)', sub: `${stats.ratedTotal > 0 ? ((stats.dissatisfied / stats.ratedTotal) * 100).toFixed(1) : 0}% of rated` },
  ];

  return (
    <section className="space-y-4 animate-in">
      {/* CSAT Score Pillars */}
      <div>
        <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2 flex items-center gap-2">
          <span>🎯</span> Cascaded CSAT Driver Scores (Overall, People, Process, Premises)
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {csatPillars.map(p => (
            <div
              key={p.label}
              className={`glass-card relative overflow-hidden bg-gradient-to-br ${p.gradient} border ${p.borderColor} transition-all duration-300 hover:scale-[1.02]`}
            >
              <div className="flex items-center justify-between">
                <span className="text-2xl">{p.icon}</span>
                <div className="flex items-center gap-2">
                  {p.val > 0 && p.target && p.val < p.target && (
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 flex items-center gap-1 animate-pulse" title="CSAT Below Target">
                      ⚠️ Below Target
                    </span>
                  )}
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/10 text-[var(--text-secondary)] border border-white/10">
                    {p.badge}
                  </span>
                </div>
              </div>
              <p className="text-xs font-medium text-[var(--text-secondary)] mt-3">{p.label}</p>
              <div className="flex items-baseline justify-between mt-1">
                <div className="flex items-end gap-2">
                  <p className="text-3xl font-extrabold" style={{ color: p.color, fontFamily: 'var(--font-display)' }}>
                    {p.val > 0 ? p.val.toFixed(2) : '—'}
                  </p>
                  <span className="text-xs text-[var(--text-muted)] mb-1">/ 5.00</span>
                </div>
                {p.target && (
                  <div className="flex flex-col items-end">
                    <span className="text-[9px] text-[var(--text-muted)] uppercase tracking-wider">Target</span>
                    <span className="text-xs font-bold" style={{ color: p.val >= p.target ? 'var(--accent-success)' : 'var(--text-secondary)' }}>
                      {p.target.toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
              {/* Score Progress Bar */}
              <div className="w-full bg-[var(--bg-tertiary)] rounded-full h-1.5 mt-3 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${p.val > 0 ? (p.val / 5) * 100 : 0}%`, background: p.color }}
                />
              </div>
              <div className="flex justify-between items-center mt-2">
                <p className="text-[10px] text-[var(--text-muted)]">
                  {p.count.toLocaleString()} rated
                </p>
                <p className="text-[10px] font-semibold" style={{ color: p.color }}>
                  CSAT {p.csatPct.toFixed(1)}%
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Operational Highlights */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {operationalCards.map(c => (
          <div key={c.label} className="glass-card text-center flex flex-col items-center justify-center p-3">
            <span className="text-xl">{c.icon}</span>
            <p className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mt-1">{c.label}</p>
            <p className="text-2xl font-bold mt-0.5" style={{ color: c.color, fontFamily: 'var(--font-display)' }}>
              {c.value}
            </p>
            <p className="text-[10px] text-[var(--text-secondary)] mt-0.5">{c.sub}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
