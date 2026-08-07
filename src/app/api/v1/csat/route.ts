import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';
import { unstable_cache } from 'next/cache';

/**
 * GET /api/v1/csat
 *
 * Server-side CSAT data endpoint optimized for Vercel deployment.
 *
 * Architecture for near-real-time data on Vercel:
 * ┌─────────────────────────────────────────────────────────────────┐
 * │  User Request → Vercel Edge Cache → This Function → CSV File   │
 * │                                                                 │
 * │  Cache-Control: s-maxage=60 → Edge serves cached for 60s       │
 * │  stale-while-revalidate=300 → Serve stale while revalidating   │
 * │  revalidateTag('csat-data') → Instant purge on sync            │
 * └─────────────────────────────────────────────────────────────────┘
 *
 * On explicit data sync (POST /api/v1/sync):
 *   → revalidateTag('csat-data') is called
 *   → Vercel Edge purges the cached response immediately
 *   → Next request re-reads the CSV with fresh data
 *
 * Without sync (automatic TTL):
 *   → Edge cache serves stale within 60s of any change
 *   → Background revalidation happens automatically via SWR headers
 */

function parseScore(val: string): number | null {
  const n = parseFloat(val);
  return !isNaN(n) && n >= 1 && n <= 5 ? n : null;
}

function deriveMonth(synced_at: string): string {
  if (!synced_at) return '';
  const m = synced_at.match(/(\d{2})-(\d{2})-(\d{4})/) || synced_at.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return '';
  if (synced_at.match(/^\d{4}/)) return `${m[1]}-${m[2]}`;
  return `${m[3]}-${m[2]}`;
}

function parseCSV(text: string) {
  const lines = text.split('\n').filter(Boolean);
  const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
  const records = [];

  for (let i = 1; i < lines.length; i++) {
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
    const sentimentFromScore = (s: number | null) => {
      if (s === null) return '';
      if (s >= 4) return 'Positive';
      if (s === 3) return 'Neutral';
      if (s <= 2) return 'Negative';
      return '';
    };

    records.push({
      respondent_id: obj.respondent_id,
      synced_at: obj.synced_at,
      bu: obj.bu,
      survey_type: obj.survey_type,
      subholding: obj.subholding,
      location: obj.location,
      region: obj.region || '',
      facility_type: obj.facility_type,
      facility_id: obj.facility_id,
      overall_score: overallScore,
      overall_group: obj.overall_group,
      people_score: parseScore(obj.people_score),
      process_score: parseScore(obj.process_score),
      premises_score: parseScore(obj.premises_score),
      nps_score: parseScore(obj.nps_score),
      feedback: obj.feedback,
      tags: obj.tags,
      sentiment: sentimentFromScore(overallScore),
      channel: obj.channel,
      language: obj.language,
      month: deriveMonth(obj.synced_at),
    });
  }

  return records;
}

/**
 * unstable_cache wraps the CSV read+parse.
 * Tagged with 'csat-data' so revalidateTag('csat-data') instantly purges it
 * from Vercel's cache when a sync is triggered.
 * revalidate: 60 → also auto-refreshes every 60 seconds as a safety net.
 */
const getCSATRecords = unstable_cache(
  async () => {
    const csvPath = path.join(process.cwd(), 'public', 'data', 'sensum_csat.csv');
    const text = await readFile(csvPath, 'utf-8');
    return parseCSV(text);
  },
  ['csat-records'],
  {
    tags: ['csat-data'],
    revalidate: 60, // seconds — auto-refresh safety net
  }
);

export async function GET() {
  try {
    const records = await getCSATRecords();
    return NextResponse.json(records);
  } catch (error) {
    console.error('[/api/v1/csat] Error:', error);
    return NextResponse.json({ error: 'Failed to load CSAT data' }, { status: 500 });
  }
}
