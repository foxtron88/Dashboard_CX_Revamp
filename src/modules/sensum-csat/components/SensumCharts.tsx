'use client';

import React, { useMemo, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie, Legend,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import type { SensumRecord } from '../hooks/use-sensum-data';

interface Props { records: SensumRecord[]; }

type MetricKey = 'overall_score' | 'people_score' | 'process_score' | 'premises_score';

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
  const [buMetric, setBuMetric] = useState<MetricKey>('overall_score');
  const [typeMetric, setTypeMetric] = useState<MetricKey>('overall_score');

  // 1. Monthly CSAT Trend for ALL 4 Cascaded Pillars (Overall, People, Process, Premises)
  const monthlyTrend = useMemo(() => {
    const map = new Map<string, {
      overallSum: number; overallCnt: number;
      peopleSum: number;  peopleCnt: number;
      processSum: number; processCnt: number;
      premisesSum: number; premisesCnt: number;
    }>();

    records.forEach(r => {
      if (!r.month) return;
      const cur = map.get(r.month) ?? {
        overallSum: 0, overallCnt: 0,
        peopleSum: 0,  peopleCnt: 0,
        processSum: 0, processCnt: 0,
        premisesSum: 0, premisesCnt: 0,
      };

      if (r.overall_score !== null)  { cur.overallSum += r.overall_score;   cur.overallCnt++; }
      if (r.people_score !== null)   { cur.peopleSum += r.people_score;     cur.peopleCnt++; }
      if (r.process_score !== null)  { cur.processSum += r.process_score;   cur.processCnt++; }
      if (r.premises_score !== null) { cur.premisesSum += r.premises_score; cur.premisesCnt++; }

      map.set(r.month, cur);
    });

    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, v]) => ({
        month,
        Overall:  v.overallCnt  ? Number((v.overallSum  / v.overallCnt).toFixed(2))  : null,
        People:   v.peopleCnt   ? Number((v.peopleSum   / v.peopleCnt).toFixed(2))   : null,
        Process:  v.processCnt  ? Number((v.processSum  / v.processCnt).toFixed(2))  : null,
        Premises: v.premisesCnt ? Number((v.premisesSum / v.premisesCnt).toFixed(2)) : null,
      }));
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

  // 3. CSAT by BU (supporting Metric Selector)
  const byBU = useMemo(() => {
    const map = new Map<string, { sum: number; count: number }>();
    records.forEach(r => {
      const val = r[buMetric];
      if (val === null) return;
      const cur = map.get(r.bu) ?? { sum: 0, count: 0 };
      map.set(r.bu, { sum: cur.sum + val, count: cur.count + 1 });
    });
    return Array.from(map.entries())
      .map(([bu, v]) => ({ bu, score: Number((v.sum / v.count).toFixed(2)), count: v.count }))
      .sort((a, b) => b.score - a.score);
  }, [records, buMetric]);

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

  // 5. Driver Radar – avg overall/people/process/premises across all filtered
  const radarData = useMemo(() => {
    const calc = (key: MetricKey) => {
      const vals = records.map(r => r[key]).filter((v): v is number => v !== null);
      return vals.length ? Number((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2)) : 0;
    };
    return [
      { driver: 'Overall',  score: calc('overall_score'),  fullMark: 5 },
      { driver: 'People',   score: calc('people_score'),   fullMark: 5 },
      { driver: 'Process',  score: calc('process_score'),  fullMark: 5 },
      { driver: 'Premises', score: calc('premises_score'), fullMark: 5 },
    ];
  }, [records]);

  // 6. Top Survey Types by selected score metric
  const bySurveyType = useMemo(() => {
    const map = new Map<string, { sum: number; count: number }>();
    records.forEach(r => {
      const val = r[typeMetric];
      if (!r.survey_type || val === null) return;
      const key = r.survey_type.length > 25 ? r.survey_type.slice(0, 25) + '…' : r.survey_type;
      const cur = map.get(key) ?? { sum: 0, count: 0 };
      map.set(key, { sum: cur.sum + val, count: cur.count + 1 });
    });
    return Array.from(map.entries())
      .filter(([, v]) => v.count >= 5)
      .map(([type, v]) => ({ type, score: Number((v.sum / v.count).toFixed(2)), count: v.count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [records, typeMetric]);

  const metricButtons: { key: MetricKey; label: string }[] = [
    { key: 'overall_score',  label: 'Overall' },
    { key: 'people_score',   label: 'People' },
    { key: 'process_score',  label: 'Process' },
    { key: 'premises_score', label: 'Premises' },
  ];

  return (
    <div className="space-y-6 mt-6 animate-in">
      {/* Row 1: Monthly CSAT Trend (4 Cascaded Lines) + Score Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="glass-card lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">Monthly CSAT Trend by Driver</h3>
              <p className="text-[11px] text-[var(--text-muted)]">Cascaded breakdown: Overall, People, Process, Premises</p>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={monthlyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 10 }} />
              <YAxis domain={[1, 5]} tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <Tooltip itemStyle={{ color: "#ffffff", fontSize: 12, fontWeight: 600 }} labelStyle={{ color: "#94a3b8", fontSize: 11 }} contentStyle={TOOLTIP_STYLE} />
              <Legend wrapperStyle={{ fontSize: 11, paddingTop: 4 }} />
              <Line type="monotone" dataKey="Overall"  stroke="#10b981" strokeWidth={3} dot={{ r: 3 }} name="Overall CSAT" connectNulls />
              <Line type="monotone" dataKey="People"   stroke="#6366f1" strokeWidth={2} dot={{ r: 2 }} name="People (PPL)" connectNulls />
              <Line type="monotone" dataKey="Process"  stroke="#06b6d4" strokeWidth={2} dot={{ r: 2 }} name="Process (PRC)" connectNulls />
              <Line type="monotone" dataKey="Premises" stroke="#ec4899" strokeWidth={2} dot={{ r: 2 }} name="Premises (PRM)" connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4 text-center">Overall Score Distribution</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={scoreDist} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis type="category" dataKey="score" tick={{ fill: '#94a3b8', fontSize: 13 }} width={36} />
              <Tooltip itemStyle={{ color: "#ffffff", fontSize: 12, fontWeight: 600 }} labelStyle={{ color: "#94a3b8", fontSize: 11 }} contentStyle={TOOLTIP_STYLE} />
              <Bar dataKey="count" radius={[0, 6, 6, 0]} name="Responses">
                {scoreDist.map((entry, i) => (
                  <Cell key={i} fill={['#ef4444','#f97316','#f59e0b','#06b6d4','#10b981'][i]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row 2: BU Chart (with Cascaded Metric Selector) + Sentiment Donut + Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="glass-card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">Score by Member</h3>
            <div className="flex gap-1 bg-black/20 p-0.5 rounded-lg border border-[var(--glass-border)]">
              {metricButtons.map(m => (
                <button
                  key={m.key}
                  onClick={() => setBuMetric(m.key)}
                  className={`px-1.5 py-0.5 text-[10px] font-medium rounded ${buMetric === m.key ? 'bg-[var(--accent-primary)]/30 text-[var(--accent-primary-light)]' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={byBU}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="bu" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis domain={[0, 5]} tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <Tooltip itemStyle={{ color: "#ffffff", fontSize: 12, fontWeight: 600 }} labelStyle={{ color: "#94a3b8", fontSize: 11 }} contentStyle={TOOLTIP_STYLE} formatter={(v) => [`${v} / 5.00`, buMetric.replace('_score','').toUpperCase()]} />
              <Bar dataKey="score" radius={[6, 6, 0, 0]} name="Score">
                {byBU.map((entry, i) => (
                  <Cell key={i} fill={SCORE_BAR_COLOR(entry.score)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-2 text-center">Sentiment Breakdown</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={sentimentData} innerRadius={65} outerRadius={90} paddingAngle={3} dataKey="value" stroke="none">
                {sentimentData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip itemStyle={{ color: "#ffffff", fontSize: 12, fontWeight: 600 }} labelStyle={{ color: "#94a3b8", fontSize: 11 }} contentStyle={TOOLTIP_STYLE} />
              <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-2 text-center">Driver Balance (4 Pillars)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
              <PolarGrid stroke="rgba(255,255,255,0.1)" />
              <PolarAngleAxis dataKey="driver" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <PolarRadiusAxis angle={90} domain={[0, 5]} tick={{ fill: '#94a3b8', fontSize: 10 }} />
              <Tooltip itemStyle={{ color: "#ffffff", fontSize: 12, fontWeight: 600 }} labelStyle={{ color: "#94a3b8", fontSize: 11 }} contentStyle={TOOLTIP_STYLE} />
              <Radar name="Score" dataKey="score" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.5} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row 3: Survey Type Bar (with Cascaded Metric Selector) */}
      <div className="glass-card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">Score by Survey Type (Top 10 Volume)</h3>
            <p className="text-[11px] text-[var(--text-muted)]">Selected pillar: {typeMetric.replace('_score','').toUpperCase()}</p>
          </div>
          <div className="flex gap-1 bg-black/20 p-0.5 rounded-lg border border-[var(--glass-border)]">
            {metricButtons.map(m => (
              <button
                key={m.key}
                onClick={() => setTypeMetric(m.key)}
                className={`px-2 py-0.5 text-xs font-medium rounded ${typeMetric === m.key ? 'bg-[var(--accent-primary)]/30 text-[var(--accent-primary-light)]' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={bySurveyType}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="type" tick={{ fill: '#94a3b8', fontSize: 10 }} interval={0} angle={-15} textAnchor="end" height={50} />
            <YAxis yAxisId="left" domain={[0, 5]} tick={{ fill: '#94a3b8', fontSize: 11 }} />
            <YAxis yAxisId="right" orientation="right" tick={{ fill: '#94a3b8', fontSize: 11 }} />
            <Tooltip itemStyle={{ color: "#ffffff", fontSize: 12, fontWeight: 600 }} labelStyle={{ color: "#94a3b8", fontSize: 11 }} contentStyle={TOOLTIP_STYLE} />
            <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
            <Bar yAxisId="left" dataKey="score" name={`${typeMetric.replace('_score','').toUpperCase()} Score`} radius={[6, 6, 0, 0]}>
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
