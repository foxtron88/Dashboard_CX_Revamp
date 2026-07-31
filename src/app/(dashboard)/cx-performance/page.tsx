'use client';

import React from 'react';
import { useCSATData } from '@/modules/common/hooks/use-data';
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

export default function ExecutiveSummaryPage() {
  const { data, loading, error } = useCSATData();
  const records = data?.records || [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[var(--accent-primary)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[var(--text-muted)]">Loading Executive Summary…</p>
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
      {/* Executive Summary Cards */}
      <ExecutiveSummary records={records} />

      {/* CSAT per Member */}
      <MemberCSATGrid records={records} />

      {/* Charts Row 1: Satisfaction & Sentiment */}
      <section className="mt-10">
        <div className="flex items-center gap-3 mb-6">
          <span className="text-2xl">📈</span>
          <h2 className="text-xl font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>
            Satisfaction & Sentiment Analysis
          </h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <CSATDistributionChart records={records} />
          <SentimentDonut records={records} />
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
          <SentimentByBUChart records={records} />
          <ResponseVolumeChart records={records} />
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
        <CSATTrendChart records={records} />
        <CSATHeatmap records={records} />
      </section>

      {/* Facility Rankings */}
      <FacilityRankings records={records} />

      {/* Tags Cloud */}
      <TagsCloud records={records} />

      {/* Feedback Explorer */}
      <FeedbackExplorer records={records} />
    </div>
  );
}
