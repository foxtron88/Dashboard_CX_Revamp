'use client';

import React, { useMemo, useState } from 'react';
import type { CSATRecord } from '@/modules/common/types';

interface Props {
  records: CSATRecord[];
  hideDimensionToggle?: boolean;
}

type Driver = 'overall_score' | 'people_score' | 'process_score' | 'premises_score';
type Dimension = 'bu' | 'facility_type';

const DRIVERS: { key: Driver; label: string; icon: string; color: string }[] = [
  { key: 'overall_score',  label: 'Overall CSAT',   icon: '🌟', color: '#eab308' },
  { key: 'people_score',   label: 'People (PPL)',   icon: '👥', color: '#6366f1' },
  { key: 'process_score',  label: 'Process (PRC)',  icon: '🔄', color: '#06b6d4' },
  { key: 'premises_score', label: 'Premises (PRM)', icon: '🏢', color: '#ec4899' },
];

interface RowStat {
  label: string;
  n: number;
  satisfied: number;   // score >= 4
  neutral: number;     // score == 3
  dissatisfied: number; // score < 3
  avg: number;
}

export default function DriverSatisfactionBars({ records, hideDimensionToggle }: Props) {
  const [driver, setDriver] = useState<Driver>('people_score');
  const [dimension, setDimension] = useState<Dimension>('bu');
  const [topN, setTopN] = useState(10);
  const [sortBy, setSortBy] = useState<'volume' | 'dissatisfied'>('volume');

  const activeDriver = DRIVERS.find(d => d.key === driver)!;

  const rows = useMemo<RowStat[]>(() => {
    const map = new Map<string, { scores: number[] }>();

    records.forEach(r => {
      const raw = r[driver];
      if (raw === null) return;
      const score = raw as number;
      const label = (dimension === 'bu' ? r.bu : r.facility_type) || 'Unknown';
      if (!map.has(label)) map.set(label, { scores: [] });
      map.get(label)!.scores.push(score);
    });

    return Array.from(map.entries())
      .map(([label, { scores }]) => {
        const sat  = scores.filter(s => s >= 4).length;
        const neu  = scores.filter(s => s === 3).length;
        const dis  = scores.filter(s => s < 3).length;
        const avg  = scores.reduce((a, b) => a + b, 0) / scores.length;
        return { label, n: scores.length, satisfied: sat, neutral: neu, dissatisfied: dis, avg };
      })
      .filter(r => r.n >= (dimension === 'facility_type' ? 5 : 1))
      .sort((a, b) => {
        if (sortBy === 'dissatisfied') {
          const pctA = a.dissatisfied / a.n;
          const pctB = b.dissatisfied / b.n;
          if (pctB !== pctA) return pctB - pctA;
          return b.dissatisfied - a.dissatisfied;
        }
        return b.n - a.n;
      })
      .slice(0, topN);
  }, [records, driver, dimension, topN, sortBy]);

  const maxN = Math.max(...rows.map(r => r.n), 1);

  return (
    <section className="mt-10 animate-in">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <span className="text-2xl">{activeDriver.icon}</span>
        <div>
          <h2 className="text-xl font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>
            Driver Satisfaction Rate
          </h2>
          <p className="text-xs text-[var(--text-muted)]">
            Stacked breakdown: Satisfied (≥4) · Neutral (3) · Dissatisfied (&lt;3)
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="glass-card flex flex-wrap gap-6 items-end mb-4">
        {/* Driver Toggle */}
        <div>
          <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">
            Driver
          </p>
          <div className="flex gap-1">
            {DRIVERS.map(d => (
              <button
                key={d.key}
                onClick={() => setDriver(d.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                  driver === d.key
                    ? 'text-white border-transparent shadow-lg'
                    : 'border-[var(--glass-border)] text-[var(--text-secondary)] hover:border-[var(--accent-primary)]/30'
                }`}
                style={driver === d.key ? { background: d.color } : {}}
              >
                <span>{d.icon}</span> {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* Dimension Toggle */}
        {!hideDimensionToggle && (
          <div>
            <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">
              Group By
            </p>
            <div className="flex gap-1">
              {([['bu', '🏢 Business Unit'], ['facility_type', '📍 Facility Type']] as const).map(([val, label]) => (
                <button
                  key={val}
                  onClick={() => setDimension(val)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                    dimension === val
                      ? 'bg-[var(--accent-primary)]/20 text-[var(--accent-primary-light)] border-[var(--accent-primary)]/30'
                      : 'border-[var(--glass-border)] text-[var(--text-secondary)] hover:border-[var(--accent-primary)]/30'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Top N */}
        {dimension === 'facility_type' && (
          <div>
            <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">
              Show Top
            </p>
            <select
              value={topN}
              onChange={e => setTopN(Number(e.target.value))}
              className="text-xs rounded-lg px-3 py-1.5"
              style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)' }}
            >
              {[10, 15, 20, 30].map(n => (
                <option key={n} value={n}>Top {n}</option>
              ))}
            </select>
          </div>
        )}

        {/* Sort By */}
        <div>
          <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">
            Sort By
          </p>
          <div className="flex gap-1">
            <button
              onClick={() => setSortBy('volume')}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                sortBy === 'volume'
                  ? 'bg-[var(--accent-primary)]/20 text-[var(--accent-primary-light)] border-[var(--accent-primary)]/30'
                  : 'border-[var(--glass-border)] text-[var(--text-secondary)] hover:border-[var(--accent-primary)]/30'
              }`}
            >
              Highest Volume
            </button>
            <button
              onClick={() => setSortBy('dissatisfied')}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                sortBy === 'dissatisfied'
                  ? 'bg-red-500/20 text-red-400 border-red-500/30'
                  : 'border-[var(--glass-border)] text-[var(--text-secondary)] hover:border-red-500/30'
              }`}
            >
              Highest Dissatisfied
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="ml-auto flex items-center gap-4 text-[11px] text-[var(--text-muted)]">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm inline-block" style={{ background: '#10b981' }} />
            Satisfied (≥4)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm inline-block" style={{ background: '#f59e0b' }} />
            Neutral (3)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm inline-block" style={{ background: '#ef4444' }} />
            Dissatisfied (&lt;3)
          </span>
        </div>
      </div>

      {/* Bars Table */}
      <div className="glass-card !p-0 overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-[1fr_120px] px-5 py-2 border-b border-[var(--glass-border)] bg-[var(--bg-secondary)]">
          <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
            {dimension === 'bu' ? 'Business Unit' : 'Facility Type'}
          </span>
          <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider text-right">
            Responses
          </span>
        </div>

        {rows.length === 0 && (
          <div className="py-12 text-center text-[var(--text-muted)] text-sm">
            No data available for this driver / filter combination.
          </div>
        )}

        {rows.map((row, idx) => {
          const satPct  = (row.satisfied   / row.n) * 100;
          const neuPct  = (row.neutral     / row.n) * 100;
          const disPct  = (row.dissatisfied / row.n) * 100;
          const widthPct = (row.n / maxN) * 100;

          return (
            <div
              key={row.label}
              className={`grid grid-cols-[1fr_120px] items-center px-5 py-3 gap-4 transition-colors hover:bg-[var(--glass-bg)] ${
                idx < rows.length - 1 ? 'border-b border-[var(--glass-border)]' : ''
              }`}
            >
              {/* Left: Label + Bar */}
              <div className="flex flex-col gap-1.5 min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className="text-xs font-semibold text-[var(--text-primary)] truncate"
                    title={row.label}
                  >
                    {row.label}
                  </span>
                  <span className="text-[10px] text-[var(--text-muted)] shrink-0">
                    avg {row.avg.toFixed(2)}
                  </span>
                </div>

                {/* Stacked bar — width scales relative to maxN */}
                <div className="relative h-2.5 rounded-full overflow-hidden bg-[var(--bg-tertiary)]"
                  style={{ width: `${Math.max(widthPct, 8)}%` }}>
                  {/* Satisfied — green */}
                  <div
                    className="absolute left-0 top-0 h-full"
                    style={{ width: `${satPct}%`, background: '#10b981' }}
                  />
                  {/* Neutral — amber */}
                  <div
                    className="absolute top-0 h-full"
                    style={{ left: `${satPct}%`, width: `${neuPct}%`, background: '#f59e0b' }}
                  />
                  {/* Dissatisfied — red */}
                  <div
                    className="absolute top-0 h-full"
                    style={{ left: `${satPct + neuPct}%`, width: `${disPct}%`, background: '#ef4444' }}
                  />
                </div>

                {/* Pct labels */}
                <div className="flex gap-3 text-[10px]">
                  {satPct > 0 && (
                    <span style={{ color: '#10b981' }}>
                      {satPct.toFixed(1)}% sat
                    </span>
                  )}
                  {neuPct > 0 && (
                    <span style={{ color: '#f59e0b' }}>
                      {neuPct.toFixed(1)}% neu
                    </span>
                  )}
                  {disPct > 0 && (
                    <span style={{ color: '#ef4444' }}>
                      {disPct.toFixed(1)}% dis
                    </span>
                  )}
                </div>
              </div>

              {/* Right: Count */}
              <div className="text-right">
                <p className="text-sm font-bold text-[var(--text-primary)]">
                  {row.n.toLocaleString()}
                </p>
                <p className="text-[10px] text-[var(--text-muted)]">
                  ({((row.n / records.filter(r => r[driver] !== null).length) * 100).toFixed(1)}%)
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
