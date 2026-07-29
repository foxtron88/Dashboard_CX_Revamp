'use client';

import React from 'react';
import { useCXPerformanceData } from '@/modules/common/hooks/use-data';
import OperationsView from '@/modules/operations/components/OperationsView';

export default function OperationsPage() {
  const { data, loading, error } = useCXPerformanceData();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[var(--accent-secondary)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[var(--text-muted)]">Loading Operations Data…</p>
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

  return <OperationsView data={data} months={months} />;
}
