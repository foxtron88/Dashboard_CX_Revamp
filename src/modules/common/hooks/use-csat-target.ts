'use client';

import { useState, useEffect } from 'react';

const STORAGE_KEY = 'cx_one_csat_target';
const DEFAULT_TARGET = 4.40;

export function useCSATTarget() {
  const [target, setTarget] = useState<number>(DEFAULT_TARGET);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored !== null) {
        setTarget(parseFloat(stored));
      }
    } catch (e) {
      console.error('Failed to read CSAT target from localStorage', e);
    }
  }, []);

  const updateTarget = (newTarget: number) => {
    setTarget(newTarget);
    try {
      localStorage.setItem(STORAGE_KEY, newTarget.toString());
      // Dispatch a custom event so other components on the same page can re-render
      window.dispatchEvent(new Event('cx_target_updated'));
    } catch (e) {
      console.error('Failed to save CSAT target to localStorage', e);
    }
  };

  useEffect(() => {
    const handleUpdate = () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored !== null) {
          setTarget(parseFloat(stored));
        }
      } catch (e) {
        // ignore
      }
    };

    window.addEventListener('cx_target_updated', handleUpdate);
    return () => window.removeEventListener('cx_target_updated', handleUpdate);
  }, []);

  return { target, updateTarget };
}
