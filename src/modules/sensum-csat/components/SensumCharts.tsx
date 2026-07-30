'use client';

import React, { useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie, Legend,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import type { SensumRecord } from '../hooks/use-sensum-data';

interface Props { records: SensumRecord[]; }

const TOOLTIP_STYLE = {
  background: '#1a2235',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 8,
  color: '#f1f5f9',
};

const SCORE_BAR_COLOR = (score: number) => {
  if (score >= 4.5) return '#10b981';
  if (score >= 4.0) return '#06b6d4';
  if (score >= 3.0) return '#f59e0b';
  return '#ef4444';
};

export default function SensumCharts({ records }: Props) {
  // 1. Monthly CSAT Trend
  const monthlyTrend = useMemo(() => {
    const map = new Map<string, { sum: number; count: number }>();
    records.forEach(r => {
      if (!r.month || r.overall_score === null) return;
      const cur = map.get(r.month) ?? { sum: 0, count: 0 };
      map.set(r.month, { sum: cur.sum + (r.overall_score ?? 0), count: cur.count + 1 });
    });
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, v]) => ({ month, score: Number((v.sum / v.count).toFixed(2)), count: v.count }));
  }, [records]);

  // 2. Score Distribution 1–5
  const scoreDist = useMemo(() => {
    const dist = [1, 2, 3, 4, 5].map(n => ({ score: `★${n}`, count: 0 }));
    records.forEach(r => {
      const s = r.overall_score;
      if (s && s >= 1 && s <= 5) dist[Math.round(s) - 1].count++;
    });
    return dist;
  }, [records]);

  // 3. CSAT by BU
  const byBU = useMemo(() => {
    const map = new Map<string, { sum: number; count: number }>();
    records.forEach(r => {
      if (r.overall_score === null) return;
      const cur = map.get(r.bu) ?? { sum: 0, count: 0 };
      map.set(r.bu, { sum: cur.sum + (r.overall_score ?? 0), count: cur.count + 1 });
    });
    return Array.from(map.entries())
      .map(([bu, v]) => ({ bu, score: Number((v.sum / v.count).toFixed(2)), count: v.count }))
      .sort((a, b) => b.score - a.score);
  }, [records]);

  // 4. Sentiment Donut
  const sentimentData = useMemo(() => {
    const pos = records.filter(r => r.sentiment === 'Positive').length;
    const neu = records.filter(r => r.sentiment === 'Neutral').length;
    const neg = records.filter(r => r.sentiment === 'Negative').length;
    return [
      { name: 'Positive', value: pos, fill: '#10b981' },
      { name: 'Neutral',  value: neu, fill: '#6366f1' },
      { name: 'Negative', value: neg, fill: '#ef4444' },
    ].filter(d => d.value > 0);
  }, [records]);

  // 5. Driver Radar – avg people/process/premises across all filtered
  const radarData = useMemo(() => {
    const calc = (key: 'people_score' | 'process_score' | 'premises_score') => {
      const vals = records.map(r => r[key]).filter((v): v is number => v !== null);
      return vals.length ? Number((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2)) : 0;
    };
    return [
      { driver: 'People',   score: calc('people_score'),   fullMark: 5 },
      { driver: 'Process',  score: calc('process_score'),  fullMark: 5 },
      { driver: 'Premises', score: calc('premises_score'), fullMark: 5 },
    ];
  }, [records]);

  // 6. Top Survey Types by avg score
  const bySurveyType = useMemo(() => {
    const map = new Map<string, { sum: number; count: number }>();
    records.forEach(r => {
      if (!r.survey_type || r.overall_score === null) return;
      const key = r.survey_type.length > 25 ? r.survey_type.slice(0, 25) + '…' : r.survey_type;
      const cur = map.get(key) ?? { sum: 0, count: 0 };
      map.set(key, { sum: cur.sum + (r.overall_score ?? 0), count: cur.count + 1 });
    });
    return Array.from(map.entries())
      .filter(([, v]) => v.count >= 5)
      .map(([type, v]) => ({ type, score: Number((v.sum / v.count).toFixed(2)), count: v.count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [records]);

  return (
    <div className="space-y-6 mt-6 animate-in">
      {/* Row 1: Trend + Score Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="glass-card lg:col-span-2">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Monthly CSAT Score Trend</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={monthlyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 10 }} />
              <YAxis domain={[1, 5]} tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Line type="monotone" dataKey="score" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} name="Avg CSAT" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4 text-center">Score Distribution</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={scoreDist} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis type="category" dataKey="score" tick={{ fill: '#94a3b8', fontSize: 13 }} width={36} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Bar dataKey="count" radius={[0, 6, 6, 0]} name="Responses">
                {scoreDist.map((entry, i) => (
                  <Cell key={i} fill={['#ef4444','#f97316','#f59e0b','#06b6d4','#10b981'][i]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row 2: BU Chart + Sentiment Donut + Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="glass-card">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Avg CSAT Score by BU</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={byBU}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="bu" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis domain={[0, 5]} tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => [`${v} / 5.00`, 'Avg CSAT']} />
              <Bar dataKey="score" radius={[6, 6, 0, 0]} name="CSAT Score">
                {byBU.map((entry, i) => (
                  <Cell key={i} fill={SCORE_BAR_COLOR(entry.score)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-2 text-center">Sentiment Breakdown</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={sentimentData} innerRadius={65} outerRadius={90} paddingAngle={3} dataKey="value" stroke="none">
                {sentimentData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-2 text-center">Driver Balance</h3>
          <ResponsiveContainer width="100%" height={260}>
            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
              <PolarGrid stroke="rgba(255,255,255,0.1)" />
              <PolarAngleAxis dataKey="driver" tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <PolarRadiusAxis angle={90} domain={[0, 5]} tick={{ fill: '#94a3b8', fontSize: 10 }} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Radar name="Score" dataKey="score" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.5} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row 3: Survey Type Bar */}
      <div className="glass-card">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">CSAT by Survey Type (Top 10 by Volume)</h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={bySurveyType}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="type" tick={{ fill: '#94a3b8', fontSize: 10 }} interval={0} angle={-15} textAnchor="end" height={50} />
            <YAxis yAxisId="left" domain={[0, 5]} tick={{ fill: '#94a3b8', fontSize: 11 }} />
            <YAxis yAxisId="right" orientation="right" tick={{ fill: '#94a3b8', fontSize: 11 }} />
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
            <Bar yAxisId="left" dataKey="score" name="Avg CSAT" radius={[6, 6, 0, 0]} fill="#06b6d4">
              {bySurveyType.map((entry, i) => (
                <Cell key={i} fill={SCORE_BAR_COLOR(entry.score)} />
              ))}
            </Bar>
            <Bar yAxisId="right" dataKey="count" name="# Responses" radius={[6, 6, 0, 0]} fill="#6366f180" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
