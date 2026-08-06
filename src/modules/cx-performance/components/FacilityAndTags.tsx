'use client';

import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { CSATRecord } from '@/modules/common/types';

interface Props { records: CSATRecord[]; }

function getScoreColor(s: number): string {
  if (s >= 4.0) return '#10b981';
  if (s >= 3.0) return '#f59e0b';
  return '#ef4444';
}

/* ── Facility Rankings ── */
export function FacilityRankings({ records }: Props) {
  const facilityStats = useMemo(() => {
    const map = new Map<string, {
      facility_type: string; bu: string; location: string;
      overallSum: number; overallCnt: number;
      peopleSum: number;  peopleCnt: number;
      processSum: number; processCnt: number;
      premisesSum: number; premisesCnt: number;
    }>();

    records.forEach(r => {
      const key = r.facility_id || r.facility_type || 'Unknown';
      const cur = map.get(key) ?? {
        facility_type: r.facility_type, bu: r.bu, location: r.location,
        overallSum: 0, overallCnt: 0,
        peopleSum: 0,  peopleCnt: 0,
        processSum: 0, processCnt: 0,
        premisesSum: 0, premisesCnt: 0,
      };

      if (r.overall_score !== null)  { cur.overallSum += r.overall_score;   cur.overallCnt++; }
      if (r.people_score !== null)   { cur.peopleSum += r.people_score;     cur.peopleCnt++; }
      if (r.process_score !== null)  { cur.processSum += r.process_score;   cur.processCnt++; }
      if (r.premises_score !== null) { cur.premisesSum += r.premises_score; cur.premisesCnt++; }

      map.set(key, cur);
    });

    return Array.from(map.entries())
      .map(([id, v]) => ({
        id, facility_type: v.facility_type, bu: v.bu, location: v.location,
        overall:  v.overallCnt  ? Number((v.overallSum  / v.overallCnt).toFixed(2))  : 0,
        count: v.overallCnt || v.peopleCnt || v.premisesCnt || 1,
      }))
      .filter(r => r.count >= 3)
      .sort((a, b) => b.overall - a.overall);
  }, [records]);

  const top5 = facilityStats.slice(0, 5);
  const bot5 = [...facilityStats].sort((a, b) => a.overall - b.overall).slice(0, 5);

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
          <h3 className="text-sm font-semibold text-emerald-400 mb-3">↑ Top 5 Highest Performing</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={top5} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis type="number" domain={[0, 5]} tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} />
              <YAxis dataKey="facility_type" type="category" width={140} tick={{ fill: 'var(--text-secondary)', fontSize: 10 }} />
              <Tooltip itemStyle={{ color: "#ffffff", fontSize: 12, fontWeight: 600 }} labelStyle={{ color: "#94a3b8", fontSize: 11 }} contentStyle={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8, color: "#ffffff" }} />
              <Bar dataKey="overall" radius={[0, 6, 6, 0]}>
                {top5.map((entry, idx) => (
                  <Cell key={idx} fill={getScoreColor(entry.overall)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Bottom 5 */}
        <div className="glass-card">
          <h3 className="text-sm font-semibold text-red-400 mb-3">↓ Bottom 5 Lowest Performing</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={bot5} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis type="number" domain={[0, 5]} tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} />
              <YAxis dataKey="facility_type" type="category" width={140} tick={{ fill: 'var(--text-secondary)', fontSize: 10 }} />
              <Tooltip itemStyle={{ color: "#ffffff", fontSize: 12, fontWeight: 600 }} labelStyle={{ color: "#94a3b8", fontSize: 11 }} contentStyle={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8, color: "#ffffff" }} />
              <Bar dataKey="overall" radius={[0, 6, 6, 0]}>
                {bot5.map((entry, idx) => (
                  <Cell key={idx} fill={getScoreColor(entry.overall)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
}

/* ── Tags Cloud ── */
export function TagsCloud({ records }: Props) {
  const tagData = useMemo(() => {
    const counts = new Map<string, number>();
    records.forEach(r => {
      if (!r.tags) return;
      r.tags.split(',').forEach(tag => {
        const t = tag.trim().toLowerCase();
        if (t && t.length > 2) counts.set(t, (counts.get(t) || 0) + 1);
      });
    });
    return Array.from(counts.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 30);
  }, [records]);

  if (!tagData.length) return null;
  const maxCount = tagData[0]?.count || 1;

  return (
    <section className="mt-10 animate-in">
      <div className="flex items-center gap-3 mb-6">
        <span className="text-2xl">☁️</span>
        <h2 className="text-xl font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>
          Most Mentioned Topics
        </h2>
      </div>
      <div className="glass-card">
        <div className="flex flex-wrap gap-2 justify-center">
          {tagData.map(t => {
            const intensity = Math.max(0.3, t.count / maxCount);
            const size = 11 + (t.count / maxCount) * 10;
            return (
              <span
                key={t.tag}
                className="px-3 py-1 rounded-full border transition-all duration-200 hover:scale-105 cursor-default"
                style={{
                  borderColor: `rgba(99, 102, 241, ${intensity})`,
                  background: `rgba(99, 102, 241, ${intensity * 0.15})`,
                  color: `rgba(129, 140, 248, ${Math.max(0.5, intensity)})`,
                  fontSize: `${size}px`,
                  fontWeight: intensity > 0.6 ? 600 : 400,
                }}
                title={`${t.tag}: ${t.count} mentions`}
              >
                {t.tag} <sup className="text-[9px] opacity-60">{t.count}</sup>
              </span>
            );
          })}
        </div>
      </div>
    </section>
  );
}
