import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';

/**
 * GET /api/v1/csat
 *
 * Server-side CSAT data endpoint.
 * Reads the CSV once on the server, parses it, and returns pre-built JSON.
 *
 * Benefits vs. client-side CSV parsing:
 *  - 2.5 MB CSV never hits the browser — only compact JSON is sent
 *  - Vercel Edge / CDN caches the response for s-maxage=300 (5 min)
 *  - 1,000 concurrent users share a single cached response
 *  - Zero CSV parsing cost in the browser
 *
 * Cache-Control set in next.config.mjs: public, s-maxage=300, stale-while-revalidate=60
 */

// Module-level in-memory cache (lives as long as the serverless function is warm)
let cachedJSON: string | null = null;
let cacheBuiltAt = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

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

export async function GET() {
  try {
    const now = Date.now();

    // Serve from in-memory cache if still fresh
    if (cachedJSON && now - cacheBuiltAt < CACHE_TTL_MS) {
      return new NextResponse(cachedJSON, {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Read and parse CSV on the server
    const csvPath = path.join(process.cwd(), 'public', 'data', 'sensum_csat.csv');
    const text = await readFile(csvPath, 'utf-8');
    const records = parseCSV(text);

    cachedJSON = JSON.stringify(records);
    cacheBuiltAt = now;

    return new NextResponse(cachedJSON, {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[/api/v1/csat] Error:', error);
    return NextResponse.json({ error: 'Failed to load CSAT data' }, { status: 500 });
  }
}
