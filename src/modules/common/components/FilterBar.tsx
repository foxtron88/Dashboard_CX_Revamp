'use client';

import React, { useMemo } from 'react';
import { useFilterStore } from '../hooks/filter-store';
import type { CSATRecord } from '../types';

interface FilterBarProps {
  records: CSATRecord[];
}

export default function FilterBar({ records }: FilterBarProps) {
  const {
    businessUnit, location, facilityType, sentiment, startDate, endDate,
    setBusinessUnit, setLocation, setFacilityType, setSentiment, setStartDate, setEndDate,
    resetFilters,
  } = useFilterStore();

  const businessUnits = useMemo(
    () => [...new Set(records.map(r => r.bu).filter(Boolean))].sort(),
    [records]
  );

  const locations = useMemo(() => {
    const subset = businessUnit === 'all' ? records : records.filter(r => r.bu === businessUnit);
    return [...new Set(subset.map(r => r.location).filter(Boolean))].sort();
  }, [records, businessUnit]);

  const facilities = useMemo(() => {
    let subset = records;
    if (businessUnit !== 'all') subset = subset.filter(r => r.bu === businessUnit);
    if (location !== 'all') subset = subset.filter(r => r.location === location);
    return [...new Set(subset.map(r => r.facility_type).filter(Boolean))].sort();
  }, [records, businessUnit, location]);

  const selectClass = `
    bg-[var(--bg-tertiary)] border border-[var(--glass-border)] rounded-lg px-3 py-2
    text-sm text-[var(--text-primary)] outline-none
    focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)]
    transition-all duration-200 min-w-[140px]
  `;

  const labelClass = 'text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-1';

  return (
    <div className="glass-card !p-4 flex flex-wrap items-end gap-4 animate-in">
      {/* Business Unit */}
      <div className="flex flex-col">
        <label className={labelClass}>Business Unit</label>
        <select className={selectClass} value={businessUnit} onChange={e => setBusinessUnit(e.target.value)}>
          <option value="all">All Units</option>
          {businessUnits.map(bu => <option key={bu} value={bu}>{bu}</option>)}
        </select>
      </div>

      {/* Location */}
      <div className="flex flex-col">
        <label className={labelClass}>Location</label>
        <select className={selectClass} value={location} onChange={e => setLocation(e.target.value)}>
          <option value="all">All Locations</option>
          {locations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
        </select>
      </div>

      {/* Facility Type */}
      <div className="flex flex-col">
        <label className={labelClass}>Facility Type</label>
        <select className={selectClass} value={facilityType} onChange={e => setFacilityType(e.target.value)}>
          <option value="all">All Facilities</option>
          {facilities.map(f => <option key={f} value={f}>{f}</option>)}
        </select>
      </div>

      {/* Sentiment */}
      <div className="flex flex-col">
        <label className={labelClass}>Sentiment</label>
        <select className={selectClass} value={sentiment} onChange={e => setSentiment(e.target.value)}>
          <option value="all">All Sentiments</option>
          <option value="Positive">Positive</option>
          <option value="Neutral">Neutral</option>
          <option value="Negative">Negative</option>
        </select>
      </div>

      {/* Start Date */}
      <div className="flex flex-col">
        <label className={labelClass}>Start Date</label>
        <input type="date" className={selectClass} value={startDate} onChange={e => setStartDate(e.target.value)} />
      </div>

      {/* End Date */}
      <div className="flex flex-col">
        <label className={labelClass}>End Date</label>
        <input type="date" className={selectClass} value={endDate} onChange={e => setEndDate(e.target.value)} />
      </div>

      {/* Reset */}
      <button
        onClick={resetFilters}
        className="px-4 py-2 rounded-lg bg-[var(--accent-primary)] text-white text-sm font-medium
                   hover:bg-[var(--accent-primary-light)] transition-all duration-200 cursor-pointer"
      >
        ↻ Reset
      </button>
    </div>
  );
}
