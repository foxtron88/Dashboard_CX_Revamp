'use client';

import React, { useMemo } from 'react';
import type { CSATRecord } from '@/modules/common/types';
import { useCSATTarget } from '@/modules/common/hooks/use-csat-target';

interface Props { 
  records: CSATRecord[];
  hideHeader?: boolean;
}

const BU_COLORS: Record<string, string> = {
  'API':     '#6366f1',
  'IDM':     '#06b6d4',
  'IJH':     '#10b981',
  'IAS':     '#8b5cf6',
  'ITDC':    '#ec4899',
  'Sarinah': '#f59e0b',
};

function getScoreColor(score: number) {
  if (score >= 4.5) return 'var(--accent-success)';
  if (score >= 4.0) return 'var(--accent-info)';
  if (score >= 3.0) return 'var(--accent-warning)';
  return 'var(--accent-danger)';
}

export default function MemberCSATGrid({ records, hideHeader }: Props) {
  const { target } = useCSATTarget();
  const buStats = useMemo(() => {
    const buNames = Array.from(new Set(records.map(r => r.bu))).sort();
    return buNames.map(bu => {
      const buRecs = records.filter(r => r.bu === bu);
      const calcAvg = (key: 'overall_score' | 'people_score' | 'process_score' | 'premises_score') => {
        const vals = buRecs.map(r => r[key]).filter((v): v is number => v !== null);
        return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
      };
      const overall = calcAvg('overall_score');
      const people = calcAvg('people_score');
      const process = calcAvg('process_score');
      const premises = calcAvg('premises_score');
      const ratedTotal = buRecs.filter(r => r.overall_score !== null).length;
      const satisfied = buRecs.filter(r => r.overall_group === 'Satisfied').length;
      const csatPct = ratedTotal > 0 ? (satisfied / ratedTotal) * 100 : 0;

      return { bu, total: buRecs.length, overall, people, process, premises, csatPct, ratedTotal };
    });
  }, [records]);

  return (
    <section className="mt-10 animate-in">
      {!hideHeader && (
        <div className="flex items-center gap-3 mb-6">
          <span className="text-2xl">🏆</span>
          <div>
            <h2 className="text-xl font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>
              CSAT per Business Unit
            </h2>
            <p className="text-xs text-[var(--text-muted)]">
              3P Driver breakdown: People (PPL) · Process (PRC) · Premises (PRM)
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {buStats.map(s => {
          const accent = BU_COLORS[s.bu] || '#64748b';
          return (
            <div key={s.bu}
              className="glass-card relative overflow-hidden transition-all duration-300 hover:scale-[1.02]"
              style={{ borderColor: `${accent}40` }}
            >
              {/* Header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white shadow-sm"
                  style={{ background: accent }}>
                  {s.bu.substring(0, 2)}
                </div>
                <div>
                  <p className="text-lg font-bold text-white leading-tight">{s.bu}</p>
                  <p className="text-xs text-[var(--text-muted)]">{s.total.toLocaleString()} responses</p>
                </div>
              </div>

              {/* Overall Score */}
              <div className="text-center mb-5 py-4 rounded-xl relative" style={{ background: 'var(--bg-tertiary)' }}>
                {s.overall > 0 && s.overall < target && (
                  <div className="absolute top-0 right-0 -mt-2 -mr-2 bg-red-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full shadow-sm flex items-center gap-1 animate-pulse" title={`Below Target (${target.toFixed(2)})`}>
                    <span>⚠️</span> Below Target
                  </div>
                )}
                <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest font-semibold mb-1">Overall</p>
                <p className="text-4xl font-extrabold mb-1" style={{ color: getScoreColor(s.overall), fontFamily: 'var(--font-display)' }}>
                  {s.overall > 0 ? s.overall.toFixed(2) : '—'}
                </p>
                <div className="flex items-center justify-center gap-2">
                  <p className="text-xs font-bold" style={{ color: getScoreColor(s.overall) }}>
                    CSAT {s.csatPct.toFixed(1)}%
                  </p>
                  <span className="text-[10px] text-[var(--text-muted)]">|</span>
                  <p className="text-[10px] font-medium text-[var(--text-muted)]">
                    Target: {target.toFixed(2)}
                  </p>
                </div>
              </div>

              {/* 3P Drivers */}
              <div className="space-y-4 px-1">
                {[
                  { label: 'PPL', val: s.people, color: '#6366f1' },
                  { label: 'PRC', val: s.process, color: '#06b6d4' },
                  { label: 'PRM', val: s.premises, color: '#ec4899' },
                ].map(d => (
                  <div key={d.label} className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[var(--text-muted)] w-10">{d.label}</span>
                    <div className="flex-1 mx-3 bg-[var(--bg-secondary)] rounded-full h-2 overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${d.val > 0 ? (d.val / 5) * 100 : 0}%`, background: d.color }} />
                    </div>
                    <div className="flex items-center justify-end gap-1 w-12">
                      {d.val > 0 && d.val < target && (
                        <span className="text-[10px] text-red-500 animate-pulse" title={`Below Target (${target.toFixed(2)})`}>⚠️</span>
                      )}
                      <span className="text-sm font-bold text-right" style={{ color: getScoreColor(d.val) }}>
                        {d.val > 0 ? d.val.toFixed(1) : '—'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
