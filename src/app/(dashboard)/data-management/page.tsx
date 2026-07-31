'use client';

import React from 'react';
import DriverClassificationManager from '@/modules/sensum-csat/components/DriverClassificationManager';

export default function DataManagementPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold shadow-lg">
            ⚙️
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>
              Data Management & Classification Controls
            </h1>
            <p className="text-xs text-[var(--text-muted)]">Configure driver classification rules, question mappings, and data integration controls.</p>
          </div>
        </div>
      </div>

      <DriverClassificationManager />
    </div>
  );
}
