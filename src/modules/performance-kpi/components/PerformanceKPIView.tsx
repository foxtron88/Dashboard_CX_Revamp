'use client';

import React, { useState } from 'react';
import CSATRadarAndTrend from './CSATRadarAndTrend';
import BranchServicePerformance from './BranchServicePerformance';
import CallCenterDeepDive from './CallCenterDeepDive';
import ComplaintSLA from './ComplaintSLA';

/* eslint-disable @typescript-eslint/no-explicit-any */

interface Props {
  data: Record<string, any>;
  months: string[];
}

const BU_LIST = ['API', 'HIN', 'IAS', 'IDM - TMII', 'IDM - TWC', 'ITDC', 'Sarinah'];

export default function PerformanceKPIView({ data, months }: Props) {
  const [selectedBU, setSelectedBU] = useState('ALL');
  const [monthFrom, setMonthFrom] = useState('ALL');
  const [monthTo, setMonthTo] = useState('ALL');

  const fromIdx = monthFrom === 'ALL' ? 0 : Number(monthFrom);
  const toIdx = monthTo === 'ALL' ? months.length - 1 : Number(monthTo);

  const selectClass = `
    bg-[var(--bg-tertiary)] border border-[var(--glass-border)] rounded-lg px-3 py-2
    text-sm text-[var(--text-primary)] outline-none
    focus:border-[var(--accent-primary)] transition-all duration-200 min-w-[140px]
  `;

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="glass-card !p-4 flex flex-wrap items-end gap-4 animate-in">
        <div className="flex flex-col">
          <label className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-1">Business Unit</label>
          <select className={selectClass} value={selectedBU} onChange={e => setSelectedBU(e.target.value)}>
            <option value="ALL">All Business Units</option>
            {BU_LIST.map(bu => <option key={bu} value={bu}>{bu}</option>)}
          </select>
        </div>
        <div className="flex flex-col">
          <label className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-1">Month From</label>
          <select className={selectClass} value={monthFrom} onChange={e => setMonthFrom(e.target.value)}>
            <option value="ALL">All Months</option>
            {months.map((m, i) => <option key={i} value={i}>{m}</option>)}
          </select>
        </div>
        <div className="flex flex-col">
          <label className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-1">Month To</label>
          <select className={selectClass} value={monthTo} onChange={e => setMonthTo(e.target.value)}>
            <option value="ALL">All Months</option>
            {months.map((m, i) => <option key={i} value={i}>{m}</option>)}
          </select>
        </div>
      </div>

      <div className="flex items-center gap-3 mt-8">
        <span className="text-2xl">📊</span>
        <div>
          <h2 className="text-xl font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>
            Performance KPI Analytics
          </h2>
          <p className="text-sm text-[var(--text-muted)]">Operational Standards & SLA Tracking</p>
        </div>
      </div>

      <CSATRadarAndTrend data={data} months={months} selectedBU={selectedBU} fromIdx={fromIdx} toIdx={toIdx} />
      <BranchServicePerformance data={data} selectedBU={selectedBU} fromIdx={fromIdx} toIdx={toIdx} />
      <CallCenterDeepDive data={data} months={months} selectedBU={selectedBU} fromIdx={fromIdx} toIdx={toIdx} />
      <ComplaintSLA data={data} months={months} selectedBU={selectedBU} fromIdx={fromIdx} toIdx={toIdx} />
    </div>
  );
}
