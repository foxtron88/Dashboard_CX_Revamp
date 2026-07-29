'use client';

import React from 'react';
import { useCSATData, useFilteredCSAT } from '@/modules/common/hooks/use-data';
import { useFilterStore } from '@/modules/common/hooks/filter-store';
import FilterBar from '@/modules/common/components/FilterBar';
import ExecutiveSummary from '@/modules/cx-performance/components/ExecutiveSummary';
import MemberCSATGrid from '@/modules/cx-performance/components/MemberCSATGrid';
import {
  CSATDistributionChart,
  SentimentDonut,
  SentimentByBUChart,
  ResponseVolumeChart,
} from '@/modules/cx-performance/components/Charts';
import { CSATTrendChart, CSATHeatmap } from '@/modules/cx-performance/components/TrendAndHeatmap';
import { FacilityRankings, TagsCloud } from '@/modules/cx-performance/components/FacilityAndTags';
import FeedbackExplorer from '@/modules/cx-performance/components/FeedbackExplorer';

export default function CXPerformancePage() {
  const { data, loading, error } = useCSATData();
  const filters = useFilterStore();

  const records = data?.records || [];
  const filtered = useFilteredCSAT(records, filters);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[var(--accent-primary)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[var(--text-muted)]">Loading CX Dashboard…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card text-center py-12">
        <p className="text-[var(--accent-danger)] text-lg font-semibold">Error loading data</p>
        <p className="text-[var(--text-muted)] mt-2">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <FilterBar records={records} />

      {/* Executive Summary */}
      <ExecutiveSummary records={filtered} />

      {/* CSAT per Member */}
      <MemberCSATGrid records={filtered} />

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
