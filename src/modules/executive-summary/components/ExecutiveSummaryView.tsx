'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { CSATRecord } from '@/modules/common/types';
import type { SocmedData } from '@/modules/common/hooks/use-socmed-data';
import CXPerformanceSummary from '@/modules/cx-performance/components/ExecutiveSummary';

/* eslint-disable @typescript-eslint/no-explicit-any */

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
const SOCMED_BU_MAP: Record<string, string> = {
  API: 'API',
  IAS: 'IAS',
  IDM: 'IDM - TMII',
  HIN: 'HIN',
  ITDC: 'ITDC',
  SNH: 'Sarinah',
};

function getScoreColor(score: number) {
  if (score >= 4.5) return 'var(--accent-success)';
  if (score >= 4.0) return 'var(--accent-info)';
  if (score >= 3.0) return 'var(--accent-warning)';
  return 'var(--accent-danger)';
}

function SectionHeader({ icon, title, href, onNavigate }: {
  icon: string; title: string; href: string; onNavigate: (href: string) => void;
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        <span className="text-2xl">{icon}</span>
        <h2 className="text-xl font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>
          {title}
        </h2>
      </div>
      <button
        onClick={() => onNavigate(href)}
        className="text-xs px-3 py-1.5 rounded-lg border border-[var(--glass-border)] text-[var(--text-secondary)] hover:text-[var(--accent-primary-light)] hover:border-[var(--accent-primary)]/40 transition-all"
      >
        View Details →
      </button>
    </div>
  );
}

