'use client';

import React, { useMemo } from 'react';
import type { SensumRecord } from '../hooks/use-sensum-data';

interface Props { records: SensumRecord[]; }

const SENTIMENT_BADGE: Record<string, string> = {
  'Positive': 'bg-emerald-500/20 text-emerald-400',
  'Neutral':  'bg-indigo-500/20  text-indigo-400',
  'Negative': 'bg-red-500/20     text-red-400',
};

const SCORE_COLOR = (s: number | null) => {
  if (!s) return 'text-[var(--text-muted)]';
  if (s >= 4) return 'text-emerald-400';
  if (s >= 3) return 'text-amber-400';
  return 'text-red-400';
};

export default function SensumFacilityTable({ records }: Props) {
  const facilityStats = useMemo(() => {
    const map = new Map<string, { facility_type: string; bu: string; location: string; sum: number; count: number; neg: number }>();
    records.forEach(r => {
      const key = r.facility_id || r.facility_type || 'Unknown';
      const cur = map.get(key) ?? { facility_type: r.facility_type, bu: r.bu, location: r.location, sum: 0, count: 0, neg: 0 };
      if (r.overall_score !== null) {
        cur.sum += r.overall_score;
        cur.count++;
      }
      if (r.sentiment === 'Negative') cur.neg++;
      map.set(key, cur);
    });
    return Array.from(map.entries())
      .map(([id, v]) => ({
        id,
        facility_type: v.facility_type,
        bu: v.bu,
        location: v.location,
        avg: v.count ? Number((v.sum / v.count).toFixed(2)) : 0,
        count: v.count,
        neg: v.neg,
      }))
      .filter(r => r.count >= 3)
      .sort((a, b) => b.count - a.count);
  }, [records]);

  const top5 = [...facilityStats].sort((a, b) => b.avg - a.avg).slice(0, 5);
  const bot5 = [...facilityStats].sort((a, b) => a.avg - b.avg).slice(0, 5);

  return (
    <section className="mt-8 animate-in">
      <div className="flex items-center gap-3 mb-6">
        <span className="text-2xl">🏆</span>
        <h2 className="text-xl font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>
          Facility Performance Rankings
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {/* Top 5 */}
        <div className="glass-card !p-0 overflow-hidden">
          <div className="p-4 bg-emerald-900/20 border-b border-[var(--glass-border)] flex items-center gap-2">
            <span className="text-emerald-400 font-bold text-sm">↑ Top 5 Facilities</span>
          </div>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--glass-border)]">
                <th className="p-3 text-xs text-[var(--text-muted)] font-medium uppercase">#</th>
                <th className="p-3 text-xs text-[var(--text-muted)] font-medium uppercase">Facility</th>
                <th className="p-3 text-xs text-[var(--text-muted)] font-medium uppercase text-right">Score</th>
                <th className="p-3 text-xs text-[var(--text-muted)] font-medium uppercase text-right">Resp.</th>
              </tr>
            </thead>
            <tbody>
              {top5.map((f, i) => (
                <tr key={f.id} className="border-b border-[var(--glass-border)] hover:bg-[var(--glass-bg)]">
                  <td className="p-3 text-[var(--text-muted)] font-bold">{i + 1}</td>
                  <td className="p-3">
                    <p className="font-medium text-[var(--text-primary)] truncate max-w-[200px]" title={f.facility_type}>{f.facility_type || f.id}</p>
                    <p className="text-[10px] text-[var(--text-muted)]">{f.bu} · {f.location}</p>
                  </td>
                  <td className="p-3 text-right font-bold text-emerald-400">{f.avg}</td>
                  <td className="p-3 text-right text-[var(--text-secondary)]">{f.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Bottom 5 */}
        <div className="glass-card !p-0 overflow-hidden">
          <div className="p-4 bg-red-900/20 border-b border-[var(--glass-border)] flex items-center gap-2">
            <span className="text-red-400 font-bold text-sm">↓ Bottom 5 Facilities</span>
          </div>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--glass-border)]">
                <th className="p-3 text-xs text-[var(--text-muted)] font-medium uppercase">#</th>
                <th className="p-3 text-xs text-[var(--text-muted)] font-medium uppercase">Facility</th>
                <th className="p-3 text-xs text-[var(--text-muted)] font-medium uppercase text-right">Score</th>
                <th className="p-3 text-xs text-[var(--text-muted)] font-medium uppercase text-right">Neg</th>
              </tr>
            </thead>
            <tbody>
              {bot5.map((f, i) => (
                <tr key={f.id} className="border-b border-[var(--glass-border)] hover:bg-[var(--glass-bg)]">
                  <td className="p-3 text-[var(--text-muted)] font-bold">{i + 1}</td>
                  <td className="p-3">
                    <p className="font-medium text-[var(--text-primary)] truncate max-w-[200px]" title={f.facility_type}>{f.facility_type || f.id}</p>
                    <p className="text-[10px] text-[var(--text-muted)]">{f.bu} · {f.location}</p>
                  </td>
                  <td className="p-3 text-right font-bold text-red-400">{f.avg}</td>
                  <td className="p-3 text-right text-red-400">{f.neg}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* All Facilities Table */}
      <div className="glass-card !p-0 overflow-hidden">
        <div className="p-4 border-b border-[var(--glass-border)] bg-[var(--bg-secondary)] flex justify-between">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">All Facility Performance</h3>
          <span className="text-xs text-[var(--text-muted)]">{facilityStats.length} facilities</span>
        </div>
        <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 bg-[var(--bg-secondary)]">
              <tr className="border-b border-[var(--glass-border)]">
                <th className="p-3 text-xs font-medium text-[var(--text-muted)] uppercase">Facility Type</th>
                <th className="p-3 text-xs font-medium text-[var(--text-muted)] uppercase">BU</th>
                <th className="p-3 text-xs font-medium text-[var(--text-muted)] uppercase">Location</th>
                <th className="p-3 text-xs font-medium text-[var(--text-muted)] uppercase text-right">Avg Score</th>
                <th className="p-3 text-xs font-medium text-[var(--text-muted)] uppercase text-right">Responses</th>
                <th className="p-3 text-xs font-medium text-[var(--text-muted)] uppercase text-right">Negative</th>
              </tr>
            </thead>
            <tbody>
              {facilityStats.slice(0, 80).map((f) => (
                <tr key={f.id} className="border-b border-[var(--glass-border)] hover:bg-[var(--glass-bg)] transition-colors">
                  <td className="p-3 font-medium text-[var(--text-primary)] max-w-[220px] truncate" title={f.facility_type}>{f.facility_type || '—'}</td>
                  <td className="p-3 text-[var(--text-secondary)]">{f.bu}</td>
                  <td className="p-3 text-[var(--text-secondary)] max-w-[120px] truncate">{f.location}</td>
                  <td className={`p-3 text-right font-bold ${SCORE_COLOR(f.avg)}`}>{f.avg}</td>
                  <td className="p-3 text-right text-[var(--text-primary)]">{f.count}</td>
                  <td className="p-3 text-right text-red-400">{f.neg}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
