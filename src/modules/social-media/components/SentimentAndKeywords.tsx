'use client';

import React, { useMemo } from 'react';
import {
  PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, Legend,
  ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid
} from 'recharts';
import type { SocmedStats } from '@/modules/common/hooks/use-socmed-data';

interface Props {
  stats: SocmedStats;
}

const COLORS = {
  Positif: '#10b981',
  Netral: '#6366f1',
  Negatif: '#ef4444'
};

export default function SentimentAndKeywords({ stats }: Props) {
  const postSentimentData = useMemo(() => {
    return Object.entries(stats.posts_sentiment || {})
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [stats]);

  const commentSentimentData = useMemo(() => {
    return Object.entries(stats.comments_sentiment || {})
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [stats]);

  const keywordData = useMemo(() => {
    return [...(stats.keyword_engagement || [])]
      .sort((a, b) => b.post_count - a.post_count)
      .slice(0, 15);
  }, [stats]);

  return (
    <section className="mt-10 animate-in">
      <div className="flex items-center gap-3 mb-6">
        <span className="text-2xl">🧠</span>
        <h2 className="text-xl font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>
          Sentiment & Keyword Analysis
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Post Sentiment */}
        <div className="glass-card">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4 text-center">Post Sentiment</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={postSentimentData} innerRadius={60} outerRadius={80} paddingAngle={2} dataKey="value" stroke="none">
                {postSentimentData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS] || '#8884d8'} />
                ))}
              </Pie>
              <RechartsTooltip contentStyle={{ background: '#1a2235', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }} />
              <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Comment Sentiment */}
        <div className="glass-card">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4 text-center">Comment Sentiment</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={commentSentimentData} innerRadius={60} outerRadius={80} paddingAngle={2} dataKey="value" stroke="none">
                {commentSentimentData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS] || '#8884d8'} />
                ))}
              </Pie>
              <RechartsTooltip contentStyle={{ background: '#1a2235', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }} />
              <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Top Keywords Overview */}
        <div className="glass-card">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4 text-center">Top Keywords by Volume</h3>
          <div className="flex flex-wrap gap-2 justify-center">
            {keywordData.slice(0, 10).map((kw, i) => (
              <span
                key={kw.keyword}
                className="px-3 py-1.5 rounded-full text-xs font-medium bg-[var(--bg-tertiary)] text-[var(--text-primary)] border border-[var(--glass-border)]"
                style={{ opacity: 1 - i * 0.05 }}
              >
                {kw.keyword} <span className="text-[var(--text-muted)] ml-1">({kw.post_count.toLocaleString()})</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Keyword Engagement Scatter Plot */}
      <div className="glass-card mt-4">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Keyword Engagement Landscape</h3>
        <p className="text-xs text-[var(--text-muted)] mb-4">X-Axis: Post Volume | Y-Axis: Average Likes | Bubble Size: Total Views</p>
        <ResponsiveContainer width="100%" height={300}>
          <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis type="number" dataKey="post_count" name="Posts" tick={{ fill: '#94a3b8', fontSize: 11 }} />
            <YAxis type="number" dataKey="avg_likes" name="Avg Likes" tick={{ fill: '#94a3b8', fontSize: 11 }} />
            <ZAxis type="number" dataKey="total_views" range={[60, 400]} name="Views" />
            <RechartsTooltip
              cursor={{ strokeDasharray: '3 3' }}
              contentStyle={{ background: '#1a2235', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#f1f5f9' }}
              formatter={(value: any, name: string) => [value.toLocaleString(), name]}
            />
            <Scatter name="Keywords" data={keywordData} fill="var(--accent-secondary)">
              {keywordData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={`hsl(${(index * 30) % 360}, 70%, 60%)`} />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
