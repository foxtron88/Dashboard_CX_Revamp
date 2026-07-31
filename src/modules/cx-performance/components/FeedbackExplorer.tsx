'use client';

import React, { useState, useMemo } from 'react';
import type { CSATRecord } from '@/modules/common/types';

interface Props { records: CSATRecord[]; }

const SENTIMENT_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Positive: { bg: 'rgba(16, 185, 129, 0.15)', text: '#10b981', border: 'rgba(16, 185, 129, 0.3)' },
  Neutral:  { bg: 'rgba(245, 158, 11, 0.15)', text: '#f59e0b', border: 'rgba(245, 158, 11, 0.3)' },
  Negative: { bg: 'rgba(239, 68, 68, 0.15)',   text: '#ef4444', border: 'rgba(239, 68, 68, 0.3)' },
};

const PAGE_SIZE = 20;

export default function FeedbackExplorer({ records }: Props) {
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);

  const feedbackRecords = useMemo(() => {
    return records.filter(r => r.feedback && r.feedback.trim().length > 0);
  }, [records]);

  const filtered = useMemo(() => {
    if (!searchTerm.trim()) return feedbackRecords;
    const term = searchTerm.toLowerCase();
    return feedbackRecords.filter(r =>
      r.feedback.toLowerCase().includes(term) ||
      r.facility_type.toLowerCase().includes(term) ||
      r.bu.toLowerCase().includes(term) ||
      r.location.toLowerCase().includes(term)
    );
  }, [feedbackRecords, searchTerm]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <section className="mt-10 animate-in">
      <div className="flex items-center gap-3 mb-6">
        <span className="text-2xl">💬</span>
        <div>
          <h2 className="text-xl font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>
            Feedback Explorer
          </h2>
          <p className="text-xs text-[var(--text-muted)]">{feedbackRecords.length.toLocaleString()} responses with feedback text</p>
        </div>
      </div>

      <div className="glass-card !p-0 overflow-hidden">
        {/* Search Bar */}
        <div className="p-4 border-b border-[var(--glass-border)] bg-[var(--bg-secondary)] flex items-center gap-3">
          <input
            type="text"
            value={searchTerm}
            onChange={e => { setSearchTerm(e.target.value); setPage(0); }}
            placeholder="Search feedback, facility, BU, location..."
            className="flex-1 text-sm rounded-lg px-4 py-2 bg-[var(--glass-bg)] border border-[var(--glass-border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--accent-primary)]/50"
          />
          <span className="text-xs text-[var(--text-muted)] whitespace-nowrap">
            {filtered.length.toLocaleString()} results
          </span>
        </div>

        {/* Table */}
        <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 bg-[var(--bg-secondary)] z-10">
              <tr className="border-b border-[var(--glass-border)]">
                <th className="p-3 text-xs font-medium text-[var(--text-muted)] uppercase w-[80px]">BU</th>
                <th className="p-3 text-xs font-medium text-[var(--text-muted)] uppercase w-[120px]">Facility</th>
                <th className="p-3 text-xs font-medium text-[var(--text-muted)] uppercase w-[100px]">Location</th>
                <th className="p-3 text-xs font-medium text-[var(--text-muted)] uppercase text-center w-[60px]">Score</th>
                <th className="p-3 text-xs font-medium text-[var(--text-muted)] uppercase w-[90px]">Sentiment</th>
                <th className="p-3 text-xs font-medium text-[var(--text-muted)] uppercase">Feedback</th>
                <th className="p-3 text-xs font-medium text-[var(--text-muted)] uppercase w-[90px]">Date</th>
              </tr>
            </thead>
            <tbody>
              {paged.map((r, idx) => {
                const sc = SENTIMENT_COLORS[r.sentiment] || SENTIMENT_COLORS.Neutral;
                return (
                  <tr key={`${r.respondent_id}-${idx}`}
                    className="border-b border-[var(--glass-border)] hover:bg-[var(--glass-bg)] transition-colors">
                    <td className="p-3 text-xs font-semibold text-[var(--text-primary)]">{r.bu}</td>
                    <td className="p-3 text-xs text-[var(--text-secondary)] truncate max-w-[120px]" title={r.facility_type}>{r.facility_type || '—'}</td>
                    <td className="p-3 text-xs text-[var(--text-secondary)] truncate max-w-[100px]">{r.location || '—'}</td>
                    <td className="p-3 text-center">
                      {r.overall_score !== null ? (
                        <span className="text-xs font-bold" style={{ color: r.overall_score >= 4 ? '#10b981' : r.overall_score >= 3 ? '#f59e0b' : '#ef4444' }}>
                          {r.overall_score}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="p-3">
                      {r.sentiment ? (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: sc.bg, color: sc.text, border: `1px solid ${sc.border}` }}>
                          {r.sentiment}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="p-3 text-xs text-[var(--text-primary)] max-w-[350px]">
                      <p className="line-clamp-2" title={r.feedback}>{r.feedback}</p>
                    </td>
                    <td className="p-3 text-[10px] text-[var(--text-muted)] whitespace-nowrap">{r.month || '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-3 border-t border-[var(--glass-border)] bg-[var(--bg-secondary)] flex items-center justify-between">
            <button
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
              className="text-xs px-3 py-1 rounded-lg border border-[var(--glass-border)] text-[var(--text-secondary)] disabled:opacity-30 hover:bg-[var(--glass-bg)]"
            >
              ← Previous
            </button>
            <span className="text-xs text-[var(--text-muted)]">
              Page {page + 1} of {totalPages}
            </span>
            <button
              onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
              disabled={page >= totalPages - 1}
              className="text-xs px-3 py-1 rounded-lg border border-[var(--glass-border)] text-[var(--text-secondary)] disabled:opacity-30 hover:bg-[var(--glass-bg)]"
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
