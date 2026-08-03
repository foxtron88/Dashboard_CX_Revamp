'use client';

import React, { useMemo } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar, Cell
} from 'recharts';
import type { SocmedStats } from '@/modules/common/hooks/use-socmed-data';

interface Props {
  stats: SocmedStats;
}

const COLORS = {
  Positif: '#10b981',
  Netral: '#6366f1',
  Negatif: '#ef4444',
  Twitter: '#3b82f6',
  Instagram: '#ec4899',
  Youtube: '#ef4444',
  Tiktok: '#06b6d4',
  Threads: '#000000',
  Facebook: '#3b5998'
};

export default function MonthlyTrends({ stats }: Props) {
  const sentimentTrendData = useMemo(() => {
    return Object.entries(stats.monthly_sentiment_trend || {})
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]: [string, any]) => ({
        month,
        Positif: data.Positif || 0,
        Netral: data.Netral || 0,
        Negatif: data.Negatif || 0
      }));
  }, [stats]);

  const platformTrendData = useMemo(() => {
    return Object.entries(stats.monthly_platform_trend || {})
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]: [string, any]) => ({
        month,
        ...data
      }));
  }, [stats]);

  return (
    <section className="mt-10 animate-in">
      <div className="flex items-center gap-3 mb-6">
        <span className="text-2xl">📅</span>
        <h2 className="text-xl font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>
          Monthly & Platform Trends
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Sentiment Trend */}
        <div className="glass-card">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Sentiment Trend over Time</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={sentimentTrendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <Tooltip itemStyle={{ color: "#ffffff", fontSize: 12, fontWeight: 600 }} labelStyle={{ color: "#94a3b8", fontSize: 11 }} contentStyle={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8, color: "#ffffff" }} />
              <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
              <Area type="monotone" dataKey="Positif" stackId="1" stroke={COLORS.Positif} fill={`${COLORS.Positif}80`} />
              <Area type="monotone" dataKey="Netral" stackId="1" stroke={COLORS.Netral} fill={`${COLORS.Netral}80`} />
              <Area type="monotone" dataKey="Negatif" stackId="1" stroke={COLORS.Negatif} fill={`${COLORS.Negatif}80`} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Platform Volume Trend */}
        <div className="glass-card">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Post Volume by Platform</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={platformTrendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <Tooltip itemStyle={{ color: "#ffffff", fontSize: 12, fontWeight: 600 }} labelStyle={{ color: "#94a3b8", fontSize: 11 }} contentStyle={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8, color: "#ffffff" }} />
              <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
              <Bar dataKey="Instagram" stackId="a" fill={COLORS.Instagram} />
              <Bar dataKey="Tiktok" stackId="a" fill={COLORS.Tiktok} />
              <Bar dataKey="Twitter" stackId="a" fill={COLORS.Twitter} />
              <Bar dataKey="Youtube" stackId="a" fill={COLORS.Youtube} />
              <Bar dataKey="Threads" stackId="a" fill={COLORS.Threads} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Platform Engagement Metrics Table */}
      <div className="glass-card mt-4 overflow-hidden !p-0">
        <div className="p-4 border-b border-[var(--glass-border)] bg-[var(--bg-secondary)]">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Platform Engagement Metrics</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[var(--glass-border)]">
                <th className="p-3 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">Platform</th>
                <th className="p-3 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider text-right">Posts</th>
                <th className="p-3 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider text-right">Likes</th>
                <th className="p-3 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider text-right">Views</th>
                <th className="p-3 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider text-right">Replies</th>
                <th className="p-3 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider text-right">Avg Likes</th>
              </tr>
            </thead>
            <tbody>
              {stats.platform_stats.map((p, i) => (
                <tr key={p.platform} className="border-b border-[var(--glass-border)] hover:bg-[var(--glass-bg)] transition-colors">
                  <td className="p-3 text-sm font-semibold flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[p.platform as keyof typeof COLORS] || '#94a3b8' }}></span>
                    {p.platform}
                  </td>
                  <td className="p-3 text-sm text-right text-[var(--text-primary)]">{p.post_count.toLocaleString()}</td>
                  <td className="p-3 text-sm text-right text-[var(--text-secondary)]">{p.total_likes.toLocaleString()}</td>
                  <td className="p-3 text-sm text-right text-[var(--text-secondary)]">{p.total_views.toLocaleString()}</td>
                  <td className="p-3 text-sm text-right text-[var(--text-secondary)]">{p.total_replies.toLocaleString()}</td>
                  <td className="p-3 text-sm text-right font-medium" style={{ color: 'var(--accent-info)' }}>{p.avg_likes.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
