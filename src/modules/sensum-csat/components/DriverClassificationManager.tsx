'use client';

import React, { useState, useEffect } from 'react';

export interface ClassificationRule {
  pplKeywords: string[];
  prcKeywords: string[];
  prmKeywords: string[];
  overrides: Record<string, 'People' | 'Process' | 'Premises'>;
}

const DEFAULT_RULES: ClassificationRule = {
  pplKeywords: ['staff', 'petugas', 'people', 'keramahan', 'pelayanan', 'penampilan', 'sikap', 'kesigapan', 'personil'],
  prcKeywords: ['alur', 'prosedur', 'kecepatan', 'proses', 'antre', 'process', 'waktu', 'durasi', 'transaksi', 'akses', 'opsi pembayaran'],
  prmKeywords: ['fasilitas', 'kebersihan', 'kenyamanan', 'kelengkapan', 'product', 'premise', 'ruangan', 'alat', 'toilet', 'tisu', 'aroma', 'penerangan', 'sirkulasi', 'ketersediaan', 'kualitas', 'harga'],
  overrides: {}
};

const DISCOVERED_QUESTIONS = [
  { id: '1', name: 'Staff dan Petugas (Penampilan, keramahan, dll)', defaultCategory: 'People' },
  { id: '2', name: 'People CSAT / Service Attitude', defaultCategory: 'People' },
  { id: '3', name: 'Alur & Pengelolaan Toilet', defaultCategory: 'Process' },
  { id: '4', name: 'Proses dan Alur Check In', defaultCategory: 'Process' },
  { id: '5', name: 'Kecepatan dan Prosedur Keamanan Layanan', defaultCategory: 'Process' },
  { id: '6', name: 'Kebersihan, Kenyamanan, Keamanan, dan Kecepatan Antre', defaultCategory: 'Process' },
  { id: '7', name: 'Process CSAT / Queue Management', defaultCategory: 'Process' },
  { id: '8', name: 'Fasilitas Toilet (Toilet bowl, Tisu, dll)', defaultCategory: 'Premises' },
  { id: '9', name: 'Fasilitas Baggage Claim (Conveyor Belt, Troli, dll)', defaultCategory: 'Premises' },
  { id: '10', name: 'Kelengkapan fasilitas, Ketersediaan, Rasa dan Kualitas Produk', defaultCategory: 'Premises' },
  { id: '11', name: 'Kebersihan, Kenyamanan, dan Opsi Pembayaran', defaultCategory: 'Premises' },
  { id: '12', name: 'Kebersihan, Kenyamanan, dan Kemudahan Akses', defaultCategory: 'Premises' },
  { id: '13', name: 'Kebersihan, Kenyamanan, dan Keterawatan Nursery Room', defaultCategory: 'Premises' },
  { id: '14', name: 'Ketersediaan Tempat Parkir', defaultCategory: 'Premises' },
  { id: '15', name: 'Variasi dan Ketersediaan Produk', defaultCategory: 'Premises' },
  { id: '16', name: 'Product or Premise CSAT', defaultCategory: 'Premises' }
];

