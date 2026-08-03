'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useCXPerformanceData } from '@/modules/common/hooks/use-data';
import PerformanceKPIView from '@/modules/performance-kpi/components/PerformanceKPIView';

function monthYMToIdx(ym: string | undefined, months: string[], fallback: string): string {
  if (!ym || !months.length) return fallback;
  const [year, month] = ym.split('-').map(Number);
  const shortYear = String(year).slice(-2);
  const shortMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const label = `${shortMonths[month - 1]} ${shortYear}`;
  const idx = months.indexOf(label);
  return idx >= 0 ? String(idx) : fallback;
}

function PerformanceKPIContent() {
  const searchParams = useSearchParams();
  const { data, loading, error } = useCXPerformanceData();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[var(--accent-secondary)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[var(--text-muted)]">Loading Performance KPI Data…</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="glass-card text-center py-12">
        <p className="text-[var(--accent-danger)] text-lg font-semibold">Error loading data</p>
        <p className="text-[var(--text-muted)] mt-2">{error || 'No data available'}</p>
      </div>
    );
  }

  const months = (data._months as string[]) || [];
  const fromParam = searchParams.get('from') || undefined;
  const toParam = searchParams.get('to') || undefined;
  const initialFrom = monthYMToIdx(fromParam, months, 'ALL');
  const initialTo = monthYMToIdx(toParam, months, 'ALL');

  return <PerformanceKPIView data={data} months={months} initialFrom={initialFrom} initialTo={initialTo} />;
}

export default function PerformanceKPIPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[var(--accent-secondary)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[var(--text-muted)]">Loading Performance KPI Data…</p>
        </div>
      </div>
    }>
      <PerformanceKPIContent />
    </Suspense>
  );
}
