'use client';

import { useState, useEffect, useMemo } from 'react';

export interface SensumRecord {
  respondent_id: string;
  synced_at: string;
  bu: string;
  survey_type: string;
  subholding: string;
  location: string;
  region: string;
  facility_type: string;
  facility_id: string;
  overall_score: number | null;
  overall_group: string;
  people_score: number | null;
  process_score: number | null;
  premises_score: number | null;
  nps_score: number | null;
  feedback: string;
  tags: string;
  sentiment: string;
  channel: string;
  language: string;
  month: string; // derived: YYYY-MM
}

let cache: SensumRecord[] | null = null;

function parseScore(val: string): number | null {
  const n = parseFloat(val);
  return !isNaN(n) && n >= 1 && n <= 5 ? n : null;
}

function deriveMonth(synced_at: string): string {
  if (!synced_at) return '';
  // supports DD-MM-YYYY HH:MM:SS and YYYY-MM-DDTHH:...
  const m = synced_at.match(/(\d{2})-(\d{2})-(\d{4})/) || synced_at.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return '';
  if (synced_at.match(/^\d{4}/)) return `${m[1]}-${m[2]}`;
  return `${m[3]}-${m[2]}`;
}

export function useSensumData() {
  const [data, setData] = useState<SensumRecord[] | null>(cache);
  const [loading, setLoading] = useState(!cache);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (cache) return;
    fetch('/data/sensum_csat.csv')
      .then(res => {
        if (!res.ok) throw new Error('Failed to load sensum_csat.csv');
        return res.text();
      })
      .then(text => {
        const lines = text.split('\n').filter(Boolean);
        const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
        const records: SensumRecord[] = [];

        for (let i = 1; i < lines.length; i++) {
          const vals = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
          if (vals.length < headers.length - 2) continue;
          const obj: Record<string, string> = {};
          headers.forEach((h, idx) => { obj[h] = vals[idx] ?? ''; });

          records.push({
            respondent_id: obj.respondent_id,
            synced_at:     obj.synced_at,
            bu:            obj.bu,
            survey_type:   obj.survey_type,
            subholding:    obj.subholding,
            location:      obj.location,
            region:        obj.region,
            facility_type: obj.facility_type,
            facility_id:   obj.facility_id,
            overall_score: parseScore(obj.overall_score),
            overall_group: obj.overall_group,
            people_score:  parseScore(obj.people_score),
            process_score: parseScore(obj.process_score),
            premises_score:parseScore(obj.premises_score),
            nps_score:     parseScore(obj.nps_score),
            feedback:      obj.feedback,
            tags:          obj.tags,
            sentiment:     obj.sentiment,
            channel:       obj.channel,
            language:      obj.language,
            month:         deriveMonth(obj.synced_at),
          });
        }

        cache = records;
        setData(records);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return { data, loading, error };
}

export function useSensumFiltered(
  data: SensumRecord[] | null,
  bu: string,
  surveyType: string,
  sentiment: string,
  fromMonth: string,
  toMonth: string
) {
  return useMemo(() => {
    if (!data) return [];
    return data.filter(r => {
      if (bu !== 'ALL' && r.bu !== bu) return false;
      if (surveyType !== 'ALL' && r.survey_type !== surveyType) return false;
      if (sentiment !== 'ALL' && r.sentiment !== sentiment) return false;
      if (fromMonth && r.month && r.month < fromMonth) return false;
      if (toMonth && r.month && r.month > toMonth) return false;
      return true;
    });
  }, [data, bu, surveyType, sentiment, fromMonth, toMonth]);
}
