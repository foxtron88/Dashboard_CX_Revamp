'use client';

import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import type { SocmedStats } from '@/modules/common/hooks/use-socmed-data';

interface Props {
  socmedStats: SocmedStats | null;
  opsStats: any | null;
}

const COLORS = {
  Positif: '#10b981',
  Netral: '#6366f1',
  Negatif: '#ef4444'
};

export default function ExecutiveSummaryTopMetrics({ socmedStats, opsStats }: Props) {
  const pos = (socmedStats?.posts_sentiment?.['Positif'] || 0) + (socmedStats?.comments_sentiment?.['Positif'] || 0);
  const neg = (socmedStats?.posts_sentiment?.['Negatif'] || 0) + (socmedStats?.comments_sentiment?.['Negatif'] || 0);
  const neu = (socmedStats?.posts_sentiment?.['Netral'] || 0) + (socmedStats?.comments_sentiment?.['Netral'] || 0);
  const totalSentiment = pos + neg + neu;
  const nss = totalSentiment > 0 ? ((pos - neg) / totalSentiment) * 100 : 0;

  const postSentimentData = useMemo(() => {
    return Object.entries(socmedStats?.posts_sentiment || {})
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [socmedStats]);

  const commentSentimentData = useMemo(() => {
    return Object.entries(socmedStats?.comments_sentiment || {})
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [socmedStats]);

  const keywordData = useMemo(() => {
    return [...(socmedStats?.keyword_engagement || [])]
      .sort((a, b) => b.post_count - a.post_count)
      .slice(0, 8); 
  }, [socmedStats]);

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 mb-6 animate-in">
      {/* 1. Total Visitor Traffic */}
      <div className="glass-card flex flex-col justify-center border-t-2 border-t-indigo-500 p-4">
        <p className="text-[9px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1">
          Total Visitor Traffic
        </p>
        <div className="text-xl font-bold text-indigo-400" style={{ fontFamily: 'var(--font-display)' }}>
          {opsStats?.overall?.visitors?.toLocaleString() || 0}
        </div>
        <p className="text-[9px] text-slate-400 mt-1 leading-tight">Total visitors across selected member(s)</p>
      </div>

      {/* 2. Total Channel Interactions */}
      <div className="glass-card flex flex-col justify-center border-t-2 border-t-cyan-500 p-4">
        <p className="text-[9px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1">
          Total Channel Interactions
        </p>
        <div className="text-xl font-bold text-cyan-400" style={{ fontFamily: 'var(--font-display)' }}>
          {opsStats?.overall?.interactions?.toLocaleString() || 0}
        </div>
        <p className="text-[9px] text-slate-400 mt-1 leading-tight">Across 14 customer contact channels</p>
      </div>

      {/* 3. Net Sentiment Score */}
      <div className="glass-card flex flex-col justify-center items-center text-center border-t-2 border-t-[var(--accent-primary)] p-4">
        <p className="text-[9px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1">
          Net Sentiment Score
        </p>
        <div className="text-2xl font-bold" style={{ color: nss >= 0 ? 'var(--accent-success)' : 'var(--accent-danger)', fontFamily: 'var(--font-display)' }}>
          {nss > 0 ? '+' : ''}{nss.toFixed(1)}
        </div>
        <p className="text-[9px] text-[var(--text-secondary)] mt-1">
          Based on {totalSentiment.toLocaleString()} mentions
        </p>
      </div>

      {/* 4. Post Sentiment */}
      <div className="glass-card flex flex-col justify-center p-3">
        <h3 className="text-[9px] font-semibold text-[var(--text-primary)] mb-1 text-center uppercase tracking-wider">Post Sentiment</h3>
        <div className="h-[70px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={postSentimentData} innerRadius={22} outerRadius={32} paddingAngle={2} dataKey="value" stroke="none">
                {postSentimentData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS] || '#8884d8'} />
                ))}
              </Pie>
              <RechartsTooltip contentStyle={{ background: '#1a2235', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: '10px', padding: '4px' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex justify-center gap-2 mt-1 text-[8px]">
          <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 bg-red-500 rounded-sm"></div> Negatif</span>
          <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 bg-indigo-500 rounded-sm"></div> Netral</span>
          <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 bg-emerald-500 rounded-sm"></div> Positif</span>
        </div>
      </div>

      {/* 5. Comment Sentiment */}
      <div className="glass-card flex flex-col justify-center p-3">
        <h3 className="text-[9px] font-semibold text-[var(--text-primary)] mb-1 text-center uppercase tracking-wider">Comment Sentiment</h3>
        <div className="h-[70px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={commentSentimentData} innerRadius={22} outerRadius={32} paddingAngle={2} dataKey="value" stroke="none">
                {commentSentimentData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS] || '#8884d8'} />
                ))}
              </Pie>
              <RechartsTooltip contentStyle={{ background: '#1a2235', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: '10px', padding: '4px' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex justify-center gap-2 mt-1 text-[8px]">
          <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 bg-red-500 rounded-sm"></div> Negatif</span>
          <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 bg-indigo-500 rounded-sm"></div> Netral</span>
          <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 bg-emerald-500 rounded-sm"></div> Positif</span>
        </div>
      </div>

      {/* 6. Top Keywords */}
      <div className="glass-card flex flex-col justify-center p-3">
        <h3 className="text-[9px] font-semibold text-[var(--text-primary)] mb-2 text-center uppercase tracking-wider">Top Keywords</h3>
        <div className="flex flex-wrap gap-1 justify-center">
          {keywordData.map((kw, i) => (
            <span
              key={kw.keyword}
              className="px-1.5 py-0.5 rounded-full text-[9px] font-medium bg-[var(--bg-tertiary)] text-[var(--text-primary)] border border-[var(--glass-border)] truncate max-w-[100px]"
              style={{ opacity: 1 - i * 0.08 }}
              title={`${kw.keyword} (${kw.post_count.toLocaleString()})`}
            >
              {kw.keyword}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
