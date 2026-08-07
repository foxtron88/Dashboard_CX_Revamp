'use client';

import React, { useMemo } from 'react';
import type { CSATRecord } from '@/modules/common/types';
import { useCSATTarget } from '@/modules/common/hooks/use-csat-target';

interface Props { 
  records: CSATRecord[];
  hideHeader?: boolean;
  allRecords?: CSATRecord[];
  fromMonth?: string;
  toMonth?: string;
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
  if (score >= 4.0) return 'var(--accent-success)';
  if (score >= 3.0) return 'var(--accent-warning)';
  return 'var(--accent-danger)';
}

export default function MemberCSATGrid({ records, hideHeader, allRecords, fromMonth, toMonth }: Props) {
  const { target } = useCSATTarget();
  const buStats = useMemo(() => {
    const buNames = Array.from(new Set(records.map(r => r.bu))).sort();
    const stats = buNames.map(bu => {
      const buRecs = records.filter(r => r.bu === bu);
      const calcAvg = (recs: CSATRecord[], key: 'overall_score' | 'people_score' | 'process_score' | 'premises_score') => {
        const vals = recs.map(r => r[key]).filter((v): v is number => v !== null);
        return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
      };
      
      const rawOverall = calcAvg(buRecs, 'overall_score');
      const people = calcAvg(buRecs, 'people_score');
      const process = calcAvg(buRecs, 'process_score');
      const premises = calcAvg(buRecs, 'premises_score');
      
      const calcNewCsat = (recs: CSATRecord[]) => {
        const o = calcAvg(recs, 'overall_score');
        const p = calcAvg(recs, 'people_score');
        const pr = calcAvg(recs, 'process_score');
        const pm = calcAvg(recs, 'premises_score');
        const arr = [o, p, pr, pm].filter(v => v > 0);
        return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
      };

      const csatScore = calcNewCsat(buRecs);
      
      const ratedTotal = buRecs.filter(r => r.overall_score !== null).length;
      const satisfied = buRecs.filter(r => r.overall_group === 'Satisfied').length;
      const csatPct = ratedTotal > 0 ? (satisfied / ratedTotal) * 100 : 0;

      let momDiff: number | null = null;
      let yoyDiff: number | null = null;

      if (allRecords) {
        let fMonth = fromMonth;
        let tMonth = toMonth;
        if (!fMonth && !tMonth) {
           const buMonths = Array.from(new Set(allRecords.filter(r => r.bu === bu).map(r => r.month).filter(Boolean))).sort();
           if (buMonths.length > 0) {
             fMonth = buMonths[buMonths.length - 1];
             tMonth = fMonth;
           }
        }
        
        if (fMonth && tMonth) {
          const curRecs = allRecords.filter(r => r.bu === bu && r.month >= fMonth! && r.month <= tMonth!);
          const curAvg = calcNewCsat(curRecs);

          const shiftMonth = (ym: string) => {
            if (!ym) return ym;
            let [y, m] = ym.split('-').map(Number);
            m -= 1;
            if (m === 0) { m = 12; y -= 1; }
            return `${y}-${String(m).padStart(2, '0')}`;
          };
          
          const shiftYear = (ym: string) => {
            if (!ym) return ym;
            let [y, m] = ym.split('-').map(Number);
            y -= 1;
            return `${y}-${String(m).padStart(2, '0')}`;
          };

          const pmF = shiftMonth(fMonth);
          const pmT = shiftMonth(tMonth);
          const prevMoMRecs = allRecords.filter(r => r.bu === bu && r.month >= pmF && r.month <= pmT);
          const prevMoMAvg = calcNewCsat(prevMoMRecs);
          if (prevMoMRecs.length > 0 && prevMoMAvg > 0) momDiff = curAvg - prevMoMAvg;

          const pyF = shiftYear(fMonth);
          const pyT = shiftYear(tMonth);
          const prevYoYRecs = allRecords.filter(r => r.bu === bu && r.month >= pyF && r.month <= pyT);
          const prevYoYAvg = calcNewCsat(prevYoYRecs);
          if (prevYoYRecs.length > 0 && prevYoYAvg > 0) yoyDiff = curAvg - prevYoYAvg;
        }
      }

      return { bu, total: buRecs.length, rawOverall, csatScore, people, process, premises, csatPct, ratedTotal, momDiff, yoyDiff };
    });

    if (stats.length > 0) {
      const avgStats = {
        bu: 'All Members',
        total: stats.reduce((sum, s) => sum + s.total, 0),
        rawOverall: stats.reduce((sum, s) => sum + s.rawOverall, 0) / stats.length,
        people: stats.reduce((sum, s) => sum + s.people, 0) / stats.length,
        process: stats.reduce((sum, s) => sum + s.process, 0) / stats.length,
        premises: stats.reduce((sum, s) => sum + s.premises, 0) / stats.length,
        csatScore: stats.reduce((sum, s) => sum + s.csatScore, 0) / stats.length,
        csatPct: stats.reduce((sum, s) => sum + s.csatPct, 0) / stats.length,
        ratedTotal: stats.reduce((sum, s) => sum + s.ratedTotal, 0),
        momDiff: stats.reduce((sum, s) => sum + (s.momDiff || 0), 0) / stats.length,
        yoyDiff: stats.reduce((sum, s) => sum + (s.yoyDiff || 0), 0) / stats.length,
      };
      return { allMembers: avgStats, members: stats };
    }
    
    return { allMembers: null, members: stats };
  }, [records, allRecords, fromMonth, toMonth]);

  const allMembersCard = buStats.allMembers;
  const memberCards = buStats.members;

  function renderCard(s: (typeof memberCards)[0], isAllMembers = false) {
    const accent = isAllMembers ? '#10b981' : (BU_COLORS[s.bu] || '#64748b');
    return (
      <div key={s.bu}
        className="glass-card relative overflow-hidden transition-all duration-300 hover:scale-[1.02]"
        style={{ borderColor: `${accent}40` }}
      >
        {/* Header */}
        <div className="flex flex-col items-center justify-center text-center gap-2 mb-5 min-h-[5rem]">
          <div className="h-12 w-full relative flex items-center justify-center">
            {isAllMembers ? (
              <p className="text-[18px] font-bold text-white leading-tight">All Members</p>
            ) : (
              <>
                <img 
                  src={`/images/logos/${s.bu}.png`} 
                  alt={s.bu} 
                  className="w-[120px] h-[48px] object-contain object-center drop-shadow-sm"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                  }}
                />
                <div className="hidden flex flex-col items-center justify-center w-full">
                  <p className="text-[14px] font-bold text-white leading-tight">{s.bu}</p>
                </div>
              </>
            )}
          </div>
          <div className="shrink-0 mt-1">
            <p className="text-[10px] font-medium text-[var(--text-muted)] bg-[var(--bg-secondary)] px-3 py-1 rounded-full border border-[var(--glass-border)] shadow-sm">
              {s.total.toLocaleString()} responses
            </p>
          </div>
        </div>

        {/* Big Score (CSAT Average) */}
        <div className="text-center mb-5 py-4 rounded-xl relative" style={{ background: 'var(--bg-tertiary)' }}>
          {s.csatScore > 0 && s.csatScore < target && (
            <div className="absolute top-0 right-0 -mt-2 -mr-2 bg-red-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full shadow-sm flex items-center gap-1 animate-pulse" title={`Below Target (${target.toFixed(2)})`}>
              <span>⚠️</span> Below Target
            </div>
          )}
          <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest font-semibold mb-1">CSAT Score</p>
          <p className="text-4xl font-extrabold mb-1 flex items-baseline justify-center gap-1" style={{ color: getScoreColor(s.csatScore), fontFamily: 'var(--font-display)' }}>
            <span>{s.csatScore > 0 ? s.csatScore.toFixed(2) : '—'}</span>
            {s.csatScore > 0 && <span className="text-sm font-bold text-[var(--text-muted)]">/5</span>}
          </p>
          <div className="flex items-center justify-center gap-2">
            <p className="text-[10px] font-medium text-[var(--text-muted)]">Target: {target.toFixed(2)}</p>
          </div>
          {(s.momDiff !== null || s.yoyDiff !== null) && (
            <div className="flex items-center justify-center gap-3 mt-2">
              {s.momDiff !== null && (
                <div className={`flex items-center gap-0.5 text-[10px] font-bold ${s.momDiff >= 0 ? 'text-[var(--accent-success)]' : 'text-[var(--accent-danger)]'}`}>
                  {s.momDiff >= 0 ? '▲' : '▼'} {Math.abs(s.momDiff).toFixed(2)} <span className="text-[var(--text-muted)] font-medium">MoM</span>
                </div>
              )}
              {s.yoyDiff !== null && (
                <div className={`flex items-center gap-0.5 text-[10px] font-bold ${s.yoyDiff >= 0 ? 'text-[var(--accent-success)]' : 'text-[var(--accent-danger)]'}`}>
                  {s.yoyDiff >= 0 ? '▲' : '▼'} {Math.abs(s.yoyDiff).toFixed(2)} <span className="text-[var(--text-muted)] font-medium">YoY</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Drivers Grid (No Bars, Colored Labels) */}
        <div className="grid grid-cols-2 gap-2 px-1">
          {[
            { label: 'Overall', val: s.rawOverall, color: '#10b981' },
            { label: 'People', val: s.people, color: '#6366f1' },
            { label: 'Process', val: s.process, color: '#06b6d4' },
            { label: 'Premises', val: s.premises, color: '#ec4899' },
          ].map(d => (
            <div key={d.label} className="flex flex-col items-center justify-center bg-[var(--bg-secondary)] rounded-lg py-2 border border-[var(--glass-border)] transition-colors hover:bg-[var(--glass-bg)]">
              <span className="text-[10px] font-extrabold uppercase tracking-widest mb-1" style={{ color: d.color }}>
                {d.label}
              </span>
              <div className="flex items-center gap-1">
                {d.val > 0 && d.val < target && (
                  <span className="text-[10px] text-red-500 animate-pulse" title={`Below Target (${target.toFixed(2)})`}>⚠️</span>
                )}
                <span className="text-lg font-bold" style={{ color: getScoreColor(d.val), fontFamily: 'var(--font-display)' }}>
                  {d.val > 0 ? d.val.toFixed(2) : '—'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <section className="mt-10 animate-in">
      {!hideHeader && (
        <div className="flex items-center gap-3 mb-6">
          <span className="text-2xl">🏆</span>
          <div>
            <h2 className="text-xl font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>
              CSAT per Member
            </h2>
            <p className="text-xs text-[var(--text-muted)]">3P Driver breakdown: People · Process · Premises</p>
          </div>
        </div>
      )}

      {/* All Members Summary Card */}
      {allMembersCard && (
        <div className="mb-6">
          <div className="max-w-xs mx-auto">
            {renderCard(allMembersCard, true)}
          </div>
        </div>
      )}

      {/* Per-Member Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {memberCards.map(s => renderCard(s, false))}
      </div>
    </section>
  );
}
