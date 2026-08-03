'use client';

import React, { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Line
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

export default function ComplaintSLA({ data, months, selectedBU, fromIdx, toIdx }: Props) {
  const compData = useMemo(() => {
    const bus = selectedBU === 'ALL' ? BU_LIST : [selectedBU];
    
    let sumTotal = 0;
    let sumCompleted = 0;
    let sumProgress = 0;
    let sumUntouch = 0;
    let sumAvgTime = 0;
    let timeCount = 0;

    const monthlyData = months.slice(fromIdx, toIdx + 1).map((m, idx) => {
      const mIdx = fromIdx + idx;
      let mTotal = 0;
      let mCompleted = 0;
      let mProgress = 0;
      let mUntouch = 0;
      let mRate = 0;
      let rCount = 0;

      bus.forEach(bu => {
        const c = data[bu]?.complaints;
        if (!c) return;
        
        if (typeof c.total?.[mIdx] === 'number') mTotal += c.total[mIdx];
        if (typeof c.completed?.[mIdx] === 'number') mCompleted += c.completed[mIdx];
        if (typeof c.progress?.[mIdx] === 'number') mProgress += c.progress[mIdx];
        if (typeof c.untouch?.[mIdx] === 'number') mUntouch += c.untouch[mIdx];
        if (typeof c.resolution_rate?.[mIdx] === 'number') { mRate += c.resolution_rate[mIdx]; rCount++; }
        
        // Global aggregations
        if (typeof c.total?.[mIdx] === 'number') sumTotal += c.total[mIdx];
        if (typeof c.completed?.[mIdx] === 'number') sumCompleted += c.completed[mIdx];
        if (typeof c.progress?.[mIdx] === 'number') sumProgress += c.progress[mIdx];
        if (typeof c.untouch?.[mIdx] === 'number') sumUntouch += c.untouch[mIdx];
        if (typeof c.avg_time_resolution?.[mIdx] === 'number') { sumAvgTime += c.avg_time_resolution[mIdx]; timeCount++; }
      });

      return {
        month: m,
        total: mTotal,
        completed: mCompleted,
        progress: mProgress,
        untouch: mUntouch,
        resolutionRate: rCount ? Number((mRate / rCount).toFixed(1)) : 0,
      };
    });

    return {
      monthlyData,
      kpis: {
        total: sumTotal,
        completed: sumCompleted,
        progress: sumProgress,
        untouch: sumUntouch,
        avgTime: timeCount ? Number((sumAvgTime / timeCount).toFixed(1)) : 0,
      }
    };
  }, [data, months, selectedBU, fromIdx, toIdx]);

  const kpis = [
    { label: 'Total Complaints', value: compData.kpis.total.toLocaleString(), color: 'var(--text-primary)' },
    { label: 'Completed', value: compData.kpis.completed.toLocaleString(), color: 'var(--accent-success)' },
    { label: 'In Progress', value: compData.kpis.progress.toLocaleString(), color: 'var(--accent-warning)' },
    { label: 'Untouched', value: compData.kpis.untouch.toLocaleString(), color: 'var(--accent-danger)' },
  ];

  return (
    <section className="mt-10 animate-in">
      <div className="flex items-center gap-3 mb-6">
        <span className="text-2xl">🚨</span>
        <h2 className="text-xl font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>
          Complaint Handling & SLA
        </h2>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        {kpis.map(kpi => (
          <div key={kpi.label} className="glass-card text-center">
            <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">{kpi.label}</p>
            <p className="text-2xl font-bold" style={{ color: kpi.color, fontFamily: 'var(--font-display)' }}>
              {kpi.value}
            </p>
          </div>
        ))}
      </div>

      <div className="glass-card">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">SLA Resolution Distribution</h3>
          <div className="text-right">
            <span className="text-xs text-[var(--text-muted)] uppercase">Avg Resolution Time</span>
            <p className="text-lg font-bold text-[var(--accent-info)]">{compData.kpis.avgTime} Days</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={compData.monthlyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 10 }} />
            <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
            <Tooltip itemStyle={{ color: "#ffffff", fontSize: 12, fontWeight: 600 }} labelStyle={{ color: "#94a3b8", fontSize: 11 }} contentStyle={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8, color: "#ffffff" }} />
            <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
            <Bar dataKey="completed" stackId="a" fill="#10b981" name="Completed" />
            <Bar dataKey="progress" stackId="a" fill="#f59e0b" name="In Progress" />
            <Bar dataKey="untouch" stackId="a" fill="#ef4444" name="Untouched" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
