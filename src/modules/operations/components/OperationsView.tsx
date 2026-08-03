'use client';

import React, { useMemo, useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell,
  LineChart, Line, ComposedChart, Area, PieChart, Pie, AreaChart
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

const CHANNEL_COLORS: Record<string, string> = {
  'Interaksi Per Channel Whatsapp': '#25D366',
  'Interaksi Per Channel Telepon': '#3b82f6',
  'Interaksi Per Channel Live Chat': '#06b6d4',
  'Interaksi Per Channel Instagram': '#E1306C',
  'Interaksi Per Channel Google Review': '#ea4335',
  'Interaksi Per Channel SP4N Lapor!': '#f59e0b',
  'Interaksi Per Channel Survey Sensum': '#8b5cf6',
  'Interaksi Per Channel Kotak Saran': '#ec4899',
  'Interaksi Per Channel Email': '#6366f1',
  'Interaksi Per Channel Voice (Omnix)': '#14b8a6',
  'Interaksi Per Channel Website Inquiry (CMS)': '#a855f7',
  'Interaksi Per Channel Twitter': '#1DA1F2',
  'Interaksi Per Channel Customer Service': '#f97316'
};

export default function OperationsView({ data, months }: Props) {
  const [selectedBU, setSelectedBU] = useState('ALL');
  const [monthFrom, setMonthFrom] = useState('ALL');
  const [monthTo, setMonthTo] = useState('ALL');
  const [statistikData, setStatistikData] = useState<any>(null);

  useEffect(() => {
    fetch('/data/datasheet_statistik.json')
      .then(res => res.json())
      .then(d => setStatistikData(d))
      .catch(err => console.error('Failed to load datasheet_statistik.json:', err));
  }, []);

  const fromIdx = monthFrom === 'ALL' ? 0 : Number(monthFrom);
  const toIdx = monthTo === 'ALL' ? months.length - 1 : Number(monthTo);

  // Aggregate data across BUs or use single BU
  const aggregated = useMemo(() => {
    const busToUse = selectedBU === 'ALL' ? BU_LIST : [selectedBU];

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

    let callVolume = 0;
    let fcrSum = 0;
    let slSum = 0;
    let ccCount = 0;
    busToUse.forEach(bu => {
      const cc = data[bu]?.performance?.call_center;
      if (cc) {
        for (let i = fromIdx; i <= toIdx && i < (cc.volume?.length || 0); i++) {
          callVolume += (cc.volume?.[i] || 0);
          if (cc.fcr?.[i] !== null && cc.fcr?.[i] !== undefined) { fcrSum += cc.fcr[i]; ccCount++; }
          if (cc.service_level?.[i] !== null && cc.service_level?.[i] !== undefined) { slSum += cc.service_level[i]; }
        }
      }
    });

    const callCenterChart = months.slice(fromIdx, toIdx + 1).map((m, idx) => {
      const mIdx = fromIdx + idx;
      let volume = 0;
      let fcr = 0;
      let sl = 0;
      let cnt = 0;
      busToUse.forEach(bu => {
        const cc = data[bu]?.performance?.call_center;
        if (cc) {
          volume += (cc.volume?.[mIdx] || 0);
          if (cc.fcr?.[mIdx]) fcr += cc.fcr[mIdx];
          if (cc.service_level?.[mIdx]) sl += cc.service_level[mIdx];
          cnt++;
        }
      });
      return {
        month: m,
        volume,
        fcr: cnt ? Math.round(fcr / cnt) : 0,
        serviceLevel: cnt ? Math.round(sl / cnt) : 0,
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

  // Analytics for datasheet_statistik Google Sheet Data (UNIFIED FILTERING)
  const statistikAnalytics = useMemo(() => {
    if (!statistikData || !statistikData.members) return null;

    const allMembers = Object.keys(statistikData.members);

    // Map BU selection to Google Sheet Member names
    let selectedMembers: string[] = allMembers;
    if (selectedBU === 'API') selectedMembers = ['API'];
    else if (selectedBU === 'HIN') selectedMembers = ['HIN'];
    else if (selectedBU === 'IAS') selectedMembers = ['IAS'];
    else if (selectedBU === 'IDM - TMII') selectedMembers = ['TMII'];
    else if (selectedBU === 'IDM - TWC') selectedMembers = ['IDM'];
    else if (selectedBU === 'ITDC') selectedMembers = ['ITDC'];
    else if (selectedBU === 'Sarinah') selectedMembers = ['SNH'];

    // Map month selection range
    const allMonths = statistikData.months || [];
    const filteredMonths = allMonths.slice(fromIdx, toIdx + 1);

    let totalTraffic = 0;
    const channelSums: Record<string, number> = {};
    const monthlyTrafficMap: Record<string, number> = {};
    filteredMonths.forEach((m: string) => { monthlyTrafficMap[m] = 0; });

    selectedMembers.forEach(mem => {
      const items = statistikData.members[mem] || [];
      items.forEach((it: any) => {
        const itemName = it.item;
        let sumItem = 0;

        filteredMonths.forEach((m: string) => {
          const valObj = it.monthly[m];
          const num = valObj?.val || 0;
          sumItem += num;

          if (itemName === 'Jumlah Pengunjung') {
            monthlyTrafficMap[m] += num;
          }
        });

        if (itemName === 'Jumlah Pengunjung') {
          totalTraffic += sumItem;
        } else if (itemName.startsWith('Interaksi Per Channel')) {
          const cleanChannelName = itemName.replace('Interaksi Per Channel ', '');
          channelSums[cleanChannelName] = (channelSums[cleanChannelName] || 0) + sumItem;
        }
      });
    });

    const trafficChart = filteredMonths.map((m: string) => ({
      month: m,
      traffic: monthlyTrafficMap[m] || 0
    }));

    const channelChart = Object.entries(channelSums)
      .map(([channel, total]) => ({ name: channel, value: total }))
      .filter(c => c.value > 0)
      .sort((a, b) => b.value - a.value);

    const totalChannelInteractions = channelChart.reduce((acc, c) => acc + c.value, 0);

    return {
      allMembers,
      selectedMembers,
      totalTraffic,
      totalChannelInteractions,
      trafficChart,
      channelChart
    };
  }, [statistikData, selectedBU, fromIdx, toIdx]);

  const interactionChartData = Object.entries(aggregated.interactionTotals).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
  }));

  return (
    <div className="space-y-8 animate-in">
      {/* Header Banner */}
      <div className="glass-card flex flex-wrap items-center justify-between gap-4 bg-gradient-to-r from-blue-900/20 via-indigo-900/20 to-purple-900/20 border-indigo-500/20">
        <div>
          <h2 className="text-xl font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>
            👥 Operations & Omnichannel Traffic Analytics
          </h2>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Analyzing visitor traffic volume, contact center channels, and operational KPIs from Google Sheets & Sensum Data.
          </p>
        </div>

        {/* Global BU & Month Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1">Business Unit</p>
            <select
              value={selectedBU}
              onChange={e => setSelectedBU(e.target.value)}
              className="text-xs rounded-lg px-3 py-1.5 bg-[var(--glass-bg)] border border-[var(--glass-border)] text-[var(--text-primary)] font-semibold"
            >
              <option value="ALL">All Business Units</option>
              {BU_LIST.map(bu => <option key={bu} value={bu}>{bu}</option>)}
            </select>
          </div>

          <div>
            <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1">From Month</p>
            <select
              value={monthFrom}
              onChange={e => setMonthFrom(e.target.value)}
              className="text-xs rounded-lg px-2.5 py-1.5 bg-[var(--glass-bg)] border border-[var(--glass-border)] text-[var(--text-primary)]"
            >
              <option value="ALL">Start</option>
              {months.map((m, idx) => <option key={m} value={idx}>{m}</option>)}
            </select>
          </div>

          <div>
            <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1">To Month</p>
            <select
              value={monthTo}
              onChange={e => setMonthTo(e.target.value)}
              className="text-xs rounded-lg px-2.5 py-1.5 bg-[var(--glass-bg)] border border-[var(--glass-border)] text-[var(--text-primary)]"
            >
              <option value="ALL">End</option>
              {months.map((m, idx) => <option key={m} value={idx}>{m}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* SECTION 1: GOOGLE SHEETS STATISTIK ANALYTICS */}
      {statistikAnalytics && (
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-[var(--glass-border)] pb-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">📊</span>
              <div>
                <h3 className="text-base font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>
                  Datasheet Statistik (Google Sheets Live Data)
                </h3>
                <p className="text-[11px] text-[var(--text-muted)]">
                  Filtered for: <span className="font-semibold text-indigo-400">{selectedBU === 'ALL' ? 'All Holding Members' : selectedBU}</span> · Period: <span className="font-semibold text-indigo-400">{months[fromIdx]} – {months[Math.min(toIdx, months.length - 1)]}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Stat KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass-card bg-gradient-to-br from-indigo-950/40 to-slate-900/40 border-indigo-500/30">
              <p className="text-[11px] text-[var(--text-muted)] uppercase tracking-wider">Total Visitor Traffic</p>
              <p className="text-2xl font-bold text-indigo-400 mt-1" style={{ fontFamily: 'var(--font-display)' }}>
                {statistikAnalytics.totalTraffic.toLocaleString()}
              </p>
              <p className="text-[10px] text-slate-400 mt-1">Total visitors across selected member(s)</p>
            </div>

            <div className="glass-card bg-gradient-to-br from-cyan-950/40 to-slate-900/40 border-cyan-500/30">
              <p className="text-[11px] text-[var(--text-muted)] uppercase tracking-wider">Total Channel Interactions</p>
              <p className="text-2xl font-bold text-cyan-400 mt-1" style={{ fontFamily: 'var(--font-display)' }}>
                {statistikAnalytics.totalChannelInteractions.toLocaleString()}
              </p>
              <p className="text-[10px] text-slate-400 mt-1">Across 14 customer contact channels</p>
            </div>

            <div className="glass-card bg-gradient-to-br from-emerald-950/40 to-slate-900/40 border-emerald-500/30">
              <p className="text-[11px] text-[var(--text-muted)] uppercase tracking-wider">Top Interaction Channel</p>
              <p className="text-xl font-bold text-emerald-400 mt-1 truncate" style={{ fontFamily: 'var(--font-display)' }}>
                {statistikAnalytics.channelChart[0]?.name || 'N/A'}
              </p>
              <p className="text-[10px] text-slate-400 mt-1">
                {statistikAnalytics.channelChart[0]?.value.toLocaleString() || 0} total interactions
              </p>
            </div>

            <div className="glass-card bg-gradient-to-br from-purple-950/40 to-slate-900/40 border-purple-500/30">
              <p className="text-[11px] text-[var(--text-muted)] uppercase tracking-wider">Active Channels Tracked</p>
              <p className="text-2xl font-bold text-purple-400 mt-1" style={{ fontFamily: 'var(--font-display)' }}>
                {statistikAnalytics.channelChart.length} Channels
              </p>
              <p className="text-[10px] text-slate-400 mt-1 truncate" title={statistikAnalytics.channelChart.map((c: any) => c.name).join(', ')}>
                {statistikAnalytics.channelChart.map((c: any) => c.name).join(', ') || 'No active channels'}
              </p>
            </div>
          </div>

          {/* Charts Row 1: Traffic Trend & Channel Volume Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Monthly Visitor Traffic Area Chart */}
            <div className="glass-card">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="text-sm font-semibold text-[var(--text-primary)]">
                    📈 Monthly Visitor Traffic Trend (Jan 2025 - Jun 2026)
                  </h4>
                  <p className="text-[11px] text-[var(--text-muted)]">Visitor volume evolution over 18 months</p>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={statistikAnalytics.trafficChart}>
                  <defs>
                    <linearGradient id="trafficGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} tickFormatter={v => (v / 1e6).toFixed(1) + 'M'} />
                  <Tooltip
                    contentStyle={{ background: '#1a2235', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#f1f5f9' }}
                    formatter={(val: any) => [val.toLocaleString() + ' Visitors', 'Pengunjung']}
                  />
                  <Area type="monotone" dataKey="traffic" stroke="#6366f1" strokeWidth={2.5} fill="url(#trafficGradient)" name="Jumlah Pengunjung" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Omnichannel Interaction Distribution Bar Chart */}
            <div className="glass-card">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="text-sm font-semibold text-[var(--text-primary)]">
                    📱 Omnichannel Contact Volume by Channel
                  </h4>
                  <p className="text-[11px] text-[var(--text-muted)]">Total interactions per channel across selected member(s)</p>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={statistikAnalytics.channelChart} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                  <YAxis dataKey="name" type="category" width={140} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{ background: '#1a2235', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#f1f5f9' }}
                    formatter={(val: any) => [val.toLocaleString() + ' Interaksi', 'Volume']}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} name="Volume">
                    {statistikAnalytics.channelChart.map((entry: any, i: number) => (
                      <Cell key={i} fill={CHANNEL_COLORS['Interaksi Per Channel ' + entry.name] || '#06b6d4'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: SENSUM OPERATIONS & CATEGORIES */}
      <div className="space-y-6 pt-4 border-t border-[var(--glass-border)]">
        <div className="flex items-center gap-2">
          <span className="text-xl">⚙️</span>
          <h3 className="text-base font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>
            Sensum Feedback & Interaction Category Analytics
          </h3>
        </div>

        {/* Top KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="glass-card">
            <p className="text-[11px] text-[var(--text-muted)] uppercase tracking-wider">Total Pengunjung</p>
            <p className="text-2xl font-bold text-[var(--accent-primary-light)] mt-1" style={{ fontFamily: 'var(--font-display)' }}>
              {aggregated.totalVisitors.toLocaleString()}
            </p>
            <p className="text-[10px] text-[var(--text-muted)] mt-1">Periode terpilih</p>
          </div>

          <div className="glass-card">
            <p className="text-[11px] text-[var(--text-muted)] uppercase tracking-wider">Total Interaksi</p>
            <p className="text-2xl font-bold text-[var(--accent-info)] mt-1" style={{ fontFamily: 'var(--font-display)' }}>
              {aggregated.totalInteractions.toLocaleString()}
            </p>
            <p className="text-[10px] text-[var(--text-muted)] mt-1">Semua kategori interaksi</p>
          </div>

          <div className="glass-card">
            <p className="text-[11px] text-[var(--text-muted)] uppercase tracking-wider">Call Center Volume</p>
            <p className="text-2xl font-bold text-[var(--accent-success)] mt-1" style={{ fontFamily: 'var(--font-display)' }}>
              {aggregated.callVolume.toLocaleString()}
            </p>
            <p className="text-[10px] text-[var(--text-muted)] mt-1">FCR: {aggregated.avgFCR}% | SL: {aggregated.avgSL}%</p>
          </div>
        </div>

        {/* Category Breakdown Bar Chart */}
        <div className="glass-card">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 mb-6">
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

        {/* Call Center Performance */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="glass-card">
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

          <div className="glass-card">
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
    </div>
  );
}
