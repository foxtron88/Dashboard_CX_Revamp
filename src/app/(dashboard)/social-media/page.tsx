'use client';

import React, { Suspense, useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSocmedData } from '@/modules/common/hooks/use-socmed-data';
import { useFilterStore } from '@/modules/common/hooks/filter-store';
import OverviewCards from '@/modules/social-media/components/OverviewCards';
import MonthlyTrends from '@/modules/social-media/components/MonthlyTrends';
import SentimentAndKeywords from '@/modules/social-media/components/SentimentAndKeywords';
import ViralAndResponse from '@/modules/social-media/components/ViralAndResponse';
import type { SocmedStats } from '@/modules/common/hooks/use-socmed-data';

/* eslint-disable @typescript-eslint/no-explicit-any */

const BU_LIST = ['API', 'HIN', 'IAS', 'IDM - TMII', 'IDM - TWC', 'ITDC', 'Sarinah', 'InJourney'];

function filterStatsByMonthRange(statsObj: SocmedStats, fromMonth: string, toMonth: string): SocmedStats {
  if (!fromMonth && !toMonth) return statsObj;

  const trend: Record<string, any> = statsObj.monthly_sentiment_trend || {};
  const platformTrend: Record<string, any> = statsObj.monthly_platform_trend || {};
  const allMonthKeys = Object.keys(trend).sort();

  const filtered = allMonthKeys.filter(k => {
    if (fromMonth && k < fromMonth) return false;
    if (toMonth && k > toMonth) return false;
    return true;
  });

  // Compute ratio for scaling lifetime metrics
  let allPosts = 0, rangedPosts = 0;
  allMonthKeys.forEach(k => {
    const mo = platformTrend[k] || {};
    const s = Object.values(mo).reduce((a: number, v: any) => a + (v || 0), 0);
    allPosts += s;
    if (filtered.includes(k)) rangedPosts += s;
  });
  const ratio = allPosts > 0 ? rangedPosts / allPosts : 1;

  // Rebuild filtered monthly_sentiment_trend and monthly_platform_trend
  const filteredSentimentTrend: Record<string, any> = {};
  const filteredPlatformTrend: Record<string, any> = {};
  filtered.forEach(k => {
    filteredSentimentTrend[k] = trend[k];
    filteredPlatformTrend[k] = platformTrend[k] || {};
  });

  // Recompute sentiment totals
  let pos = 0, neg = 0, neu = 0;
  filtered.forEach(k => {
    pos += (statsObj.monthly_sentiment_trend[k]?.Positif || 0);
    neg += (statsObj.monthly_sentiment_trend[k]?.Negatif || 0);
    neu += (statsObj.monthly_sentiment_trend[k]?.Netral || 0);
  });

  return {
    ...statsObj,
    total_posts: rangedPosts,
    total_comments: Math.round(statsObj.total_comments * ratio),
    total_likes: Math.round(statsObj.total_likes * ratio),
    total_views: Math.round(statsObj.total_views * ratio),
    total_replies: Math.round(statsObj.total_replies * ratio),
    posts_sentiment: { Positif: pos, Negatif: neg, Netral: neu },
    comments_sentiment: statsObj.comments_sentiment,
    monthly_sentiment_trend: filteredSentimentTrend,
    monthly_platform_trend: filteredPlatformTrend,
  };
}

function SocialMediaContent() {
  const searchParams = useSearchParams();
  const { currentStats, loading, error } = useSocmedData();
  const { businessUnit, setBusinessUnit } = useFilterStore();
  const [fromMonth, setFromMonth] = useState(searchParams.get('from') || '');
  const [toMonth, setToMonth] = useState(searchParams.get('to') || '');

  const filteredStats = useMemo(() => {
    if (!currentStats) return null;
    return filterStatsByMonthRange(currentStats, fromMonth, toMonth);
  }, [currentStats, fromMonth, toMonth]);

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

  if (error || !filteredStats) {
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

        <div className="flex flex-col">
          <label className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-1">From Month</label>
          <input type="month" value={fromMonth} onChange={e => setFromMonth(e.target.value)}
            className={selectClass} style={{ colorScheme: 'dark' }} />
        </div>

        <div className="flex flex-col">
          <label className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-1">To Month</label>
          <input type="month" value={toMonth} onChange={e => setToMonth(e.target.value)}
            className={selectClass} style={{ colorScheme: 'dark' }} />
        </div>

        {(fromMonth || toMonth) && (
          <button
            onClick={() => { setFromMonth(''); setToMonth(''); }}
            className="text-xs px-3 py-2 rounded-lg text-[var(--accent-danger)] border border-[var(--accent-danger)]/30 hover:bg-[var(--accent-danger)]/10 transition-all"
          >
            ✕ Reset Dates
          </button>
        )}
      </div>

      {/* Overview Cards (NSS & KPI Totals) */}
      <OverviewCards stats={filteredStats} />

      {/* Monthly Sentiment & Platform Trends */}
      <MonthlyTrends stats={filteredStats} />

      {/* Sentiment Donuts & Keyword Analysis */}
      <SentimentAndKeywords stats={filteredStats} />

      {/* Response Time & Viral Posts */}
      <ViralAndResponse stats={filteredStats} />
    </div>
  );
}

export default function SocialMediaPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[var(--accent-primary)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[var(--text-muted)]">Loading Social Media Data…</p>
        </div>
      </div>
    }>
      <SocialMediaContent />
    </Suspense>
  );
}
