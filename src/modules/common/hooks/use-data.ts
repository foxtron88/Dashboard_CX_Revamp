'use client';

import { useState, useEffect } from 'react';
import type { ConsolidatedData, CSATRecord } from '../types';

let cachedData: ConsolidatedData | null = null;

export function useCSATData() {
  const [data, setData] = useState<ConsolidatedData | null>(cachedData);
  const [loading, setLoading] = useState(!cachedData);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (cachedData) return;
    
    fetch('/data/consolidated.json')
      .then(res => res.json())
      .then((json: ConsolidatedData) => {
        json.records.forEach((r, i) => (r._id = i));
        cachedData = json;
        setData(json);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return { data, loading, error };
}

export function useFilteredCSAT(
  records: CSATRecord[],
  filters: {
    businessUnit: string;
    location: string;
    facilityType: string;
    sentiment: string;
    startDate: string;
    endDate: string;
  }
) {
  const filtered = records.filter(r => {
    if (filters.businessUnit !== 'all' && r.source !== filters.businessUnit) return false;
    if (filters.location !== 'all' && r.location !== filters.location) return false;
    if (filters.facilityType !== 'all' && r.facility_type !== filters.facilityType) return false;
    if (filters.sentiment !== 'all' && r.sentiment !== filters.sentiment) return false;
    if (filters.startDate && r.response_date < filters.startDate) return false;
    if (filters.endDate && r.response_date > filters.endDate) return false;
    return true;
  });

  return filtered;
}

export function useCXPerformanceData() {
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/data/cx_performance.json?v=' + Date.now())
      .then(res => res.json())
      .then(json => setData(json))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return { data, loading, error };
}
