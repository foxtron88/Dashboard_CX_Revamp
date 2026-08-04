'use client';

import { useState, useEffect, useMemo } from 'react';
import type { CSATRecord } from '../types';

let cachedRecords: CSATRecord[] | null = null;

function parseScore(val: string): number | null {
  const n = parseFloat(val);
  return !isNaN(n) && n >= 1 && n <= 5 ? n : null;
}

function deriveSentiment(score: number | null): string {
  if (score === null) return '';
  if (score >= 4) return 'Positive';
  if (score === 3) return 'Neutral';
  if (score <= 2) return 'Negative';
  return '';
}

function deriveMonth(synced_at: string): string {
  if (!synced_at) return '';
  // supports DD-MM-YYYY HH:MM:SS and YYYY-MM-DD HH:MM:SS
  const m = synced_at.match(/(\d{2})-(\d{2})-(\d{4})/) || synced_at.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return '';
  if (synced_at.match(/^\d{4}/)) return `${m[1]}-${m[2]}`;
  return `${m[3]}-${m[2]}`;
}

export function useCSATData() {
  const [data, setData] = useState<CSATRecord[] | null>(cachedRecords);
  const [loading, setLoading] = useState(!cachedRecords);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (cachedRecords) return;
    fetch('/data/sensum_csat.csv')
      .then(res => {
        if (!res.ok) throw new Error('Failed to load sensum_csat.csv');
        return res.text();
      })
      .then(text => {
        const lines = text.split('\n').filter(Boolean);
        const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
        const records: CSATRecord[] = [];

        for (let i = 1; i < lines.length; i++) {
          // Handle CSV values that may contain commas within quotes
          const vals: string[] = [];
          let current = '';
          let inQuotes = false;
          for (let c = 0; c < lines[i].length; c++) {
            const ch = lines[i][c];
            if (ch === '"') { inQuotes = !inQuotes; continue; }
            if (ch === ',' && !inQuotes) { vals.push(current.trim()); current = ''; continue; }
            current += ch;
          }
          vals.push(current.trim());

          if (vals.length < headers.length - 2) continue;
          const obj: Record<string, string> = {};
          headers.forEach((h, idx) => { obj[h] = vals[idx] ?? ''; });

          const overallScore = parseScore(obj.overall_score);
          records.push({
            respondent_id: obj.respondent_id,
            synced_at:     obj.synced_at,
            bu:            obj.bu,
            survey_type:   obj.survey_type,
            subholding:    obj.subholding,
            location:      obj.location,
            region:        obj.region || '',
            facility_type: obj.facility_type,
            facility_id:   obj.facility_id,
            overall_score: overallScore,
            overall_group: obj.overall_group,
            people_score:  parseScore(obj.people_score),
            process_score: parseScore(obj.process_score),
            premises_score:parseScore(obj.premises_score),
            nps_score:     parseScore(obj.nps_score),
            feedback:      obj.feedback,
            tags:          obj.tags,
            sentiment:     deriveSentiment(overallScore),
            channel:       obj.channel,
            language:      obj.language,
            month:         deriveMonth(obj.synced_at),
          });
        }

        cachedRecords = records;
        setData(records);
      })
      .catch(err => setError(err.message))
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
    return records.filter(r => {
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
    fetch('/data/cx_performance.json?v=' + Date.now())
      .then(res => res.json())
      .then(json => setData(json))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return { data, loading, error };
}
