'use client';

import React, { useMemo } from 'react';
import type { SensumRecord } from '../hooks/use-sensum-data';

interface Props { records: SensumRecord[]; }

const SCORE_COLOR = (s: number | null) => {
  if (s === null || s === 0) return 'text-[var(--text-muted)]';
  if (s >= 4.5) return 'text-emerald-400 font-semibold';
  if (s >= 4.0) return 'text-cyan-400 font-semibold';
  if (s >= 3.0) return 'text-amber-400 font-semibold';
  return 'text-red-400 font-semibold';
};

export default function SensumFacilityTable({ records }: Props) {
  const facilityStats = useMemo(() => {
    const map = new Map<string, {
      facility_type: string; bu: string; location: string;
      overallSum: number; overallCnt: number;
      peopleSum: number;  peopleCnt: number;
      processSum: number; processCnt: number;
      premisesSum: number; premisesCnt: number;
      neg: number;
    }>();

    records.forEach(r => {
      const key = r.facility_id || r.facility_type || 'Unknown';
      const cur = map.get(key) ?? {
        facility_type: r.facility_type, bu: r.bu, location: r.location,
        overallSum: 0, overallCnt: 0,
        peopleSum: 0,  peopleCnt: 0,
        processSum: 0, processCnt: 0,
        premisesSum: 0, premisesCnt: 0,
        neg: 0
      };

      if (r.overall_score !== null)  { cur.overallSum += r.overall_score;   cur.overallCnt++; }
      if (r.people_score !== null)   { cur.peopleSum += r.people_score;     cur.peopleCnt++; }
      if (r.process_score !== null)  { cur.processSum += r.process_score;   cur.processCnt++; }
      if (r.premises_score !== null) { cur.premisesSum += r.premises_score; cur.premisesCnt++; }
      if (r.sentiment === 'Negative') cur.neg++;

      map.set(key, cur);
    });

    return Array.from(map.entries())
      .map(([id, v]) => ({
        id,
        facility_type: v.facility_type,
        bu: v.bu,
        location: v.location,
        overall:  v.overallCnt  ? Number((v.overallSum  / v.overallCnt).toFixed(2))  : null,
        people:   v.peopleCnt   ? Number((v.peopleSum   / v.peopleCnt).toFixed(2))   : null,
        process:  v.processCnt  ? Number((v.processSum  / v.processCnt).toFixed(2))  : null,
        premises: v.premisesCnt ? Number((v.premisesSum / v.premisesCnt).toFixed(2)) : null,
        count: v.overallCnt || v.premisesCnt || 1,
        neg: v.neg,
      }))
      .filter(r => r.count >= 3)
      .sort((a, b) => (b.overall ?? 0) - (a.overall ?? 0));
  }, [records]);

  const top5 = [...facilityStats].sort((a, b) => (b.overall ?? 0) - (a.overall ?? 0)).slice(0, 5);
  const bot5 = [...facilityStats].sort((a, b) => (a.overall ?? 0) - (b.overall ?? 0)).slice(0, 5);

  return (
    <section className="mt-8 animate-in">
      <div className="flex items-center gap-3 mb-6">
        <span className="text-2xl">🏆</span>
        <div>
          <h2 className="text-xl font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>
            Facility Performance & Cascaded Driver Rankings
          </h2>
          <p className="text-xs text-[var(--text-muted)]">Breakdown across Overall, People (PPL), Process (PRC), Premises (PRM)</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {/* Top 5 */}
        <div className="glass-card !p-0 overflow-hidden">
          <div className="p-4 bg-emerald-900/20 border-b border-[var(--glass-border)] flex items-center justify-between">
            <span className="text-emerald-400 font-bold text-sm">↑ Top 5 Facilities</span>
            <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Overall / PPL / PRC / PRM</span>
          </div>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--glass-border)]">
                <th className="p-3 text-xs text-[var(--text-muted)] font-medium uppercase">#</th>
                <th className="p-3 text-xs text-[var(--text-muted)] font-medium uppercase">Facility</th>
                <th className="p-3 text-xs text-[var(--text-muted)] font-medium uppercase text-right">Overall</th>
                <th className="p-3 text-xs text-[var(--text-muted)] font-medium uppercase text-right">PPL</th>
                <th className="p-3 text-xs text-[var(--text-muted)] font-medium uppercase text-right">PRC</th>
                <th className="p-3 text-xs text-[var(--text-muted)] font-medium uppercase text-right">PRM</th>
              </tr>
            </thead>
            <tbody>
              {top5.map((f, i) => (
                <tr key={f.id} className="border-b border-[var(--glass-border)] hover:bg-[var(--glass-bg)]">
                  <td className="p-3 text-[var(--text-muted)] font-bold">{i + 1}</td>
                  <td className="p-3">
                    <p className="font-medium text-[var(--text-primary)] truncate max-w-[180px]" title={f.facility_type}>{f.facility_type || f.id}</p>
                    <p className="text-[10px] text-[var(--text-muted)]">{f.bu} · {f.location}</p>
                  </td>
                  <td className={`p-3 text-right font-bold ${SCORE_COLOR(f.overall)}`}>{f.overall ?? '—'}</td>
                  <td className={`p-3 text-right text-xs ${SCORE_COLOR(f.people)}`}>{f.people ?? '—'}</td>
                  <td className={`p-3 text-right text-xs ${SCORE_COLOR(f.process)}`}>{f.process ?? '—'}</td>
                  <td className={`p-3 text-right text-xs ${SCORE_COLOR(f.premises)}`}>{f.premises ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Bottom 5 */}
        <div className="glass-card !p-0 overflow-hidden">
          <div className="p-4 bg-red-900/20 border-b border-[var(--glass-border)] flex items-center justify-between">
            <span className="text-red-400 font-bold text-sm">↓ Bottom 5 Facilities</span>
            <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Overall / PPL / PRC / PRM</span>
          </div>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--glass-border)]">
                <th className="p-3 text-xs text-[var(--text-muted)] font-medium uppercase">#</th>
                <th className="p-3 text-xs text-[var(--text-muted)] font-medium uppercase">Facility</th>
                <th className="p-3 text-xs text-[var(--text-muted)] font-medium uppercase text-right">Overall</th>
                <th className="p-3 text-xs text-[var(--text-muted)] font-medium uppercase text-right">PPL</th>
                <th className="p-3 text-xs text-[var(--text-muted)] font-medium uppercase text-right">PRC</th>
                <th className="p-3 text-xs text-[var(--text-muted)] font-medium uppercase text-right">PRM</th>
              </tr>
            </thead>
            <tbody>
              {bot5.map((f, i) => (
                <tr key={f.id} className="border-b border-[var(--glass-border)] hover:bg-[var(--glass-bg)]">
                  <td className="p-3 text-[var(--text-muted)] font-bold">{i + 1}</td>
                  <td className="p-3">
                    <p className="font-medium text-[var(--text-primary)] truncate max-w-[180px]" title={f.facility_type}>{f.facility_type || f.id}</p>
                    <p className="text-[10px] text-[var(--text-muted)]">{f.bu} · {f.location}</p>
                  </td>
                  <td className={`p-3 text-right font-bold ${SCORE_COLOR(f.overall)}`}>{f.overall ?? '—'}</td>
                  <td className={`p-3 text-right text-xs ${SCORE_COLOR(f.people)}`}>{f.people ?? '—'}</td>
                  <td className={`p-3 text-right text-xs ${SCORE_COLOR(f.process)}`}>{f.process ?? '—'}</td>
                  <td className={`p-3 text-right text-xs ${SCORE_COLOR(f.premises)}`}>{f.premises ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* All Facilities Table */}
      <div className="glass-card !p-0 overflow-hidden">
        <div className="p-4 border-b border-[var(--glass-border)] bg-[var(--bg-secondary)] flex justify-between items-center">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">All Facility Cascaded CSAT Ratings</h3>
          <span className="text-xs text-[var(--text-muted)]">{facilityStats.length} facilities</span>
        </div>
        <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 bg-[var(--bg-secondary)]">
              <tr className="border-b border-[var(--glass-border)]">
                <th className="p-3 text-xs font-medium text-[var(--text-muted)] uppercase">Facility Type</th>
                <th className="p-3 text-xs font-medium text-[var(--text-muted)] uppercase">BU</th>
                <th className="p-3 text-xs font-medium text-[var(--text-muted)] uppercase">Location</th>
                <th className="p-3 text-xs font-medium text-[var(--text-muted)] uppercase text-right">Overall</th>
                <th className="p-3 text-xs font-medium text-[var(--text-muted)] uppercase text-right">People (PPL)</th>
                <th className="p-3 text-xs font-medium text-[var(--text-muted)] uppercase text-right">Process (PRC)</th>
                <th className="p-3 text-xs font-medium text-[var(--text-muted)] uppercase text-right">Premises (PRM)</th>
                <th className="p-3 text-xs font-medium text-[var(--text-muted)] uppercase text-right">Responses</th>
                <th className="p-3 text-xs font-medium text-[var(--text-muted)] uppercase text-right">Negative</th>
              </tr>
            </thead>
            <tbody>
              {facilityStats.slice(0, 100).map((f) => (
                <tr key={f.id} className="border-b border-[var(--glass-border)] hover:bg-[var(--glass-bg)] transition-colors">
                  <td className="p-3 font-medium text-[var(--text-primary)] max-w-[200px] truncate" title={f.facility_type}>{f.facility_type || '—'}</td>
                  <td className="p-3 text-[var(--text-secondary)]">{f.bu}</td>
                  <td className="p-3 text-[var(--text-secondary)] max-w-[120px] truncate">{f.location}</td>
                  <td className={`p-3 text-right ${SCORE_COLOR(f.overall)}`}>{f.overall ?? '—'}</td>
                  <td className={`p-3 text-right ${SCORE_COLOR(f.people)}`}>{f.people ?? '—'}</td>
                  <td className={`p-3 text-right ${SCORE_COLOR(f.process)}`}>{f.process ?? '—'}</td>
                  <td className={`p-3 text-right ${SCORE_COLOR(f.premises)}`}>{f.premises ?? '—'}</td>
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
