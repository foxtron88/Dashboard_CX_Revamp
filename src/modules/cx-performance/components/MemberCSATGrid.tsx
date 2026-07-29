'use client';

import React, { useMemo } from 'react';
import type { CSATRecord } from '@/modules/common/types';

interface Props {
  records: CSATRecord[];
}

function getScore(recs: CSATRecord[], field: keyof CSATRecord) {
  if (!recs.length) return 0;
  const sum = recs.reduce((a, r) => a + (Number(r[field]) || 0), 0);
  return Number((sum / recs.length).toFixed(2));
}

function getScoreColor(score: number) {
  if (score >= 4.5) return 'var(--accent-success)';
  if (score >= 3.5) return 'var(--accent-info)';
  if (score >= 2.5) return 'var(--accent-warning)';
  return 'var(--accent-danger)';
}

export default function MemberCSATGrid({ records }: Props) {
  const buScores = useMemo(() => {
    const groups: Record<string, CSATRecord[]> = {};
    records.forEach(r => {
      if (!r.source) return;
      if (!groups[r.source]) groups[r.source] = [];
      groups[r.source].push(r);
    });

    return Object.entries(groups)
      .map(([bu, recs]) => ({
        bu,
        overall: getScore(recs, 'overall_score'),
        ppl: getScore(recs, 'staff_score'),
        prc: getScore(recs, 'cleanliness_score'),
        prm: getScore(recs, 'facility_score'),
        count: recs.length,
      }))
      .sort((a, b) => b.overall - a.overall);
  }, [records]);

  return (
    <section className="mt-10 animate-in">
      <div className="flex items-center gap-3 mb-6">
        <span className="text-2xl">🏢</span>
        <div>
          <h2 className="text-xl font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>
            CSAT per Member
          </h2>
          <p className="text-sm text-[var(--text-muted)]">Individual Business Unit Performance</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {buScores.map(bu => (
          <div key={bu.bu} className="glass-card">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-[var(--text-primary)]">{bu.bu}</h3>
              <span className="text-xs text-[var(--text-muted)] bg-[var(--bg-tertiary)] px-2 py-1 rounded-full">
                {bu.count} responses
              </span>
            </div>

            <p className="text-3xl font-bold mb-3" style={{ color: getScoreColor(bu.overall), fontFamily: 'var(--font-display)' }}>
              {bu.overall.toFixed(2)}
            </p>

            <div className="space-y-2">
              {[
                { label: 'PPL', value: bu.ppl, icon: '👥' },
                { label: 'PRC', value: bu.prc, icon: '🔄' },
                { label: 'PRM', value: bu.prm, icon: '🏢' },
              ].map(d => (
                <div key={d.label} className="flex items-center justify-between text-sm">
                  <span className="text-[var(--text-muted)]">{d.icon} {d.label}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-16 bg-[var(--bg-tertiary)] rounded-full h-1.5">
                      <div
                        className="h-1.5 rounded-full transition-all duration-500"
                        style={{ width: `${(d.value / 5) * 100}%`, background: getScoreColor(d.value) }}
                      />
                    </div>
                    <span className="text-xs font-medium" style={{ color: getScoreColor(d.value) }}>
                      {d.value.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
