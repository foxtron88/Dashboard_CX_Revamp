'use client';

import React from 'react';
import type { SocmedStats } from '@/modules/common/hooks/use-socmed-data';

interface Props {
  stats: SocmedStats;
}

export default function OverviewCards({ stats }: Props) {
  const { posts_sentiment, comments_sentiment } = stats;

  const pos = (posts_sentiment?.['Positif'] || 0) + (comments_sentiment?.['Positif'] || 0);
  const neg = (posts_sentiment?.['Negatif'] || 0) + (comments_sentiment?.['Negatif'] || 0);
  const neu = (posts_sentiment?.['Netral'] || 0) + (comments_sentiment?.['Netral'] || 0);
  const totalSentiment = pos + neg + neu;
  
  const nss = totalSentiment > 0 ? ((pos - neg) / totalSentiment) * 100 : 0;
  
  const kpis = [
    { label: 'Total Posts', value: stats.total_posts.toLocaleString(), icon: '📝', color: 'var(--accent-info)' },
    { label: 'Total Comments', value: stats.total_comments.toLocaleString(), icon: '💬', color: 'var(--accent-secondary)' },
    { label: 'Total Likes', value: stats.total_likes.toLocaleString(), icon: '❤️', color: 'var(--accent-primary)' },
    { label: 'Total Views', value: stats.total_views.toLocaleString(), icon: '👁️', color: 'var(--accent-tertiary)' },
    { label: 'Platforms', value: stats.platform_stats.length.toString(), icon: '📱', color: 'var(--accent-success)' },
  ];

  return (
    <section className="animate-in space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <span className="text-2xl">📱</span>
        <h2 className="text-xl font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>
          Social Media Overview
        </h2>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* NSS Card */}
        <div className="glass-card flex flex-col justify-center items-center text-center col-span-2 md:col-span-1 lg:col-span-1 border-t-4 border-t-[var(--accent-primary)]">
          <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">
            Net Sentiment Score
          </p>
          <div className="text-3xl font-bold" style={{ color: nss >= 0 ? 'var(--accent-success)' : 'var(--accent-danger)', fontFamily: 'var(--font-display)' }}>
            {nss > 0 ? '+' : ''}{nss.toFixed(1)}
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Based on {totalSentiment.toLocaleString()} mentions
          </p>
        </div>

        {/* KPIs */}
        {kpis.map(kpi => (
          <div key={kpi.label} className="glass-card flex flex-col justify-center items-center text-center">
            <span className="text-2xl mb-1">{kpi.icon}</span>
            <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mt-1">{kpi.label}</p>
            <p className="text-2xl font-bold mt-1" style={{ color: kpi.color, fontFamily: 'var(--font-display)' }}>
              {kpi.value}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
