'use client';

import React, { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell
} from 'recharts';
import type { SocmedStats } from '@/modules/common/hooks/use-socmed-data';

interface Props {
  stats: SocmedStats;
}

const SENTIMENT_COLORS: Record<string, string> = {
  Positif: 'bg-emerald-500/20 text-emerald-400',
  Netral: 'bg-indigo-500/20 text-indigo-400',
  Negatif: 'bg-red-500/20 text-red-400',
};

function sentimentBadge(s: string) {
  return SENTIMENT_COLORS[s] || 'bg-gray-500/20 text-gray-400';
}

export default function ViralAndResponse({ stats }: Props) {
  const hourlyData = useMemo(() => {
    return Array.from({ length: 24 }).map((_, i) => ({
      hour: `${i.toString().padStart(2, '0')}:00`,
      comments: stats.comments_by_hour?.[i.toString()] || 0
    }));
  }, [stats]);

  const responseTimeData = useMemo(() => {
    const rt = stats.response_time || {};
    return [
      { label: '< 1 Hour', value: rt.within_1h || 0, color: '#10b981' },
      { label: '1 - 6 Hours', value: rt.within_6h || 0, color: '#3b82f6' },
      { label: '6 - 24 Hours', value: rt.within_24h || 0, color: '#f59e0b' },
      { label: '> 24 Hours', value: rt.over_24h || 0, color: '#ef4444' },
    ];
  }, [stats]);

  return (
    <section className="mt-10 animate-in">
      <div className="flex items-center gap-3 mb-6">
        <span className="text-2xl">🔥</span>
        <h2 className="text-xl font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>
          Response Time & Viral Leaderboard
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {/* Brand Response Time Distribution */}
        <div className="glass-card">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4 text-center">Brand Response Time</h3>
          <div className="flex flex-col gap-4">
            <div className="text-center">
              <p className="text-xs text-[var(--text-muted)] uppercase">Average Response Time</p>
              <p className="text-3xl font-bold text-[var(--accent-primary)] mt-1" style={{ fontFamily: 'var(--font-display)' }}>
                {Math.round(stats.avg_response_time_minutes / 60)}h {Math.round(stats.avg_response_time_minutes % 60)}m
              </p>
            </div>
            <div className="space-y-3 mt-2">
              {responseTimeData.map(rt => {
                const total = responseTimeData.reduce((acc, curr) => acc + curr.value, 0);
                const pct = total > 0 ? (rt.value / total) * 100 : 0;
                return (
                  <div key={rt.label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-[var(--text-secondary)]">{rt.label}</span>
                      <span className="text-[var(--text-primary)] font-medium">{rt.value.toLocaleString()} ({pct.toFixed(1)}%)</span>
                    </div>
                    <div className="w-full bg-[var(--bg-primary)] rounded-full h-2">
                      <div className="h-2 rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: rt.color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Hourly Comment Activity */}
        <div className="glass-card">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4 text-center">Hourly Comment Activity</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={hourlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="hour" tick={{ fill: '#94a3b8', fontSize: 10 }} interval={2} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <RechartsTooltip contentStyle={{ background: '#1a2235', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#f1f5f9' }} />
              <Bar dataKey="comments" radius={[4, 4, 0, 0]}>
                {hourlyData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill="var(--accent-secondary)" opacity={0.8} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top 10 Viral Posts Table */}
      <div className="glass-card !p-0 overflow-hidden">
        <div className="p-4 border-b border-[var(--glass-border)] bg-[var(--bg-secondary)] flex justify-between items-center">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Top 10 Viral Posts</h3>
          <span className="text-xs text-[var(--text-muted)]">Ranked by Views & Engagement</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[var(--glass-border)]">
                <th className="p-3 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider w-10 text-center">#</th>
                <th className="p-3 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">Platform</th>
                <th className="p-3 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">Post Snippet</th>
                <th className="p-3 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider text-right">Views</th>
                <th className="p-3 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider text-right">Likes</th>
                <th className="p-3 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider text-right">Replies</th>
                <th className="p-3 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider text-center">Sentiment</th>
                <th className="p-3 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider text-right">Date</th>
              </tr>
            </thead>
            <tbody>
              {stats.top_viral_posts?.slice(0, 10).map((post, i) => (
                <tr key={i} className="border-b border-[var(--glass-border)] hover:bg-[var(--glass-bg)] transition-colors">
                  <td className="p-3 text-sm font-bold text-center text-[var(--text-muted)]">{i + 1}</td>
                  <td className="p-3 text-sm text-[var(--text-secondary)]">{post.platform}</td>
                  <td className="p-3 text-sm text-[var(--text-primary)] font-medium max-w-xs truncate" title={post.title}>
                    {post.title}
                  </td>
                  <td className="p-3 text-sm text-right text-[var(--text-primary)]">{post.views.toLocaleString()}</td>
                  <td className="p-3 text-sm text-right text-[var(--accent-info)]">{post.likes.toLocaleString()}</td>
                  <td className="p-3 text-sm text-right text-[var(--text-secondary)]">{post.replies.toLocaleString()}</td>
                  <td className="p-3 text-center">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${sentimentBadge(post.sentiment)}`}>
                      {post.sentiment}
                    </span>
                  </td>
                  <td className="p-3 text-sm text-right text-[var(--text-muted)] whitespace-nowrap">{post.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
