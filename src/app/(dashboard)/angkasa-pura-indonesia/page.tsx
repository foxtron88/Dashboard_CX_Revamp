import React from 'react';
import { Construction } from 'lucide-react';

export default function AngkasaPuraIndonesiaPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] animate-in fade-in zoom-in duration-500">
      <div className="w-20 h-20 bg-[var(--bg-tertiary)] rounded-full flex items-center justify-center mb-6 shadow-xl border border-[var(--glass-border)]">
        <Construction className="w-10 h-10 text-[var(--accent-primary)]" />
      </div>
      <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-3 tracking-tight text-center" style={{ fontFamily: 'var(--font-display)' }}>
        Angkasa Pura Indonesia
      </h1>
      <p className="text-[var(--text-muted)] text-center max-w-md">
        This module is currently under construction. Stay tuned for upcoming analytics and reporting dashboards for Angkasa Pura Indonesia.
      </p>
      <div className="mt-8 px-6 py-2 bg-[var(--accent-primary)]/10 text-[var(--accent-primary-light)] border border-[var(--accent-primary)]/20 rounded-full text-sm font-semibold uppercase tracking-widest shadow-sm">
        Coming Soon
      </div>
    </div>
  );
}
