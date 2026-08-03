'use client';

import React, { useState, useMemo, Suspense } from 'react';
import { useCSATData, useFilteredCSAT } from '@/modules/common/hooks/use-data';
import { useSearchParams } from 'next/navigation';
import ExecutiveSummary from '@/modules/cx-performance/components/ExecutiveSummary';
import {
  CSATDistributionChart,
  SentimentDonut,
  SentimentByBUChart,
  ResponseVolumeChart,
} from '@/modules/cx-performance/components/Charts';
import { CSATTrendChart, CSATHeatmap } from '@/modules/cx-performance/components/TrendAndHeatmap';
import DriverSatisfactionBars from '@/modules/cx-performance/components/DriverSatisfactionBars';
import { FacilityRankings, TagsCloud } from '@/modules/cx-performance/components/FacilityAndTags';
import FeedbackExplorer from '@/modules/cx-performance/components/FeedbackExplorer';

const BUS = ['ALL', 'API', 'IDM', 'IJH', 'IAS', 'ITDC', 'Sarinah'];
const SENTIMENTS = ['ALL', 'Positive', 'Neutral', 'Negative'];

function CXPerformanceContent() {
  const searchParams = useSearchParams();
  const { data: records, loading, error } = useCSATData();
  const [bu, setBU] = useState('ALL');
  const [surveyType, setSurveyType] = useState('ALL');
  const [location, setLocation] = useState('ALL');
  const [sentiment, setSentiment] = useState('ALL');
  const [fromMonth, setFromMonth] = useState(searchParams.get('from') || '');
  const [toMonth, setToMonth] = useState(searchParams.get('to') || '');

  const surveyTypes = useMemo(() => {
    if (!records) return ['ALL'];
    const relRecs = bu === 'ALL' ? records : records.filter(r => r.bu === bu);
    const types = Array.from(new Set(relRecs.map(r => r.survey_type).filter(Boolean))).sort();
    return ['ALL', ...types];
  }, [records, bu]);

  const locations = useMemo(() => {
    if (!records) return ['ALL'];
    const relRecs = bu === 'ALL' ? records : records.filter(r => r.bu === bu);
    const locs = Array.from(new Set(relRecs.map(r => r.location).filter(Boolean))).sort();
    return ['ALL', ...locs];
  }, [records, bu]);

  const handleSelectBU = (newBU: string) => {
    setBU(newBU);
    setLocation('ALL');
    setSurveyType('ALL');
  };

  const filtered = useFilteredCSAT(records, bu, surveyType, sentiment, fromMonth, toMonth, location);

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 text-[var(--accent-danger)]">
        ⚠️ Failed to load: {error}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[var(--accent-primary)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[var(--text-muted)]">Loading CX Performance Data…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
              style={{ background: 'linear-gradient(135deg, #6366f1, #06b6d4)' }}>📊</div>
            <div>
              <h1 className="text-2xl font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>
                CX Performance & CSAT Analytics
              </h1>
              <p className="text-xs text-[var(--text-muted)]">
                Executive Summary — {records?.length.toLocaleString() || 0} distinct responses across 5 Business Units
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card flex flex-wrap items-end gap-4">
        <div>
          <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1">Business Unit</p>
          <div className="flex flex-wrap gap-1">
            {BUS.map(b => (
              <button key={b} onClick={() => handleSelectBU(b)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all border ${bu === b ? 'bg-[var(--accent-primary)]/20 text-[var(--accent-primary-light)] border-[var(--accent-primary)]/30' : 'border-[var(--glass-border)] text-[var(--text-secondary)] hover:border-[var(--accent-primary)]/30'}`}>
                {b}
              </button>
            ))}
          </div>
        </div>

        <div className="min-w-[180px]">
          <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1">Survey Type</p>
          <select value={surveyType} onChange={e => setSurveyType(e.target.value)}
            className="w-full text-xs rounded-lg px-3 py-1.5"
            style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)' }}>
            {surveyTypes.map(t => <option key={t} value={t}>{t === 'ALL' ? 'All Types' : t}</option>)}
          </select>
        </div>

        <div className="min-w-[180px]">
          <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1">Location</p>
          <select value={location} onChange={e => setLocation(e.target.value)}
            className="w-full text-xs rounded-lg px-3 py-1.5"
            style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)' }}>
            {locations.map(loc => <option key={loc} value={loc}>{loc === 'ALL' ? 'All Locations' : loc}</option>)}
          </select>
        </div>

        <div>
          <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1">Sentiment</p>
          <div className="flex gap-1">
            {SENTIMENTS.map(s => (
              <button key={s} onClick={() => setSentiment(s)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all border ${sentiment === s ? 'bg-[var(--accent-primary)]/20 text-[var(--accent-primary-light)] border-[var(--accent-primary)]/30' : 'border-[var(--glass-border)] text-[var(--text-secondary)] hover:border-[var(--accent-primary)]/30'}`}>
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          <div>
            <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1">From Month</p>
            <input type="month" value={fromMonth} onChange={e => setFromMonth(e.target.value)}
              className="text-xs rounded-lg px-2 py-1.5"
              style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)' }} />
          </div>
          <div>
            <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1">To Month</p>
            <input type="month" value={toMonth} onChange={e => setToMonth(e.target.value)}
              className="text-xs rounded-lg px-2 py-1.5"
              style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)' }} />
          </div>
        </div>

        {(bu !== 'ALL' || surveyType !== 'ALL' || location !== 'ALL' || sentiment !== 'ALL' || fromMonth || toMonth) && (
          <button onClick={() => { setBU('ALL'); setSurveyType('ALL'); setLocation('ALL'); setSentiment('ALL'); setFromMonth(''); setToMonth(''); }}
            className="text-xs px-3 py-1.5 rounded-lg text-[var(--accent-danger)] border border-[var(--accent-danger)]/30 hover:bg-[var(--accent-danger)]/10 transition-all">
            ✕ Reset
          </button>
        )}

        <div className="ml-auto text-right">
          <p className="text-[10px] text-[var(--text-muted)]">Filtered</p>
          <p className="text-lg font-bold text-[var(--accent-primary-light)]" style={{ fontFamily: 'var(--font-display)' }}>
            {filtered.length.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Executive Summary & 3P Driver Cards */}
      <ExecutiveSummary records={filtered} />

      {/* Charts Row 1: Satisfaction & Sentiment */}
      <section className="mt-10">
        <div className="flex items-center gap-3 mb-6">
          <span className="text-2xl">📈</span>
          <h2 className="text-xl font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>
            Satisfaction & Sentiment Analysis
          </h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <CSATDistributionChart records={filtered} />
          <SentimentDonut records={filtered} />
        </div>
      </section>

      {/* Charts Row 2: BU Deep Dive */}
      <section className="mt-10">
        <div className="flex items-center gap-3 mb-6">
          <span className="text-2xl">🏢</span>
          <h2 className="text-xl font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>
            Business Unit Deep Dive
          </h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <SentimentByBUChart records={filtered} />
          <ResponseVolumeChart records={filtered} />
        </div>
      </section>

      {/* Driver Satisfaction Bars */}
      <DriverSatisfactionBars records={filtered} />

      {/* CSAT Trend & Heatmap */}
      <section className="mt-10">
        <div className="flex items-center gap-3 mb-6">
          <span className="text-2xl">📅</span>
          <h2 className="text-xl font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>
            Trends & Heatmap
          </h2>
        </div>
        <CSATTrendChart records={filtered} />
        <CSATHeatmap records={filtered} />
      </section>

      {/* Facility Rankings */}
      <FacilityRankings records={filtered} />

      {/* Tags Cloud */}
      <TagsCloud records={filtered} />

      {/* Feedback Explorer */}
      <FeedbackExplorer records={filtered} />
    </div>
  );
}

export default function CXPerformancePage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[var(--accent-primary)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[var(--text-muted)]">Loading CX Performance Data…</p>
        </div>
      </div>
    }>
      <CXPerformanceContent />
    </Suspense>
  );
}