function ScoreCard({ label, value, sub, color, icon, onClick, badge }: {
  label: string; value: string; sub?: string; color?: string;
  icon?: string; onClick?: () => void; badge?: string;
}) {
  return (
    <div
      onClick={onClick}
      className={`glass-card flex flex-col gap-1 ${onClick ? 'cursor-pointer hover:scale-[1.02] transition-transform' : ''}`}
    >
      <div className="flex items-center justify-between">
        {icon && <span className="text-xl">{icon}</span>}
        {badge && (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/10 text-[var(--text-secondary)] border border-white/10">
            {badge}
          </span>
        )}
      </div>
      <p className="text-xs font-medium text-[var(--text-secondary)] mt-1">{label}</p>
      <p className="text-2xl font-extrabold" style={{ color: color || 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
        {value}
      </p>
      {sub && <p className="text-[10px] text-[var(--text-muted)]">{sub}</p>}
    </div>
  );
}

function BUGroupLabel({ label }: { label: string }) {
  return (
    <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2 mt-4 flex items-center gap-2">
      <span className="inline-block w-3 h-[1px] bg-[var(--text-muted)]" />
      {label}
    </p>
  );
}

export default function ExecutiveSummaryView({ csatRecords, perfData, socmedData }: Props) {
  const router = useRouter();
  const [fromMonth, setFromMonth] = useState('');
  const [toMonth, setToMonth] = useState('');

  function navigate(href: string) {
    const params = new URLSearchParams();
    if (fromMonth) params.set('from', fromMonth);
    if (toMonth) params.set('to', toMonth);
    const qs = params.toString();
    router.push(qs ? `${href}?${qs}` : href);
  }

  // Cast to any for internal use — props type is Record<string, unknown> for TS hygiene
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pd = perfData as Record<string, any> | null;
  const months: string[] = (pd?._months as string[]) || [];

  // Compute index range from fromMonth/toMonth into the months array
  // months are like "Jan 25", "Feb 25" etc. We convert from YYYY-MM.
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

  // ─── CX PERFORMANCE CSAT ───────────────────────────────────────────────────
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
    for (const bu of CX_BUS) {
      byBU[bu] = compute(filtered.filter(r => r.bu === bu));
    }
    return { overall, byBU, filtered };
  }, [csatRecords, fromMonth, toMonth]);

  // ─── OPERATIONS ────────────────────────────────────────────────────────────
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

  // ─── PERFORMANCE KPI ────────────────────────────────────────────────────────
  const kpiStats = useMemo(() => {
    if (!pd) return null;
    const sumRange = (arr: number[] | undefined) => {
      if (!arr) return 0;
      const s = Math.max(0, fromIdx);
      const e = Math.min(toIdx, arr.length - 1);
      return arr.slice(s, e + 1).reduce((a, b) => a + (b || 0), 0);
    };
    const avgRange = (arr: number[] | undefined) => {
      if (!arr) return 0;
      const s = Math.max(0, fromIdx);
      const e = Math.min(toIdx, arr.length - 1);
      const vals = arr.slice(s, e + 1).filter((v): v is number => v != null && !isNaN(v));
      return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
    };

    const computeCC = (buKeys: string[]) => {
      let vol = 0, wtSum = 0, arSum = 0, fcrSum = 0, slSum = 0, cnt = 0;
      buKeys.forEach(bk => {
        const cc = pd[bk]?.call_center;
        if (!cc) return;
        vol += sumRange(cc.volume);
        const n = Math.min(toIdx, (cc.volume?.length || 0) - 1) - Math.max(0, fromIdx) + 1;
        if (n > 0) {
          wtSum += avgRange(cc.waiting_time);
          arSum += avgRange(cc.abandoned_rate);
          fcrSum += avgRange(cc.fcr);
          slSum += avgRange(cc.service_level);
          cnt++;
        }
      });
      return {
        volume: vol,
        waitTime: cnt ? +(wtSum / cnt).toFixed(1) : 0,
        abandonedRate: cnt ? +(arSum / cnt).toFixed(1) : 0,
        fcr: cnt ? +(fcrSum / cnt).toFixed(1) : 0,
        serviceLevel: cnt ? +(slSum / cnt).toFixed(1) : 0,
      };
    };
    const computeComplaints = (buKeys: string[]) => {
      let total = 0, completed = 0, progress = 0, untouch = 0, avgTime = 0, cnt = 0;
      buKeys.forEach(bk => {
        const c = pd[bk]?.complaints;
        if (!c) return;
        total += sumRange(c.total);
        completed += sumRange(c.completed);
        progress += sumRange(c.progress);
        untouch += sumRange(c.untouch);
        const at = avgRange(c.avg_time_resolution);
        if (at > 0) { avgTime += at; cnt++; }
      });
      return { total, completed, progress, untouch, avgTime: cnt ? +(avgTime / cnt).toFixed(1) : 0 };
    };

    const allBUKeys = Object.keys(pd).filter(k => !k.startsWith('_'));
    const overallCC = computeCC(allBUKeys);
    const overallComplaints = computeComplaints(allBUKeys);
    const ccByBU: Record<string, ReturnType<typeof computeCC>> = {};
    const complaintsByBU: Record<string, ReturnType<typeof computeComplaints>> = {};
    for (const bu of PERF_BUS) {
      ccByBU[bu] = computeCC(PERF_BU_MAP[bu]);
      complaintsByBU[bu] = computeComplaints(PERF_BU_MAP[bu]);
    }
    return { overallCC, overallComplaints, ccByBU, complaintsByBU };
  }, [pd, fromIdx, toIdx]);

  // ─── SOCIAL MEDIA ───────────────────────────────────────────────────────────
  const socmedStats = useMemo(() => {
    if (!socmedData) return null;
    const computeStats = (statsObj: any) => {
      if (!statsObj) return null;
      const trend: Record<string, any> = statsObj.monthly_sentiment_trend || {};
      const allMonthKeys = Object.keys(trend).sort();

      // Filter by selected month range
      const filtered = fromMonth || toMonth
        ? allMonthKeys.filter(k => {
            if (fromMonth && k < fromMonth) return false;
            if (toMonth && k > toMonth) return false;
            return true;
          })
        : allMonthKeys;

      if (filtered.length === 0) {
        return { nss: 0, posts: 0, comments: statsObj.total_comments, likes: statsObj.total_likes, views: statsObj.total_views };
      }

      let posTotal = 0, negTotal = 0, neuTotal = 0;
      filtered.forEach(k => {
        posTotal += trend[k]?.Positif || 0;
        negTotal += trend[k]?.Negatif || 0;
        neuTotal += trend[k]?.Netral || 0;
      });
      const totalMentions = posTotal + negTotal + neuTotal;
      const nss = totalMentions > 0 ? ((posTotal - negTotal) / totalMentions) * 100 : 0;

      // For posts: use platform trend totals in date range
      const platformTrend: Record<string, any> = statsObj.monthly_platform_trend || {};
      let rangedPosts = 0;
      filtered.forEach(k => {
        const mo = platformTrend[k] || {};
        rangedPosts += Object.values(mo).reduce((a: number, v: any) => a + (v || 0), 0);
      });

      // Scale other lifetime metrics proportionally
      const allPosts = allMonthKeys.reduce((s, k) => {
        const mo = platformTrend[k] || {};
        return s + Object.values(mo).reduce((a: number, v: any) => a + (v || 0), 0);
      }, 0);
      const ratio = allPosts > 0 ? rangedPosts / allPosts : 1;

      return {
        nss: +nss.toFixed(1),
        posts: rangedPosts,
        comments: Math.round(statsObj.total_comments * ratio),
        likes: Math.round(statsObj.total_likes * ratio),
        views: Math.round(statsObj.total_views * ratio),
      };
    };

    const overall = computeStats(socmedData.global);
    const byBU: Record<string, ReturnType<typeof computeStats>> = {};
    for (const bu of PERF_BUS) {
      const key = SOCMED_BU_MAP[bu];
      byBU[bu] = computeStats(socmedData.bu_data[key] || null);
    }
    return { overall, byBU };
  }, [socmedData, fromMonth, toMonth]);

  const selectClass = `bg-[var(--bg-tertiary)] border border-[var(--glass-border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent-primary)] transition-all duration-200`;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
              style={{ background: 'linear-gradient(135deg, #6366f1, #06b6d4)' }}>⭐</div>
            <div>
              <h1 className="text-2xl font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>
                Executive Summary
              </h1>
              <p className="text-xs text-[var(--text-muted)]">Landing overview — key scorecards from all modules</p>
            </div>
          </div>
        </div>
      </div>

      {/* Date Range Filter */}
      <div className="glass-card !p-4 flex flex-wrap items-end gap-4 animate-in">
        <div className="flex flex-col">
          <p className="text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wider mb-1">From Month</p>
          <input type="month" value={fromMonth} onChange={e => setFromMonth(e.target.value)}
            className={selectClass} style={{ colorScheme: 'dark' }} />
        </div>
        <div className="flex flex-col">
          <p className="text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wider mb-1">To Month</p>
          <input type="month" value={toMonth} onChange={e => setToMonth(e.target.value)}
            className={selectClass} style={{ colorScheme: 'dark' }} />
        </div>
        {(fromMonth || toMonth) && (
          <button
            onClick={() => { setFromMonth(''); setToMonth(''); }}
            className="text-xs px-3 py-2 rounded-lg text-[var(--accent-danger)] border border-[var(--accent-danger)]/30 hover:bg-[var(--accent-danger)]/10 transition-all"
          >
            ✕ Reset
          </button>
        )}
        <p className="text-xs text-[var(--text-muted)] ml-auto">
          {fromMonth || toMonth
            ? `${fromMonth || 'start'} → ${toMonth || 'now'}`
            : 'All dates'}
        </p>
      </div>

      {/* ── 1. CSAT HOLDING PERFORMANCE ─────────────────────────────────────────────── */}
      <section className="animate-in">
        <SectionHeader icon="📊" title="CSAT Holding Performance" href="/cx-performance" onNavigate={navigate} />

        {csatStats ? (
          <>
            <BUGroupLabel label="Overall — All Business Units" />
            <CXPerformanceSummary records={csatStats.filtered} />

            <BUGroupLabel label="Individual Business Units" />
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-3">
              {CX_BUS.map(bu => {
                const s = csatStats.byBU[bu];
                return (
                  <div key={bu} className="glass-card cursor-pointer hover:scale-[1.02] transition-transform"
                    onClick={() => navigate('/cx-performance')}>
                    <p className="text-xs font-bold text-[var(--text-secondary)] mb-2">{bu}</p>
                    <div className="grid grid-cols-2 gap-1">
                      {[
                        { label: 'Overall', val: s.overall },
                        { label: 'People', val: s.people },
                        { label: 'Process', val: s.process },
                        { label: 'Premises', val: s.premises },
                      ].map(m => (
                        <div key={m.label}>
                          <p className="text-[9px] text-[var(--text-muted)]">{m.label}</p>
                          <p className="text-sm font-bold" style={{ color: m.val > 0 ? getScoreColor(m.val) : 'var(--text-muted)', fontFamily: 'var(--font-display)' }}>
                            {m.val > 0 ? m.val.toFixed(2) : '—'}
                          </p>
                        </div>
                      ))}
                    </div>
                    <p className="text-[9px] text-[var(--text-muted)] mt-2">{s.count.toLocaleString()} responses</p>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="glass-card text-center py-8 text-[var(--text-muted)]">No CSAT data loaded</div>
        )}
      </section>

      {/* ── 2. OPERATIONS ─────────────────────────────────────────────────── */}
      <section className="animate-in">
        <SectionHeader icon="👥" title="Operations" href="/operations" onNavigate={navigate} />

        {opsStats ? (
          <>
            <BUGroupLabel label="Overall — All Business Units" />
            <div className="grid grid-cols-2 gap-4">
              <ScoreCard label="Total Pengunjung" icon="🚶"
                value={opsStats.overall.visitors.toLocaleString()}
                color="var(--accent-info)"
                onClick={() => navigate('/operations')}
              />
              <ScoreCard label="Total Interaksi" icon="📞"
                value={opsStats.overall.interactions.toLocaleString()}
                color="var(--accent-secondary)"
                onClick={() => navigate('/operations')}
              />
            </div>

            <BUGroupLabel label="Individual Business Units" />
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {PERF_BUS.map(bu => {
                const s = opsStats.byBU[bu];
                return (
                  <div key={bu} className="glass-card cursor-pointer hover:scale-[1.02] transition-transform"
                    onClick={() => navigate('/operations')}>
                    <p className="text-xs font-bold text-[var(--text-secondary)] mb-2">{bu}</p>
                    <p className="text-[9px] text-[var(--text-muted)]">Pengunjung</p>
                    <p className="text-base font-bold text-[var(--accent-info)]" style={{ fontFamily: 'var(--font-display)' }}>
                      {s.visitors.toLocaleString()}
                    </p>
                    <p className="text-[9px] text-[var(--text-muted)] mt-1">Interaksi</p>
                    <p className="text-base font-bold text-[var(--accent-secondary)]" style={{ fontFamily: 'var(--font-display)' }}>
                      {s.interactions.toLocaleString()}
                    </p>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="glass-card text-center py-8 text-[var(--text-muted)]">No operations data loaded</div>
        )}
      </section>

      {/* ── 3. PERFORMANCE KPI ────────────────────────────────────────────── */}
      <section className="animate-in">
        <SectionHeader icon="📈" title="Performance KPI" href="/performance-kpi" onNavigate={navigate} />

        {kpiStats ? (
          <>
            {/* 3A Call Center */}
            <p className="text-xs font-semibold text-[var(--accent-primary-light)] uppercase tracking-wider mb-3 flex items-center gap-2">
              <span>☎️</span> A. Call Center Deep Dive
            </p>

            <BUGroupLabel label="Overall — All Business Units" />
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              {[
                { label: 'Call Volume', val: kpiStats.overallCC.volume.toLocaleString(), color: 'var(--accent-secondary)', icon: '📞', isNum: false },
                { label: 'Avg Wait Time', val: `${kpiStats.overallCC.waitTime}s`, color: 'var(--accent-info)', icon: '⏱️', isNum: false },
                { label: 'Abandoned Rate', val: `${kpiStats.overallCC.abandonedRate}%`, color: 'var(--accent-danger)', icon: '❌', isNum: false },
                { label: 'Avg FCR', val: `${kpiStats.overallCC.fcr}%`, color: 'var(--accent-success)', icon: '✅', isNum: false },
                { label: 'Avg Service Level', val: `${kpiStats.overallCC.serviceLevel}%`, color: 'var(--accent-warning)', icon: '⚡', isNum: false },
              ].map(c => (
                <ScoreCard key={c.label} label={c.label} value={c.val} color={c.color} icon={c.icon}
                  onClick={() => navigate('/performance-kpi')} />
              ))}
            </div>

            <BUGroupLabel label="Individual Business Units" />
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {PERF_BUS.map(bu => {
                const s = kpiStats.ccByBU[bu];
                return (
                  <div key={bu} className="glass-card cursor-pointer hover:scale-[1.02] transition-transform"
                    onClick={() => navigate('/performance-kpi')}>
                    <p className="text-xs font-bold text-[var(--text-secondary)] mb-2">{bu}</p>
                    <div className="space-y-1">
                      <div><p className="text-[9px] text-[var(--text-muted)]">Volume</p><p className="text-sm font-bold text-[var(--accent-secondary)]" style={{ fontFamily: 'var(--font-display)' }}>{s.volume.toLocaleString()}</p></div>
                      <div><p className="text-[9px] text-[var(--text-muted)]">FCR</p><p className="text-sm font-bold text-[var(--accent-success)]" style={{ fontFamily: 'var(--font-display)' }}>{s.fcr}%</p></div>
                      <div><p className="text-[9px] text-[var(--text-muted)]">SL</p><p className="text-sm font-bold text-[var(--accent-warning)]" style={{ fontFamily: 'var(--font-display)' }}>{s.serviceLevel}%</p></div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 3B Complaint Handling */}
            <p className="text-xs font-semibold text-[var(--accent-primary-light)] uppercase tracking-wider mb-3 mt-8 flex items-center gap-2">
              <span>🚨</span> B. Complaint Handling &amp; SLA
            </p>

            <BUGroupLabel label="Overall — All Business Units" />
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              {[
                { label: 'Total Complaints', val: kpiStats.overallComplaints.total.toLocaleString(), color: 'var(--text-primary)', icon: '📋' },
                { label: 'Completed', val: kpiStats.overallComplaints.completed.toLocaleString(), color: 'var(--accent-success)', icon: '✅' },
                { label: 'In Progress', val: kpiStats.overallComplaints.progress.toLocaleString(), color: 'var(--accent-warning)', icon: '⏳' },
                { label: 'Untouched', val: kpiStats.overallComplaints.untouch.toLocaleString(), color: 'var(--accent-danger)', icon: '⚠️' },
                { label: 'Avg Resolution', val: `${kpiStats.overallComplaints.avgTime} days`, color: 'var(--accent-info)', icon: '📅' },
              ].map(c => (
                <ScoreCard key={c.label} label={c.label} value={c.val} color={c.color} icon={c.icon}
                  onClick={() => navigate('/performance-kpi')} />
              ))}
            </div>

            <BUGroupLabel label="Individual Business Units" />
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {PERF_BUS.map(bu => {
                const s = kpiStats.complaintsByBU[bu];
                return (
                  <div key={bu} className="glass-card cursor-pointer hover:scale-[1.02] transition-transform"
                    onClick={() => navigate('/performance-kpi')}>
                    <p className="text-xs font-bold text-[var(--text-secondary)] mb-2">{bu}</p>
                    <div className="space-y-1">
                      <div><p className="text-[9px] text-[var(--text-muted)]">Total</p><p className="text-sm font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>{s.total.toLocaleString()}</p></div>
                      <div><p className="text-[9px] text-[var(--text-muted)]">Completed</p><p className="text-sm font-bold text-[var(--accent-success)]" style={{ fontFamily: 'var(--font-display)' }}>{s.completed.toLocaleString()}</p></div>
                      <div><p className="text-[9px] text-[var(--text-muted)]">Avg Time</p><p className="text-sm font-bold text-[var(--accent-info)]" style={{ fontFamily: 'var(--font-display)' }}>{s.avgTime}d</p></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="glass-card text-center py-8 text-[var(--text-muted)]">No performance KPI data loaded</div>
        )}
      </section>

      {/* ── 4. SOCIAL MEDIA ────────────────────────────────────────────────── */}
      <section className="animate-in">
        <SectionHeader icon="📱" title="Social Media" href="/social-media" onNavigate={navigate} />

        {socmedStats?.overall ? (
          <>
            <BUGroupLabel label="Overall — All Business Units" />
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              {[
                { label: 'Net Sentiment', val: `${socmedStats.overall.nss >= 0 ? '+' : ''}${socmedStats.overall.nss}`, color: socmedStats.overall.nss >= 0 ? 'var(--accent-success)' : 'var(--accent-danger)', icon: '🧠' },
                { label: 'Total Posts', val: socmedStats.overall.posts.toLocaleString(), color: 'var(--accent-info)', icon: '📝' },
                { label: 'Total Comments', val: socmedStats.overall.comments.toLocaleString(), color: 'var(--accent-secondary)', icon: '💬' },
                { label: 'Total Likes', val: socmedStats.overall.likes.toLocaleString(), color: 'var(--accent-primary)', icon: '❤️' },
                { label: 'Total Views', val: socmedStats.overall.views.toLocaleString(), color: 'var(--accent-tertiary)', icon: '👁️' },
              ].map(c => (
                <ScoreCard key={c.label} label={c.label} value={c.val} color={c.color} icon={c.icon}
                  onClick={() => navigate('/social-media')} />
              ))}
            </div>

            <BUGroupLabel label="Individual Business Units" />
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {PERF_BUS.map(bu => {
                const s = socmedStats.byBU[bu];
                if (!s) return (
                  <div key={bu} className="glass-card opacity-50">
                    <p className="text-xs font-bold text-[var(--text-secondary)] mb-2">{bu}</p>
                    <p className="text-[10px] text-[var(--text-muted)]">No data</p>
                  </div>
                );
                return (
                  <div key={bu} className="glass-card cursor-pointer hover:scale-[1.02] transition-transform"
                    onClick={() => navigate('/social-media')}>
                    <p className="text-xs font-bold text-[var(--text-secondary)] mb-2">{bu}</p>
                    <div className="space-y-1">
                      <div>
                        <p className="text-[9px] text-[var(--text-muted)]">NSS</p>
                        <p className="text-sm font-bold" style={{ color: s.nss >= 0 ? 'var(--accent-success)' : 'var(--accent-danger)', fontFamily: 'var(--font-display)' }}>
                          {s.nss >= 0 ? '+' : ''}{s.nss}
                        </p>
                      </div>
                      <div><p className="text-[9px] text-[var(--text-muted)]">Posts</p><p className="text-sm font-bold text-[var(--accent-info)]" style={{ fontFamily: 'var(--font-display)' }}>{s.posts.toLocaleString()}</p></div>
                      <div><p className="text-[9px] text-[var(--text-muted)]">Likes</p><p className="text-sm font-bold text-[var(--accent-primary)]" style={{ fontFamily: 'var(--font-display)' }}>{s.likes.toLocaleString()}</p></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="glass-card text-center py-8 text-[var(--text-muted)]">No social media data loaded</div>
        )}
      </section>
    </div>
  );
}