export default function DriverClassificationManager() {
  const [rules, setRules] = useState<ClassificationRule>(DEFAULT_RULES);
  const [newPplTag, setNewPplTag] = useState('');
  const [newPrcTag, setNewPrcTag] = useState('');
  const [newPrmTag, setNewPrmTag] = useState('');
  const [testText, setTestText] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('csat_driver_classification_rules');
      if (stored) {
        setRules(JSON.parse(stored));
      }
    } catch {}
  }, []);

  const saveRules = (updated: ClassificationRule) => {
    setRules(updated);
    try {
      localStorage.setItem('csat_driver_classification_rules', JSON.stringify(updated));
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch {}
  };

  const addTag = (pillar: 'ppl' | 'prc' | 'prm', val: string) => {
    const trimmed = val.trim().toLowerCase();
    if (!trimmed) return;
    if (pillar === 'ppl' && !rules.pplKeywords.includes(trimmed)) {
      saveRules({ ...rules, pplKeywords: [...rules.pplKeywords, trimmed] });
      setNewPplTag('');
    } else if (pillar === 'prc' && !rules.prcKeywords.includes(trimmed)) {
      saveRules({ ...rules, prcKeywords: [...rules.prcKeywords, trimmed] });
      setNewPrcTag('');
    } else if (pillar === 'prm' && !rules.prmKeywords.includes(trimmed)) {
      saveRules({ ...rules, prmKeywords: [...rules.prmKeywords, trimmed] });
      setNewPrmTag('');
    }
  };

  const removeTag = (pillar: 'ppl' | 'prc' | 'prm', tag: string) => {
    if (pillar === 'ppl') {
      saveRules({ ...rules, pplKeywords: rules.pplKeywords.filter(t => t !== tag) });
    } else if (pillar === 'prc') {
      saveRules({ ...rules, prcKeywords: rules.prcKeywords.filter(t => t !== tag) });
    } else if (pillar === 'prm') {
      saveRules({ ...rules, prmKeywords: rules.prmKeywords.filter(t => t !== tag) });
    }
  };

  const handleOverride = (questionName: string, category: 'People' | 'Process' | 'Premises') => {
    saveRules({
      ...rules,
      overrides: { ...rules.overrides, [questionName]: category }
    });
  };

  const classifyText = (text: string) => {
    if (!text.trim()) return null;
    const l = text.toLowerCase();
    const matchesPpl = rules.pplKeywords.filter(k => l.includes(k));
    const matchesPrc = rules.prcKeywords.filter(k => l.includes(k));
    const matchesPrm = rules.prmKeywords.filter(k => l.includes(k));

    if (matchesPpl.length >= matchesPrc.length && matchesPpl.length >= matchesPrm.length && matchesPpl.length > 0) {
      return { category: 'People', color: '#6366f1', matches: matchesPpl };
    }
    if (matchesPrc.length >= matchesPrm.length && matchesPrc.length > 0) {
      return { category: 'Process', color: '#06b6d4', matches: matchesPrc };
    }
    if (matchesPrm.length > 0) {
      return { category: 'Premises', color: '#ec4899', matches: matchesPrm };
    }
    return { category: 'Unclassified', color: '#94a3b8', matches: [] };
  };

  const testResult = classifyText(testText);

  return (
    <div className="space-y-6 animate-in">
      {/* Top Banner */}
      <div className="glass-card flex items-center justify-between bg-gradient-to-r from-purple-900/20 to-blue-900/20 border-purple-500/20">
        <div>
          <h2 className="text-lg font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>
            ⚙️ Driver Question Classification Manager
          </h2>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            Configure keyword rules and manual overrides to classify survey headers into People, Process, and Premises.
          </p>
        </div>
        {savedSuccess && (
          <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full text-xs font-semibold animate-in">
            ✓ Rules Saved!
          </span>
        )}
      </div>

      {/* 3 Pillars Keyword Rules Config */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* People */}
        <div className="glass-card border-indigo-500/30 bg-indigo-500/5">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl">👥</span>
            <div>
              <h3 className="text-sm font-bold text-indigo-400">1. People (PPL) Keywords</h3>
              <p className="text-[10px] text-[var(--text-muted)]">Staff, service attitude & hospitality</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5 mb-3 min-h-[60px]">
            {rules.pplKeywords.map(k => (
              <span key={k} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {k}
                <button onClick={() => removeTag('ppl', k)} className="hover:text-red-400 font-bold ml-1">✕</button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newPplTag}
              onChange={e => setNewPplTag(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addTag('ppl', newPplTag)}
              placeholder="Add keyword..."
              className="flex-1 text-xs rounded-lg px-2.5 py-1.5 bg-[var(--glass-bg)] border border-[var(--glass-border)] text-[var(--text-primary)]"
            />
            <button onClick={() => addTag('ppl', newPplTag)} className="px-3 py-1.5 text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg">
              + Add
            </button>
          </div>
        </div>

        {/* Process */}
        <div className="glass-card border-cyan-500/30 bg-cyan-500/5">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl">🔄</span>
            <div>
              <h3 className="text-sm font-bold text-cyan-400">2. Process (PRC) Keywords</h3>
              <p className="text-[10px] text-[var(--text-muted)]">Workflow, queue speed & procedures</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5 mb-3 min-h-[60px]">
            {rules.prcKeywords.map(k => (
              <span key={k} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                {k}
                <button onClick={() => removeTag('prc', k)} className="hover:text-red-400 font-bold ml-1">✕</button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newPrcTag}
              onChange={e => setNewPrcTag(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addTag('prc', newPrcTag)}
              placeholder="Add keyword..."
              className="flex-1 text-xs rounded-lg px-2.5 py-1.5 bg-[var(--glass-bg)] border border-[var(--glass-border)] text-[var(--text-primary)]"
            />
            <button onClick={() => addTag('prc', newPrcTag)} className="px-3 py-1.5 text-xs font-medium bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg">
              + Add
            </button>
          </div>
        </div>

        {/* Premises */}
        <div className="glass-card border-pink-500/30 bg-pink-500/5">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl">🏢</span>
            <div>
              <h3 className="text-sm font-bold text-pink-400">3. Premises (PRM) Keywords</h3>
              <p className="text-[10px] text-[var(--text-muted)]">Facilities, cleanliness & physical setup</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5 mb-3 min-h-[60px]">
            {rules.prmKeywords.map(k => (
              <span key={k} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs bg-pink-500/20 text-pink-300 border border-pink-500/30">
                {k}
                <button onClick={() => removeTag('prm', k)} className="hover:text-red-400 font-bold ml-1">✕</button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newPrmTag}
              onChange={e => setNewPrmTag(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addTag('prm', newPrmTag)}
              placeholder="Add keyword..."
              className="flex-1 text-xs rounded-lg px-2.5 py-1.5 bg-[var(--glass-bg)] border border-[var(--glass-border)] text-[var(--text-primary)]"
            />
            <button onClick={() => addTag('prm', newPrmTag)} className="px-3 py-1.5 text-xs font-medium bg-pink-600 hover:bg-pink-500 text-white rounded-lg">
              + Add
            </button>
          </div>
        </div>
      </div>

      {/* Simulator / Test Tool */}
      <div className="glass-card bg-gradient-to-r from-slate-900/40 to-slate-800/40">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-2">🧪 Real-time Question Classifier Simulator</h3>
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={testText}
            onChange={e => setTestText(e.target.value)}
            placeholder="Type any question prompt e.g., 'Kebersihan dan kelengkapan tisu di toilet'..."
            className="flex-1 text-xs rounded-lg px-3 py-2 bg-[var(--glass-bg)] border border-[var(--glass-border)] text-[var(--text-primary)]"
          />
          {testResult && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold" style={{ borderColor: testResult.color, color: testResult.color }}>
              <span>Category: {testResult.category}</span>
              {testResult.matches.length > 0 && (
                <span className="text-[10px] font-normal text-[var(--text-muted)]">
                  (Matched: {testResult.matches.join(', ')})
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Question Header Overrides Table */}
      <div className="glass-card !p-0 overflow-hidden">
        <div className="p-4 border-b border-[var(--glass-border)] bg-[var(--bg-secondary)] flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">Discovered Question Headers & Manual Overrides</h3>
            <p className="text-[11px] text-[var(--text-muted)]">Override default classification for specific survey question headers</p>
          </div>
          <button
            onClick={() => saveRules(DEFAULT_RULES)}
            className="text-xs px-3 py-1 rounded bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30"
          >
            Reset to Defaults
          </button>
        </div>

        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--glass-border)] bg-[var(--bg-secondary)]">
              <th className="p-3 text-xs font-medium text-[var(--text-muted)] uppercase">#</th>
              <th className="p-3 text-xs font-medium text-[var(--text-muted)] uppercase">Survey Question Header</th>
              <th className="p-3 text-xs font-medium text-[var(--text-muted)] uppercase">Default Class</th>
              <th className="p-3 text-xs font-medium text-[var(--text-muted)] uppercase">Active Pillar Assignment</th>
            </tr>
          </thead>
          <tbody>
            {DISCOVERED_QUESTIONS.map((q, idx) => {
              const activeCategory = rules.overrides[q.name] || q.defaultCategory;
              return (
                <tr key={q.id} className="border-b border-[var(--glass-border)] hover:bg-[var(--glass-bg)] transition-colors">
                  <td className="p-3 text-xs text-[var(--text-muted)]">{idx + 1}</td>
                  <td className="p-3 font-medium text-xs text-[var(--text-primary)]">{q.name}</td>
                  <td className="p-3 text-xs text-[var(--text-muted)]">{q.defaultCategory}</td>
                  <td className="p-3">
                    <select
                      value={activeCategory}
                      onChange={e => handleOverride(q.name, e.target.value as any)}
                      className="text-xs font-semibold rounded-lg px-2.5 py-1 border bg-[var(--glass-bg)]"
                      style={{
                        color: activeCategory === 'People' ? '#6366f1' : activeCategory === 'Process' ? '#06b6d4' : '#ec4899',
                        borderColor: activeCategory === 'People' ? '#6366f140' : activeCategory === 'Process' ? '#06b6d440' : '#ec489940'
                      }}
                    >
                      <option value="People">👥 People (PPL)</option>
                      <option value="Process">🔄 Process (PRC)</option>
                      <option value="Premises">🏢 Premises (PRM)</option>
                    </select>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
