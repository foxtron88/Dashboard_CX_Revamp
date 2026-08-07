'use client';

import { useState, useEffect, useMemo } from 'react';
import type { CSATRecord } from '../types';

// ─── Module-level browser memory cache ───────────────────────────────────────
// Shared across all component instances in the same browser tab session.
// On first mount: fetches /api/v1/csat (which returns pre-parsed JSON from server).
// On subsequent mounts: returns the in-memory copy instantly (0ms).
let cachedRecords: CSATRecord[] | null = null;

export function useCSATData() {
  const [data, setData] = useState<CSATRecord[] | null>(cachedRecords);
  const [loading, setLoading] = useState(!cachedRecords);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (cachedRecords) return; // Already cached in this browser session

    // Fetch pre-parsed JSON from server-side API route.
    // The server parses the CSV once; the Vercel Edge/CDN caches the result.
    // No 2.5 MB CSV download in the browser anymore.
    fetch('/api/v1/csat')
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load CSAT data (HTTP ${res.status})`);
        return res.json() as Promise<CSATRecord[]>;
      })
      .then((records) => {
        cachedRecords = records;
        setData(records);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return { data, loading, error };
}

export function useFilteredCSAT(
  records: CSATRecord[] | null,
  bu: string,
  surveyType: string,
  sentiment: string,
  fromMonth: string,
  toMonth: string,
  location: string = 'ALL'
) {
  return useMemo(() => {
    if (!records) return [];
    return records.filter((r) => {
      if (bu !== 'ALL' && r.bu !== bu) return false;
      if (surveyType !== 'ALL' && r.survey_type !== surveyType) return false;
      if (sentiment !== 'ALL' && r.sentiment !== sentiment) return false;
      if (location !== 'ALL' && r.location !== location) return false;
      if (fromMonth && r.month && r.month < fromMonth) return false;
      if (toMonth && r.month && r.month > toMonth) return false;
      return true;
    });
  }, [records, bu, surveyType, sentiment, fromMonth, toMonth, location]);
}

export function useCXPerformanceData() {
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fixed: removed ?v=Date.now() which was bypassing browser cache on every load.
    // Cache-Control headers in next.config.mjs now handle revalidation properly.
    fetch('/data/cx_performance.json')
      .then((res) => res.json())
      .then((json) => setData(json))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return { data, loading, error };
}
