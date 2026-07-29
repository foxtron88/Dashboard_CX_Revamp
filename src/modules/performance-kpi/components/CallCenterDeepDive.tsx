'use client';

import React, { useMemo } from 'react';
import {
  ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

/* eslint-disable @typescript-eslint/no-explicit-any */

interface Props {
  data: Record<string, any>;
  months: string[];
  selectedBU: string;
  fromIdx: number;
  toIdx: number;
}

const BU_LIST = ['API', 'HIN', 'IAS', 'IDM - TMII', 'IDM - TWC', 'ITDC', 'Sarinah'];

export default function CallCenterDeepDive({ data, months, selectedBU, fromIdx, toIdx }: Props) {
  const ccData = useMemo(() => {
    const bus = selectedBU === 'ALL' ? BU_LIST : [selectedBU];
    
    let totalVol = 0;
    let sumWT = 0;
    let sumAR = 0;
    let count = 0;

    const monthlyData = months.slice(fromIdx, toIdx + 1).map((m, idx) => {
      const mIdx = fromIdx + idx;
      let mVol = 0;
      let mFCR = 0;
      let mSL = 0;
      let mCount = 0;

      bus.forEach(bu => {
        const cc = data[bu]?.call_center;
        if (!cc) return;
        
        // Monthly Aggregation
        if (typeof cc.volume?.[mIdx] === 'number') mVol += cc.volume[mIdx];
        if (typeof cc.fcr?.[mIdx] === 'number') mFCR += cc.fcr[mIdx];
        if (typeof cc.service_level?.[mIdx] === 'number') mSL += cc.service_level[mIdx];
        if (typeof cc.volume?.[mIdx] === 'number') mCount++;
        
        // Total KPIs aggregation
        if (typeof cc.volume?.[mIdx] === 'number') totalVol += cc.volume[mIdx];
        if (typeof cc.waiting_time?.[mIdx] === 'number') { sumWT += cc.waiting_time[mIdx]; }
        if (typeof cc.abandoned_rate?.[mIdx] === 'number') { sumAR += cc.abandoned_rate[mIdx]; }
        if (typeof cc.volume?.[mIdx] === 'number') count++;
      });

      return {
        month: m,
        volume: mVol,
        fcr: mCount ? Number((mFCR / mCount).toFixed(1)) : 0,
        sl: mCount ? Number((mSL / mCount).toFixed(1)) : 0,
      };
    });

    return {
      monthlyData,
      kpis: {
        totalVolume: totalVol,
        avgWaitTime: count ? Number((sumWT / count).toFixed(1)) : 0,
        abandonedRate: count ? Number((sumAR / count).toFixed(1)) : 0,
      }
    };
  }, [data, months, selectedBU, fromIdx, toIdx]);

  return (
    <section className="mt-10 animate-in">
      <div className="flex items-center gap-3 mb-6">
        <span className="text-2xl">☎️</span>
        <h2 className="text-xl font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>
          Call Center Deep Dive
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* KPI Cards */}
        <div className="lg:col-span-1 flex flex-col gap-4">
          <div className="glass-card text-center flex-1 flex flex-col justify-center">
            <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">Total Call Volume</p>
            <p className="text-3xl font-bold text-[var(--accent-secondary)]" style={{ fontFamily: 'var(--font-display)' }}>
              {ccData.kpis.totalVolume.toLocaleString()}
            </p>
          </div>
          <div className="glass-card text-center flex-1 flex flex-col justify-center">
            <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">Avg Wait Time</p>
            <p className="text-3xl font-bold text-[var(--accent-info)]" style={{ fontFamily: 'var(--font-display)' }}>
              {ccData.kpis.avgWaitTime} <span className="text-sm">sec</span>
            </p>
          </div>
          <div className="glass-card text-center flex-1 flex flex-col justify-center">
            <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">Abandoned Rate</p>
            <p className="text-3xl font-bold text-[var(--accent-danger)]" style={{ fontFamily: 'var(--font-display)' }}>
              {ccData.kpis.abandonedRate}%
            </p>
          </div>
        </div>

        {/* FCR & SL Trend */}
        <div className="glass-card lg:col-span-3">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">First Call Resolution (FCR) & Service Level (SL)</h3>
          <ResponsiveContainer width="100%" height={320}>
            <ComposedChart data={ccData.monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 10 }} />
              <YAxis yAxisId="left" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis yAxisId="right" orientation="right" domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#1a2235', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#f1f5f9' }} />
              <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
              <Area yAxisId="left" type="monotone" dataKey="volume" fill="#6366f120" stroke="#6366f1" strokeWidth={2} name="Volume" />
              <Line yAxisId="right" type="monotone" dataKey="fcr" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} name="FCR (%)" />
              <Line yAxisId="right" type="monotone" dataKey="sl" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} name="Service Level (%)" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
}
