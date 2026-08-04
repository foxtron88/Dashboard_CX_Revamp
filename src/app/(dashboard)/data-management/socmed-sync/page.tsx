'use client';

import React, { useState, useEffect } from 'react';
import { Database, RefreshCw, CheckCircle2, XCircle, Clock } from 'lucide-react';

interface SyncStatus {
  last_pull: string | null;
  status: 'success' | 'failed' | null;
  error: string | null;
}

export default function SocmedSyncPage() {
  const [status, setStatus] = useState<SyncStatus>({ last_pull: null, status: null, error: null });
  const [loading, setLoading] = useState(false);
  const [fetchingStatus, setFetchingStatus] = useState(true);

  const loadStatus = async () => {
    try {
      const res = await fetch('/data/socmed_sync_status.json?t=' + Date.now());
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      }
    } catch (e) {
      console.error('Failed to load status', e);
    } finally {
      setFetchingStatus(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const handleSync = async () => {
    setLoading(true);
    setStatus(prev => ({ ...prev, error: null }));
    
    try {
      const res = await fetch('/api/v1/sync/socmed', { method: 'POST' });
      const data = await res.json();
      
      if (data.success) {
        setStatus({
          last_pull: data.timestamp,
          status: 'success',
          error: null
        });
      } else {
        setStatus(prev => ({
          ...prev,
          status: 'failed',
          error: data.error || 'Unknown error occurred'
        }));
      }
    } catch (e: any) {
      setStatus(prev => ({
        ...prev,
        status: 'failed',
        error: e.message || 'Network error'
      }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto mt-10 animate-in">
      <div className="glass-card p-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center text-white shadow-lg">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>
              Social Media Data Sync
            </h1>
            <p className="text-sm text-[var(--text-muted)]">
              Pull the latest social media metrics directly from the MariaDB production database.
            </p>
          </div>
        </div>

        <div className="bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-xl p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            
            <div className="space-y-4">
              <div>
                <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1">
                  Last Data Pull
                </p>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[var(--text-secondary)]" />
                  <span className="text-lg font-bold text-[var(--text-primary)]">
                    {fetchingStatus 
                      ? 'Loading...' 
                      : status.last_pull 
                        ? new Date(status.last_pull).toLocaleString() 
                        : 'Never'}
                  </span>
                </div>
              </div>

              <div>
                <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1">
                  Status
                </p>
                <div className="flex items-center gap-2">
                  {fetchingStatus ? (
                    <span className="text-[var(--text-muted)]">Checking...</span>
                  ) : status.status === 'success' ? (
                    <span className="flex items-center gap-1.5 text-emerald-500 font-bold bg-emerald-500/10 px-3 py-1 rounded-full text-sm">
                      <CheckCircle2 className="w-4 h-4" /> Success
                    </span>
                  ) : status.status === 'failed' ? (
                    <span className="flex items-center gap-1.5 text-red-500 font-bold bg-red-500/10 px-3 py-1 rounded-full text-sm">
                      <XCircle className="w-4 h-4" /> Failed
                    </span>
                  ) : (
                    <span className="text-[var(--text-muted)]">No data</span>
                  )}
                </div>
                {status.status === 'failed' && status.error && (
                  <p className="text-xs text-red-400 mt-2 bg-red-500/5 p-2 rounded border border-red-500/20">
                    {status.error}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-col items-end gap-3">
              <button
                onClick={handleSync}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white transition-all shadow-lg bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                {loading ? 'Syncing with DB...' : 'Sync Now'}
              </button>
              <p className="text-[10px] text-[var(--text-muted)] text-right max-w-xs">
                This will overwrite the local JSON file used by the dashboard with fresh data from the MariaDB database.
              </p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
