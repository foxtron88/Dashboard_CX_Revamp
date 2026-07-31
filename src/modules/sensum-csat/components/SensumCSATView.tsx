'use client';

import React, { useState, useMemo } from 'react';
import { useSensumData, useSensumFiltered } from '../hooks/use-sensum-data';
import SensumKPICards from './SensumKPICards';
import SensumCharts from './SensumCharts';
import SensumFacilityTable from './SensumFacilityTable';
import SensumVerbatimTable from './SensumVerbatimTable';
import DriverClassificationManager from './DriverClassificationManager';

const BUS = ['ALL', 'API', 'IDM', 'IJH', 'IAS', 'ITDC', 'Sarinah'];
const SENTIMENTS = ['ALL', 'Positive', 'Neutral', 'Negative'];

type TabId = 'overview' | 'facilities' | 'verbatim' | 'classification';

export default function SensumCSATView() {
  const { data, loading, error } = useSensumData();
  const [bu, setBU] = useState('ALL');
  const [surveyType, setSurveyType] = useState('ALL');
  const [sentiment, setSentiment] = useState('ALL');
  const [fromMonth, setFromMonth] = useState('');
  const [toMonth, setToMonth] = useState('');
  const [activeTab, setActiveTab] = useState<TabId>('overview');

  const surveyTypes = useMemo(() => {
    if (!data) return ['ALL'];
    const types = Array.from(new Set(data.map(r => r.survey_type).filter(Boolean))).sort();
    return ['ALL', ...types];
  }, [data]);

  const filtered = useSensumFiltered(data, bu, surveyType, sentiment, fromMonth, toMonth);

  const tabs: { id: TabId; label: string; icon: string }[] = [
    { id: 'overview',       label: 'Overview & Trends',         icon: '📊' },
    { id: 'facilities',     label: 'Facility Rankings',          icon: '🏆' },
    { id: 'verbatim',       label: 'Verbatim Feedback',          icon: '💬' },
    { id: 'classification', label: 'Driver Rules & Classification', icon: '⚙️' },
  ];

  if (error) return (
    <div className="flex items-center justify-center h-64 text-[var(--accent-danger)]">
      ⚠️ Failed to load: {error}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
              style={{ background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)' }}>⭐</div>
            <div>
              <h1 className="text-2xl font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>
                Sensum CSAT
              </h1>
              <p className="text-xs text-[var(--text-muted)]">Facility Customer Satisfaction Survey — 25,002 distinct responses</p>
            </div>
          </div>
        </div>
        {loading && (
          <div className="flex items-center gap-2 text-[var(--text-muted)] text-sm">
            <div className="w-3 h-3 rounded-full border-2 border-t-transparent border-[var(--accent-primary)] animate-spin" />
            Loading dataset…
          </div>
        )}
      </div>

      {/* Filters (show on overview, facilities, verbatim) */}
      {activeTab !== 'classification' && (
        <div className="glass-card flex flex-wrap items-end gap-4">
          <div>
            <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1">Business Unit</p>
            <div className="flex flex-wrap gap-1">
              {BUS.map(b => (
                <button key={b} onClick={() => setBU(b)}
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

          {(bu !== 'ALL' || surveyType !== 'ALL' || sentiment !== 'ALL' || fromMonth || toMonth) && (
            <button onClick={() => { setBU('ALL'); setSurveyType('ALL'); setSentiment('ALL'); setFromMonth(''); setToMonth(''); }}
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
      )}

      {/* KPI Cards (show on overview, facilities, verbatim) */}
      {activeTab !== 'classification' && (
        loading
          ? <div className="grid grid-cols-4 gap-4">{[...Array(4)].map((_, i) => <div key={i} className="glass-card h-32 animate-pulse bg-[var(--glass-bg)]" />)}</div>
          : <SensumKPICards records={filtered} />
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-[var(--glass-border)]">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`px-5 py-3 text-sm font-medium flex items-center gap-2 border-b-2 transition-all
              ${activeTab === t.id ? 'border-[var(--accent-primary)] text-[var(--accent-primary-light)]' : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}>
            <span>{t.icon}</span>{t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'classification' && <DriverClassificationManager />}
      {!loading && activeTab !== 'classification' && (
        <>
          {activeTab === 'overview'   && <SensumCharts records={filtered} />}
          {activeTab === 'facilities' && <SensumFacilityTable records={filtered} />}
          {activeTab === 'verbatim'   && <SensumVerbatimTable records={filtered} />}
        </>
      )}
    </div>
  );
}
