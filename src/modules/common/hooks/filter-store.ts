'use client';

import { create } from 'zustand';
import type { FilterState } from '../types';

interface FilterStore extends FilterState {
  setBusinessUnit: (bu: string) => void;
  setLocation: (loc: string) => void;
  setFacilityType: (ft: string) => void;
  setSentiment: (s: string) => void;
  setStartDate: (d: string) => void;
  setEndDate: (d: string) => void;
  resetFilters: () => void;
}

const initialState: FilterState = {
  businessUnit: 'all',
  location: 'all',
  facilityType: 'all',
  sentiment: 'all',
  startDate: '',
  endDate: '',
};

export const useFilterStore = create<FilterStore>((set) => ({
  ...initialState,
  setBusinessUnit: (bu) => set({ businessUnit: bu, location: 'all', facilityType: 'all' }),
  setLocation: (loc) => set({ location: loc, facilityType: 'all' }),
  setFacilityType: (ft) => set({ facilityType: ft }),
  setSentiment: (s) => set({ sentiment: s }),
  setStartDate: (d) => set({ startDate: d }),
  setEndDate: (d) => set({ endDate: d }),
  resetFilters: () => set(initialState),
}));
