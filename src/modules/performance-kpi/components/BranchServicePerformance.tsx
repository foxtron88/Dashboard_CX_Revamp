'use client';

import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from 'recharts';

/* eslint-disable @typescript-eslint/no-explicit-any */

interface Props {
  data: Record<string, any>;
  selectedBU: string;
  fromIdx: number;
  toIdx: number;
}

const BU_LIST = ['API', 'HIN', 'IAS', 'IDM - TMII', 'IDM - TWC', 'ITDC', 'Sarinah'];

export default function BranchServicePerformance({ data, selectedBU, fromIdx, toIdx }: Props) {
  const serviceData = useMemo(() => {
    const bus = selectedBU === 'ALL' ? BU_LIST : [selectedBU];
    
    return bus.map(bu => {
      let overallSum = 0; let overallCount = 0;
      let peopleSum = 0; let peopleCount = 0;
      let processSum = 0; let processCount = 0;
      let premisesSum = 0; let premisesCount = 0;
      
      const bs = data[bu]?.performance?.branch_service || {};
      
      for (let i = fromIdx; i <= toIdx; i++) {
        if (typeof bs.overall?.[i] === 'number') { overallSum += bs.overall[i]; overallCount++; }
        if (typeof bs.people?.[i] === 'number') { peopleSum += bs.people[i]; peopleCount++; }
        if (typeof bs.process?.[i] === 'number') { processSum += bs.process[i]; processCount++; }
        if (typeof bs.premises?.[i] === 'number') { premisesSum += bs.premises[i]; premisesCount++; }
      }

      return {
        bu: bu.length > 10 ? bu.substring(0, 10) + '…' : bu,
        overall: overallCount ? Number((overallSum / overallCount).toFixed(2)) : 0,
        people: peopleCount ? Number((peopleSum / peopleCount).toFixed(2)) : 0,
        process: processCount ? Number((processSum / processCount).toFixed(2)) : 0,
        premises: premisesCount ? Number((premisesSum / premisesCount).toFixed(2)) : 0,
      };
    }).sort((a, b) => b.overall - a.overall);
  }, [data, selectedBU, fromIdx, toIdx]);

  return (
    <section className="mt-10 animate-in">
      <div className="flex items-center gap-3 mb-6">
        <span className="text-2xl">🏢</span>
        <h2 className="text-xl font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>
          Branch Service Performance
        </h2>
      </div>

      <div className="glass-card">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Overall Service Standards by BU</h3>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={serviceData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="bu" tick={{ fill: '#94a3b8', fontSize: 11 }} />
            <YAxis domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 11 }} />
            <Tooltip contentStyle={{ background: '#1a2235', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#f1f5f9' }} />
            <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
            <Bar dataKey="overall" name="Overall (%)" fill="#06b6d4" radius={[4, 4, 0, 0]} />
            <Bar dataKey="people" name="People (%)" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            <Bar dataKey="process" name="Process (%)" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            <Bar dataKey="premises" name="Premises (%)" fill="#10b981" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
