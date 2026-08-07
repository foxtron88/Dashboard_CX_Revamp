'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { CSATRecord } from '@/modules/common/types';
import type { SocmedData } from '@/modules/common/hooks/use-socmed-data';
import MemberCSATGrid from '@/modules/cx-performance/components/MemberCSATGrid';
import DriverSatisfactionBars from '@/modules/cx-performance/components/DriverSatisfactionBars';
import ExecutiveSummaryTopMetrics from './ExecutiveSummaryTopMetrics';

interface Props {
  csatRecords: CSATRecord[] | null;
  perfData: Record<string, unknown> | null;
  socmedData: SocmedData | null;
}

const CX_BUS = ['API', 'IDM', 'ITDC', 'Sarinah'] as const;
const PERF_BUS = ['API', 'IAS', 'IDM', 'HIN', 'ITDC', 'SNH'] as const;
const PERF_BU_MAP: Record<string, string[]> = {
  API: ['API'],
  IAS: ['IAS'],
  IDM: ['IDM - TMII', 'IDM - TWC'],
  HIN: ['HIN'],
  ITDC: ['ITDC'],
  SNH: ['Sarinah'],
};

function BUGroupLabel({ label }: { label: string }) {
  return (
    <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2 mt-4 flex items-center gap-2">
      <span className="inline-block w-3 h-[1px] bg-[var(--text-muted)]" />
      {label}
    </p>
  );
}

export default function ExecutiveSummaryView({ csatRecords, perfData, socmedData }: Props) {
  const [fromMonth, setFromMonth] = useState('');
  const [toMonth, setToMonth] = useState('');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pd = perfData as Record<string, any> | null;
  const months: string[] = (pd?._months as string[]) || [];

  function monthLabelToIdx(ym: string, fallback: number): number {
    if (!ym || !months.length) return fallback;
    const [year, month] = ym.split('-').map(Number);
    const shortYear = String(year).slice(-2);
    const shortMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const label = `${shortMonths[month - 1]} ${shortYear}`;
    const idx = months.indexOf(label);
    return idx >= 0 ? idx : fallback;
  }

  const fromIdx = monthLabelToIdx(fromMonth, 0);
  const toIdx = monthLabelToIdx(toMonth, months.length - 1);

  const csatStats = useMemo(() => {
    const compute = (recs: CSATRecord[]) => {
      const avgOf = (key: 'overall_score' | 'people_score' | 'process_score' | 'premises_score') => {
        const vals = recs.map(r => r[key]).filter((v): v is number => v !== null);
        return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
      };
      return {
        overall: avgOf('overall_score'),
        people: avgOf('people_score'),
        process: avgOf('process_score'),
        premises: avgOf('premises_score'),
        count: recs.length,
      };
    };

    const filterMonth = (recs: CSATRecord[]) => {
      if (!fromMonth && !toMonth) return recs;
      return recs.filter(r => {
        if (fromMonth && r.month && r.month < fromMonth) return false;
        if (toMonth && r.month && r.month > toMonth) return false;
        return true;
      });
    };

    if (!csatRecords) return null;
    const filtered = filterMonth(csatRecords);
    const overall = compute(filtered);
    const byBU: Record<string, ReturnType<typeof compute>> = {};
    let totalMemberCsat = 0;
    let memberCount = 0;
    for (const bu of CX_BUS) {
      const bStats = compute(filtered.filter(r => r.bu === bu));
      byBU[bu] = bStats;
      if (bStats.count > 0) {
        const buCsat = (bStats.overall + bStats.people + bStats.process + bStats.premises) / 4;
        totalMemberCsat += buCsat;
        memberCount++;
      }
    }
    const averageCsat = memberCount > 0 ? totalMemberCsat / memberCount : 0;
    
    return { overall, byBU, filtered, averageCsat };
  }, [csatRecords, fromMonth, toMonth]);

  const opsStats = useMemo(() => {
    if (!pd) return null;
    const sumRange = (arr: number[] | undefined) => {
      if (!arr) return 0;
      const s = Math.max(0, fromIdx);
      const e = Math.min(toIdx, arr.length - 1);
      return arr.slice(s, e + 1).reduce((a, b) => a + (b || 0), 0);
    };
    const computeBUs = (buKeys: string[]) => {
      let vis = 0, inter = 0;
      buKeys.forEach(bk => {
        vis += sumRange(pd[bk]?.statistik?.jumlah_pengunjung);
        inter += sumRange(pd[bk]?.statistik?.total_interaksi);
      });
      return { visitors: vis, interactions: inter };
    };
    const overall = computeBUs(Object.keys(pd).filter(k => !k.startsWith('_')));
    const byBU: Record<string, { visitors: number; interactions: number }> = {};
    for (const bu of PERF_BUS) {
      byBU[bu] = computeBUs(PERF_BU_MAP[bu]);
    }
    return { overall, byBU };
  }, [pd, fromIdx, toIdx]);
  const selectClass = `bg-[var(--bg-tertiary)] border border-[var(--glass-border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent-primary)] transition-all duration-200`;

  return (
    <div className="space-y-8">
      {/* ── 1. CSAT HOLDING PERFORMANCE ─────────────────────────────────────────────── */}
      <section className="animate-in">
        {csatStats ? (
          <>
            <ExecutiveSummaryTopMetrics 
              socmedStats={socmedData?.global || null} 
              opsStats={opsStats || null} 
            />
            <div className="mt-2">
              <MemberCSATGrid 
                records={csatStats.filtered} 
                hideHeader 
                allRecords={csatRecords || undefined}
                fromMonth={fromMonth}
                toMonth={toMonth}
              />
            </div>
            
            {/* BU Deep Dive Charts */}
            <div className="mt-8">
              <div className="flex flex-col gap-4">
                <DriverSatisfactionBars records={csatStats.filtered} />
              </div>
            </div>


          </>
        ) : (
          <div className="glass-card text-center py-8 text-[var(--text-muted)]">No CSAT data loaded</div>
        )}
      </section>

    </div>
  );
}
