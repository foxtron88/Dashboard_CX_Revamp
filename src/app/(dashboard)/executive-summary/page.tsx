'use client';

import React, { Suspense } from 'react';
import { useCSATData } from '@/modules/common/hooks/use-data';
import { useCXPerformanceData } from '@/modules/common/hooks/use-data';
import { useSocmedData } from '@/modules/common/hooks/use-socmed-data';
import ExecutiveSummaryView from '@/modules/executive-summary/components/ExecutiveSummaryView';

function LoadingSpinner({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-[var(--accent-primary)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-[var(--text-muted)]">{label}</p>
      </div>
    </div>
  );
}

function ExecutiveSummaryContent() {
  const { data: csatRecords, loading: csatLoading } = useCSATData();
  const { data: perfData, loading: perfLoading } = useCXPerformanceData();
  const { data: socmedData, loading: socmedLoading } = useSocmedData();

  if (csatLoading || perfLoading || socmedLoading) {
    return <LoadingSpinner label="Loading Executive Summary…" />;
  }

  return (
    <ExecutiveSummaryView
      csatRecords={csatRecords}
      perfData={perfData as Record<string, unknown> | null}
      socmedData={socmedData}
    />
  );
}

export default function ExecutiveSummaryPage() {
  return (
    <Suspense fallback={<LoadingSpinner label="Initializing…" />}>
      <ExecutiveSummaryContent />
    </Suspense>
  );
}
