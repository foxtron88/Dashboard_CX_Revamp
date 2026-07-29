'use client';

import React, { useMemo, useState } from 'react';
import type { CSATRecord } from '@/modules/common/types';

interface Props {
  records: CSATRecord[];
}

const PAGE_SIZE = 20;

function sentimentBadge(s: string) {
  const colors: Record<string, string> = {
    Positive: 'bg-emerald-500/20 text-emerald-400',
    Neutral: 'bg-indigo-500/20 text-indigo-400',
    Negative: 'bg-red-500/20 text-red-400',
  };
  return colors[s] || 'bg-gray-500/20 text-gray-400';
}

export default function FeedbackExplorer({ records }: Props) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [sortCol, setSortCol] = useState<keyof CSATRecord>('response_date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const filtered = useMemo(() => {
    let result = records;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(r =>
        (r.feedback || '').toLowerCase().includes(q) ||
        (r.source || '').toLowerCase().includes(q) ||
        (r.location || '').toLowerCase().includes(q) ||
        (r.facility_type || '').toLowerCase().includes(q)
      );
    }
    result.sort((a, b) => {
      const av = a[sortCol] ?? '';
      const bv = b[sortCol] ?? '';
      const cmp = av < bv ? -1 : av > bv ? 1 : 0;
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return result;
  }, [records, search, sortCol, sortDir]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageData = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function toggleSort(col: keyof CSATRecord) {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('desc'); }
    setPage(1);
  }

  const thClass = 'p-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider cursor-pointer hover:text-[var(--text-primary)] select-none transition-colors';
  const sortIndicator = (col: keyof CSATRecord) => sortCol === col ? (sortDir === 'asc' ? ' ↑' : ' ↓') : '';

  return (
    <section className="mt-10 animate-in">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <span className="text-2xl">💬</span>
          <div>
            <h2 className="text-xl font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>
              Feedback Explorer
            </h2>
            <p className="text-sm text-[var(--text-muted)]">{filtered.length.toLocaleString()} results</p>
          </div>
        </div>
        <input
          type="search"
          placeholder="Search feedback…"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          className="bg-[var(--bg-tertiary)] border border-[var(--glass-border)] rounded-lg px-4 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent-primary)] w-64 transition-all"
        />
      </div>

      <div className="glass-card !p-0 overflow-hidden">
        <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
          <table className="w-full">
            <thead className="sticky top-0 bg-[var(--bg-secondary)]">
              <tr>
                <th className={thClass} onClick={() => toggleSort('response_date')}>Date{sortIndicator('response_date')}</th>
                <th className={thClass} onClick={() => toggleSort('source')}>Unit{sortIndicator('source')}</th>
                <th className={thClass} onClick={() => toggleSort('location')}>Location{sortIndicator('location')}</th>
                <th className={thClass} onClick={() => toggleSort('facility_type')}>Facility{sortIndicator('facility_type')}</th>
                <th className={thClass} onClick={() => toggleSort('overall_score')}>Score{sortIndicator('overall_score')}</th>
                <th className={thClass} onClick={() => toggleSort('sentiment')}>Sentiment{sortIndicator('sentiment')}</th>
                <th className="p-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">Feedback</th>
              </tr>
            </thead>
            <tbody>
              {pageData.map((r, i) => (
                <tr key={r._id ?? i} className="border-t border-[var(--glass-border)] hover:bg-[var(--glass-bg)] transition-colors">
                  <td className="p-3 text-xs text-[var(--text-secondary)] whitespace-nowrap">{r.response_date}</td>
                  <td className="p-3 text-xs text-[var(--text-primary)] font-medium">{r.source}</td>
                  <td className="p-3 text-xs text-[var(--text-secondary)]">{r.location}</td>
                  <td className="p-3 text-xs text-[var(--text-secondary)] max-w-[150px] truncate">{r.facility_type}</td>
                  <td className="p-3 text-xs text-[var(--text-primary)] font-bold">{r.overall_score}</td>
                  <td className="p-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${sentimentBadge(r.sentiment)}`}>
                      {r.sentiment}
                    </span>
                  </td>
                  <td className="p-3 text-xs text-[var(--text-secondary)] max-w-[300px] truncate">{r.feedback}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 rounded-lg text-xs bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--glass-bg)] disabled:opacity-30 transition-all cursor-pointer"
          >
            ← Prev
          </button>
          <span className="text-xs text-[var(--text-muted)]">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1.5 rounded-lg text-xs bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--glass-bg)] disabled:opacity-30 transition-all cursor-pointer"
          >
            Next →
          </button>
        </div>
      )}
    </section>
  );
}
