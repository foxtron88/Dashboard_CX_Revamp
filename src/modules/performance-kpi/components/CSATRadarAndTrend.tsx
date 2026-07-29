'use client';

import React, { useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend
} from 'recharts';

/* eslint-disable @typescript-eslint/no-explicit-any */

interface Props {
  data: Record<string, any>;
  months: string[];
  selectedBU: string;
  fromIdx: number;
  toIdx: number;
}

const BU_LIST = ['API', 'HIN', 'IAS', 'IDM - TMII', 'IDM - TWC', 'ITDC', 'Sarinah'];

export default function CSATRadarAndTrend({ data, months, selectedBU, fromIdx, toIdx }: Props) {
  const trendData = useMemo(() => {
    const bus = selectedBU === 'ALL' ? BU_LIST : [selectedBU];
    return months.slice(fromIdx, toIdx + 1).map((m, idx) => {
      const mIdx = fromIdx + idx;
      let sum = 0;
      let count = 0;
      bus.forEach(bu => {
        const val = data[bu]?.performance?.csat?.overall?.[mIdx];
        if (typeof val === 'number') {
          sum += val;
          count++;
        }
      });
      return { month: m, score: count ? Number((sum / count).toFixed(2)) : null };
    });
  }, [data, months, selectedBU, fromIdx, toIdx]);

  const radarData = useMemo(() => {
    const bus = selectedBU === 'ALL' ? BU_LIST : [selectedBU];
    const metrics = ['people', 'process', 'premises'];
    
    return metrics.map(metric => {
      let sum = 0;
      let count = 0;
      bus.forEach(bu => {
        const arr = data[bu]?.performance?.csat?.[metric] || [];
        for (let i = fromIdx; i <= toIdx && i < arr.length; i++) {
          if (typeof arr[i] === 'number') {
            sum += arr[i];
            count++;
          }
        }
      });
      return {
        subject: metric.charAt(0).toUpperCase() + metric.slice(1),
        score: count ? Number((sum / count).toFixed(2)) : 0,
        fullMark: 5
      };
    });
  }, [data, selectedBU, fromIdx, toIdx]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-6 animate-in">
      {/* Trend */}
      <div className="glass-card lg:col-span-2">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">CSAT Overall Trend</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 10 }} />
            <YAxis domain={[3.5, 5]} tick={{ fill: '#94a3b8', fontSize: 11 }} />
            <Tooltip contentStyle={{ background: '#1a2235', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#f1f5f9' }} />
            <Line type="monotone" dataKey="score" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} name="CSAT Score" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Radar */}
      <div className="glass-card flex flex-col items-center">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-2 w-full text-left">CSAT Drivers Balance</h3>
        <ResponsiveContainer width="100%" height={300}>
          <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
            <PolarGrid stroke="rgba(255,255,255,0.1)" />
            <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 12 }} />
            <PolarRadiusAxis angle={30} domain={[0, 5]} tick={{ fill: '#94a3b8', fontSize: 10 }} />
            <Tooltip contentStyle={{ background: '#1a2235', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#f1f5f9' }} />
            <Radar name="Score" dataKey="score" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.5} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
