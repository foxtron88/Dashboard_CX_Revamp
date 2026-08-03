'use client';

import React, { useState } from 'react';
import { useCSATTarget } from '@/modules/common/hooks/use-csat-target';
import { Target, Save, CheckCircle2 } from 'lucide-react';

export default function CSATTargetPage() {
  const { target, updateTarget } = useCSATTarget();
  const [inputValue, setInputValue] = useState(target.toFixed(2));
  const [isSaved, setIsSaved] = useState(false);

  // Sync state if target changes externally, though typically it's only changed here
  React.useEffect(() => {
    setInputValue(target.toFixed(2));
  }, [target]);

  const handleSave = () => {
    const val = parseFloat(inputValue);
    if (!isNaN(val) && val >= 1 && val <= 5) {
      updateTarget(val);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    } else {
      alert('Please enter a valid target score between 1 and 5');
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto mt-10 animate-in">
      <div className="glass-card p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center text-white shadow-lg">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>
              CSAT Target Configuration
            </h1>
            <p className="text-sm text-[var(--text-muted)]">
              Set the global Customer Satisfaction target score. This will be applied across all dashboard views.
            </p>
          </div>
        </div>

        <div className="bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-xl p-6">
          <label className="block text-sm font-semibold text-[var(--text-primary)] mb-2 uppercase tracking-wide">
            Global Target Score
          </label>
          <div className="flex items-center gap-4">
            <input 
              type="number"
              min="1"
              max="5"
              step="0.01"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="w-32 bg-[var(--bg-primary)] border border-[var(--glass-border)] rounded-lg px-4 py-2 text-xl font-bold text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] transition-colors"
            />
            <button
              onClick={handleSave}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-semibold transition-all shadow-lg ${
                isSaved 
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50' 
                  : 'bg-[var(--accent-primary)] text-white hover:opacity-90'
              }`}
            >
              {isSaved ? (
                <>
                  <CheckCircle2 className="w-5 h-5" /> Saved
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" /> Save Target
                </>
              )}
            </button>
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-3">
            Current applied target is <strong className="text-[var(--text-primary)]">{target.toFixed(2)}</strong>. Score range is 1.00 to 5.00.
          </p>
        </div>
      </div>
    </div>
  );
}
