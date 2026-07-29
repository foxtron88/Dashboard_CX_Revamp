'use client';

import React from 'react';
import { useSocmedData } from '@/modules/common/hooks/use-socmed-data';
import { useFilterStore } from '@/modules/common/hooks/filter-store';
import OverviewCards from '@/modules/social-media/components/OverviewCards';
import MonthlyTrends from '@/modules/social-media/components/MonthlyTrends';
import SentimentAndKeywords from '@/modules/social-media/components/SentimentAndKeywords';
import ViralAndResponse from '@/modules/social-media/components/ViralAndResponse';

const BU_LIST = ['API', 'HIN', 'IAS', 'IDM - TMII', 'IDM - TWC', 'ITDC', 'Sarinah', 'InJourney'];

export default function SocialMediaPage() {
  const { currentStats, loading, error } = useSocmedData();
  const { businessUnit, setBusinessUnit } = useFilterStore();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[var(--accent-primary)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[var(--text-muted)]">Loading Social Media Data…</p>
        </div>
      </div>
    );
  }

  if (error || !currentStats) {
    return (
      <div className="glass-card text-center py-12">
        <p className="text-[var(--accent-danger)] text-lg font-semibold">Error loading data</p>
        <p className="text-[var(--text-muted)] mt-2">{error || 'No data available'}</p>
      </div>
    );
  }

  const selectClass = `
    bg-[var(--bg-tertiary)] border border-[var(--glass-border)] rounded-lg px-3 py-2
    text-sm text-[var(--text-primary)] outline-none
    focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)]
    transition-all duration-200 min-w-[140px]
  `;

  return (
    <div className="space-y-6">
      {/* Social Media Filter Bar */}
      <div className="glass-card !p-4 flex flex-wrap items-end gap-4 animate-in">
        <div className="flex flex-col">
          <label className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-1">
            Business Unit
          </label>
          <select 
            className={selectClass} 
            value={businessUnit === 'all' ? 'ALL' : businessUnit} 
            onChange={e => setBusinessUnit(e.target.value === 'ALL' ? 'all' : e.target.value)}
          >
            <option value="ALL">All Units (Global)</option>
            {BU_LIST.map(bu => <option key={bu} value={bu}>{bu}</option>)}
          </select>
        </div>
      </div>

      {/* Overview Cards (NSS & KPI Totals) */}
      <OverviewCards stats={currentStats} />

      {/* Monthly Sentiment & Platform Trends */}
      <MonthlyTrends stats={currentStats} />

      {/* Sentiment Donuts & Keyword Analysis */}
      <SentimentAndKeywords stats={currentStats} />

      {/* Response Time & Viral Posts */}
      <ViralAndResponse stats={currentStats} />
    </div>
  );
}
