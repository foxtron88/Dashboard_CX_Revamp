'use client';

import { useState, useEffect } from 'react';

const STORAGE_KEY = 'cx_one_menu_config';

// By default, all standard menus are enabled
const DEFAULT_ENABLED = [
  '/executive-summary',
  '/cx-performance',
  '/operations',
  '/performance-kpi',
  '/social-media'
  // Note: /data-management is always enabled by logic, not state.
];

export function useMenuConfig() {
  const [enabledMenus, setEnabledMenus] = useState<string[]>(DEFAULT_ENABLED);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored !== null) {
        setEnabledMenus(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to read menu config from localStorage', e);
    }
    setIsLoaded(true);
  }, []);

  const toggleMenu = (href: string, isEnabled: boolean) => {
    setEnabledMenus(prev => {
      let next = [...prev];
      if (isEnabled && !next.includes(href)) {
        next.push(href);
      } else if (!isEnabled) {
        next = next.filter(h => h !== href);
      }
      
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        window.dispatchEvent(new Event('cx_menu_updated'));
      } catch (e) {
        console.error('Failed to save menu config to localStorage', e);
      }
      return next;
    });
  };

  useEffect(() => {
    const handleUpdate = () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored !== null) {
          setEnabledMenus(JSON.parse(stored));
        }
      } catch (e) {
        // ignore
      }
    };

    window.addEventListener('cx_menu_updated', handleUpdate);
    return () => window.removeEventListener('cx_menu_updated', handleUpdate);
  }, []);

  return { enabledMenus, toggleMenu, isLoaded };
}
