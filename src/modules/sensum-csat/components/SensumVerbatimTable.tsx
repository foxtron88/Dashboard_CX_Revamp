'use client';

import React, { useMemo, useState } from 'react';
import type { SensumRecord } from '../hooks/use-sensum-data';

interface Props { records: SensumRecord[]; }

const BADGE: Record<string, string> = {
  Positive: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  Neutral:  'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
  Negative: 'bg-red-500/20 text-red-400 border-red-500/30',
};

const STARS = (n: number | null) => {
  if (!n) return '—';
  return '★'.repeat(Math.round(n)) + '☆'.repeat(5 - Math.round(n));
};

export default function SensumVerbatimTable({ records }: Props) {
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');

  const withFeedback = useMemo(() =>
    records.filter(r => r.feedback && r.feedback.trim().length > 3)
      .filter(r => search === '' || r.feedback.toLowerCase().includes(search.toLowerCase()) || r.tags.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => {
        // Negative first, then by score ascending
        if (a.sentiment === 'Negative' && b.sentiment !== 'Negative') return -1;
        if (b.sentiment === 'Negative' && a.sentiment !== 'Negative') return 1;
        return (a.overall_score ?? 5) - (b.overall_score ?? 5);
      }),
    [records, search]);

  const PAGE_SIZE = 20;
  const totalPages = Math.ceil(withFeedback.length / PAGE_SIZE);
  const paginated = withFeedback.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <section className="mt-8 animate-in">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <span className="text-2xl">💬</span>
          <h2 className="text-xl font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>
            Verbatim Feedback Explorer
          </h2>
        </div>
        <span className="text-xs text-[var(--text-muted)]">{withFeedback.length.toLocaleString()} responses with feedback</span>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(0); }}
          placeholder="Search feedback or tags..."
          className="w-full max-w-md px-4 py-2 rounded-lg text-sm"
          style={{
            background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
            color: 'var(--text-primary)', outline: 'none'
          }}
        />
      </div>

      <div className="glass-card !p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--glass-border)] bg-[var(--bg-secondary)]">
                <th className="p-3 text-xs font-medium text-[var(--text-muted)] uppercase w-20">Score</th>
                <th className="p-3 text-xs font-medium text-[var(--text-muted)] uppercase">Facility</th>
                <th className="p-3 text-xs font-medium text-[var(--text-muted)] uppercase">Feedback</th>
                <th className="p-3 text-xs font-medium text-[var(--text-muted)] uppercase">Tag</th>
                <th className="p-3 text-xs font-medium text-[var(--text-muted)] uppercase w-24">Sentiment</th>
                <th className="p-3 text-xs font-medium text-[var(--text-muted)] uppercase w-20">Lang</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map(r => (
                <tr key={r.respondent_id} className="border-b border-[var(--glass-border)] hover:bg-[var(--glass-bg)] transition-colors">
                  <td className="p-3">
                    <p className="font-bold" style={{ color: r.overall_score && r.overall_score >= 4 ? '#10b981' : r.overall_score && r.overall_score <= 2 ? '#ef4444' : '#f59e0b' }}>
                      {r.overall_score ?? '—'}
                    </p>
                    <p className="text-[10px] text-amber-400">{STARS(r.overall_score)}</p>
                  </td>
                  <td className="p-3 max-w-[160px]">
                    <p className="font-medium text-[var(--text-primary)] truncate text-xs" title={r.facility_type}>{r.facility_type || '—'}</p>
                    <p className="text-[10px] text-[var(--text-muted)]">{r.bu} · {r.location}</p>
                  </td>
                  <td className="p-3 max-w-[360px] text-[var(--text-secondary)] text-xs">
                    {r.feedback.length > 180 ? r.feedback.slice(0, 180) + '…' : r.feedback}
                  </td>
                  <td className="p-3 max-w-[140px] text-xs text-[var(--text-muted)] truncate" title={r.tags}>{r.tags || '—'}</td>
                  <td className="p-3">
                    {r.sentiment ? (
                      <span className={`px-2 py-1 rounded-full text-[10px] font-medium border ${BADGE[r.sentiment] ?? ''}`}>
                        {r.sentiment}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="p-3 text-xs text-[var(--text-muted)]">{r.language}</td>
                </tr>
              ))}
              {paginated.length === 0 && (
                <tr><td colSpan={6} className="p-8 text-center text-[var(--text-muted)]">No matching feedback found.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-[var(--glass-border)] flex items-center justify-between">
          <span className="text-xs text-[var(--text-muted)]">
            Page {page + 1} of {totalPages} · {withFeedback.length.toLocaleString()} responses
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-3 py-1 rounded text-xs font-medium disabled:opacity-30"
              style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)' }}
            >← Prev</button>
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="px-3 py-1 rounded text-xs font-medium disabled:opacity-30"
              style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)' }}
            >Next →</button>
          </div>
        </div>
      </div>
    </section>
  );
}
