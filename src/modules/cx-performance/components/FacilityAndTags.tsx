'use client';

import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { CSATRecord } from '@/modules/common/types';

interface Props {
  records: CSATRecord[];
}

export function FacilityRankings({ records }: Props) {
  const { top5, bottom5 } = useMemo(() => {
    const groups: Record<string, { sum: number; count: number }> = {};
    records.forEach(r => {
      if (!r.facility_type) return;
      if (!groups[r.facility_type]) groups[r.facility_type] = { sum: 0, count: 0 };
      groups[r.facility_type].sum += r.overall_score;
      groups[r.facility_type].count++;
    });

    const sorted = Object.entries(groups)
      .filter(([, v]) => v.count >= 3)
      .map(([name, v]) => ({ name: name.length > 25 ? name.substring(0, 25) + '…' : name, score: Number((v.sum / v.count).toFixed(2)) }))
      .sort((a, b) => b.score - a.score);

    return {
      top5: sorted.slice(0, 5),
      bottom5: sorted.slice(-5).reverse(),
    };
  }, [records]);

  return (
    <section className="mt-10 animate-in">
      <div className="flex items-center gap-3 mb-6">
        <span className="text-2xl">🏆</span>
        <h2 className="text-xl font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>
          Facility Rankings
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top 5 */}
        <div className="glass-card">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Top 5 Facilities by Score</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={top5} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis type="number" domain={[0, 5]} tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis type="category" dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} width={120} />
              <Tooltip contentStyle={{ background: '#1a2235', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#f1f5f9' }} />
              <Bar dataKey="score" radius={[0, 6, 6, 0]}>
                {top5.map((_, i) => <Cell key={i} fill="#10b981" />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Bottom 5 */}
        <div className="glass-card">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Bottom 5 Facilities by Score</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={bottom5} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis type="number" domain={[0, 5]} tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis type="category" dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} width={120} />
              <Tooltip contentStyle={{ background: '#1a2235', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#f1f5f9' }} />
              <Bar dataKey="score" radius={[0, 6, 6, 0]}>
                {bottom5.map((_, i) => <Cell key={i} fill="#ef4444" />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
}

export function TagsCloud({ records }: Props) {
  const tags = useMemo(() => {
    const freq: Record<string, number> = {};
    records.forEach(r => {
      if (!r.tags) return;
      r.tags.split(',').forEach(t => {
        const tag = t.trim();
        if (tag) freq[tag] = (freq[tag] || 0) + 1;
      });
    });
    return Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 25)
      .map(([tag, count]) => ({ tag, count }));
  }, [records]);

  const maxCount = tags[0]?.count || 1;
  const tagColors = ['#6366f1', '#06b6d4', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899', '#3b82f6', '#ef4444'];

  return (
    <section className="mt-10 animate-in">
      <div className="flex items-center gap-3 mb-6">
        <span className="text-2xl">🏷️</span>
        <h2 className="text-xl font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>
          Most Mentioned Topics
        </h2>
      </div>
      <div className="glass-card">
        <div className="flex flex-wrap gap-2 justify-center">
          {tags.map((t, i) => {
            const size = 0.7 + (t.count / maxCount) * 0.8;
            return (
              <span
                key={t.tag}
                className="px-3 py-1.5 rounded-full font-medium transition-all duration-200 hover:scale-110 cursor-default"
                style={{
                  fontSize: `${size}rem`,
                  background: `${tagColors[i % tagColors.length]}20`,
                  color: tagColors[i % tagColors.length],
                  border: `1px solid ${tagColors[i % tagColors.length]}30`,
                }}
              >
                {t.tag} <span className="text-[var(--text-muted)]">({t.count})</span>
              </span>
            );
          })}
        </div>
      </div>
    </section>
  );
}
