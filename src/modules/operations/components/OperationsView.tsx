'use client';

import React, { useMemo, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell,
  LineChart, Line, ComposedChart, Area,
} from 'recharts';

/* eslint-disable @typescript-eslint/no-explicit-any */

interface Props {
  data: Record<string, any>;
  months: string[];
}

const BU_LIST = ['API', 'HIN', 'IAS', 'IDM - TMII', 'IDM - TWC', 'ITDC', 'Sarinah'];

const CATEGORY_COLORS: Record<string, string> = {
  pengaduan: '#ef4444',
  permohonan: '#f59e0b',
  informasi: '#3b82f6',
  pertanyaan: '#06b6d4',
  apresiasi: '#10b981',
  laporan: '#8b5cf6',
};

export default function OperationsView({ data, months }: Props) {
  const [selectedBU, setSelectedBU] = useState('ALL');
  const [monthFrom, setMonthFrom] = useState('ALL');
  const [monthTo, setMonthTo] = useState('ALL');

  const fromIdx = monthFrom === 'ALL' ? 0 : Number(monthFrom);
  const toIdx = monthTo === 'ALL' ? months.length - 1 : Number(monthTo);

  // Aggregate data across BUs or use single BU
  const aggregated = useMemo(() => {
    const busToUse = selectedBU === 'ALL' ? BU_LIST : [selectedBU];

    // Sum interactions
    const interactionKeys = ['pengaduan', 'permohonan', 'informasi', 'pertanyaan', 'apresiasi', 'laporan'];
    const interactionTotals: Record<string, number> = {};
    interactionKeys.forEach(k => {
      interactionTotals[k] = 0;
      busToUse.forEach(bu => {
        const arr = data[bu]?.interactions?.[k] || [];
        for (let i = fromIdx; i <= toIdx && i < arr.length; i++) {
          interactionTotals[k] += (arr[i] || 0);
        }
      });
    });

    // Sum visitors & total interactions
    let totalVisitors = 0;
    let totalInteractions = 0;
    busToUse.forEach(bu => {
      const vArr = data[bu]?.statistik?.jumlah_pengunjung || [];
      const iArr = data[bu]?.statistik?.total_interaksi || [];
      for (let i = fromIdx; i <= toIdx && i < Math.max(vArr.length, iArr.length); i++) {
        totalVisitors += (vArr[i] || 0);
        totalInteractions += (iArr[i] || 0);
      }
    });

    // Monthly visitor vs interaction chart data
    const monthlyChart = months.slice(fromIdx, toIdx + 1).map((m, idx) => {
      const mIdx = fromIdx + idx;
      let visitors = 0;
      let interactions = 0;
      busToUse.forEach(bu => {
        visitors += data[bu]?.statistik?.jumlah_pengunjung?.[mIdx] || 0;
        interactions += data[bu]?.statistik?.total_interaksi?.[mIdx] || 0;
      });
      return { month: m, visitors, interactions };
    });

    // Call center aggregated
    let callVolume = 0;
    let fcrSum = 0;
    let slSum = 0;
    let ccCount = 0;
    busToUse.forEach(bu => {
      const cc = data[bu]?.call_center;
      if (!cc) return;
      for (let i = fromIdx; i <= toIdx && i < (cc.volume?.length || 0); i++) {
        callVolume += (cc.volume?.[i] || 0);
        fcrSum += (cc.fcr?.[i] || 0);
        slSum += (cc.service_level?.[i] || 0);
        ccCount++;
      }
    });

    // Monthly call center chart
    const callCenterChart = months.slice(fromIdx, toIdx + 1).map((m, idx) => {
      const mIdx = fromIdx + idx;
      let vol = 0;
      let fcr = 0;
      let sl = 0;
      let cnt = 0;
      busToUse.forEach(bu => {
        const cc = data[bu]?.call_center;
        if (!cc) return;
        vol += cc.volume?.[mIdx] || 0;
        fcr += cc.fcr?.[mIdx] || 0;
        sl += cc.service_level?.[mIdx] || 0;
        cnt++;
      });
      return {
        month: m,
        volume: vol,
        fcr: cnt ? Number((fcr / cnt).toFixed(1)) : 0,
        serviceLevel: cnt ? Number((sl / cnt).toFixed(1)) : 0,
      };
    });

    return {
      interactionTotals,
      totalVisitors,
      totalInteractions,
      monthlyChart,
      callVolume,
      avgFCR: ccCount ? (fcrSum / ccCount).toFixed(1) : '0',
      avgSL: ccCount ? (slSum / ccCount).toFixed(1) : '0',
      callCenterChart,
    };
  }, [data, months, selectedBU, fromIdx, toIdx]);

  const selectClass = `
    bg-[var(--bg-tertiary)] border border-[var(--glass-border)] rounded-lg px-3 py-2
    text-sm text-[var(--text-primary)] outline-none
    focus:border-[var(--accent-primary)] transition-all duration-200
  `;

  const kpiCards = [
    { label: 'Total Pengunjung', value: aggregated.totalVisitors.toLocaleString(), icon: '👥', color: 'var(--accent-info)' },
    { label: 'Total Interaksi', value: aggregated.totalInteractions.toLocaleString(), icon: '📞', color: 'var(--accent-secondary)' },
    { label: 'Call Volume', value: aggregated.callVolume.toLocaleString(), icon: '☎️', color: 'var(--accent-tertiary)' },
    { label: 'Avg FCR', value: `${aggregated.avgFCR}%`, icon: '✅', color: 'var(--accent-success)' },
    { label: 'Avg Service Level', value: `${aggregated.avgSL}%`, icon: '⚡', color: 'var(--accent-warning)' },
  ];

  const interactionChartData = Object.entries(aggregated.interactionTotals)
    .map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }))
    .sort((a, b) => b.value - a.value);

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

      {/* Header */}
      <div className="flex items-center gap-3">
        <span className="text-2xl">📊</span>
        <div>
          <h2 className="text-xl font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>
            Interaksi & Pengunjung Analytics
          </h2>
          <p className="text-sm text-[var(--text-muted)]">Data dari Statistik Operasional CX Performance</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 animate-in">
        {kpiCards.map(kpi => (
          <div key={kpi.label} className="glass-card text-center">
            <span className="text-2xl">{kpi.icon}</span>
            <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider mt-2">{kpi.label}</p>
            <p className="text-2xl font-bold mt-1" style={{ color: kpi.color, fontFamily: 'var(--font-display)' }}>
              {kpi.value}
            </p>
          </div>
        ))}
      </div>

      {/* Interaction Kategori */}
      <div className="glass-card animate-in">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-2">🗂️ Kategorisasi Interaksi</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          {interactionChartData.map(item => (
            <div key={item.name} className="bg-[var(--bg-tertiary)] rounded-lg p-3 text-center">
              <p className="text-xs text-[var(--text-muted)]">{item.name}</p>
              <p className="text-lg font-bold mt-1" style={{ color: CATEGORY_COLORS[item.name.toLowerCase()] || 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
                {item.value.toLocaleString()}
              </p>
            </div>
          ))}
        </div>
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Interaction Volumes per Kategori</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={interactionChartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} />
            <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
            <Tooltip contentStyle={{ background: '#1a2235', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#f1f5f9' }} />
            <Bar dataKey="value" radius={[6, 6, 0, 0]} name="Volume">
              {interactionChartData.map((entry, i) => (
                <Cell key={i} fill={CATEGORY_COLORS[entry.name.toLowerCase()] || '#6366f1'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Pengunjung vs Interaksi */}
      <div className="glass-card animate-in">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">📈 Jumlah Pengunjung vs Total Interaksi (Bulanan)</h3>
        <ResponsiveContainer width="100%" height={320}>
          <ComposedChart data={aggregated.monthlyChart}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 10 }} />
            <YAxis yAxisId="left" tick={{ fill: '#94a3b8', fontSize: 11 }} />
            <YAxis yAxisId="right" orientation="right" tick={{ fill: '#94a3b8', fontSize: 11 }} />
            <Tooltip contentStyle={{ background: '#1a2235', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#f1f5f9' }} />
            <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
            <Area yAxisId="left" type="monotone" dataKey="visitors" fill="#6366f120" stroke="#6366f1" strokeWidth={2} name="Pengunjung" />
            <Line yAxisId="right" type="monotone" dataKey="interactions" stroke="#06b6d4" strokeWidth={2} dot={{ r: 3 }} name="Interaksi" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Call Center Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass-card animate-in">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Call Center Performance</h3>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={aggregated.callCenterChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 10 }} />
              <YAxis yAxisId="left" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis yAxisId="right" orientation="right" domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#1a2235', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#f1f5f9' }} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
              <Bar yAxisId="left" dataKey="volume" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Call Volume" />
              <Line yAxisId="right" type="monotone" dataKey="fcr" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} name="FCR %" />
              <Line yAxisId="right" type="monotone" dataKey="serviceLevel" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} name="Service Level %" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Call Center KPIs */}
        <div className="glass-card animate-in">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Call Center KPIs</h3>
          <div className="space-y-4">
            {[
              { label: 'Total Call Volume', value: aggregated.callVolume.toLocaleString(), color: '#8b5cf6', pct: 100 },
              { label: 'First Call Resolution (FCR)', value: `${aggregated.avgFCR}%`, color: '#10b981', pct: Number(aggregated.avgFCR) },
              { label: 'Service Level', value: `${aggregated.avgSL}%`, color: '#f59e0b', pct: Number(aggregated.avgSL) },
            ].map(kpi => (
              <div key={kpi.label} className="bg-[var(--bg-tertiary)] rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-[var(--text-secondary)]">{kpi.label}</span>
                  <span className="text-lg font-bold" style={{ color: kpi.color, fontFamily: 'var(--font-display)' }}>{kpi.value}</span>
                </div>
                <div className="w-full bg-[var(--bg-primary)] rounded-full h-2">
                  <div className="h-2 rounded-full transition-all duration-700" style={{ width: `${kpi.pct}%`, background: kpi.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
