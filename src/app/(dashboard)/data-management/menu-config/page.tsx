'use client';

import React from 'react';
import { useMenuConfig } from '@/modules/common/hooks/use-menu-config';
import { Settings2, BarChart3, Users, TrendingUp, Share2, Star, Plane } from 'lucide-react';

const MENU_OPTIONS = [
  { href: '/executive-summary', label: 'Executive Summary', icon: Star, desc: 'Landing overview — key scorecards from all modules' },
  { href: '/cx-performance', label: 'CX Performance & CSAT Analytics', icon: BarChart3, desc: 'CSAT & 3P Driver Analytics' },
  { href: '/operations', label: 'Operations', icon: Users, desc: 'Interaksi & Pengunjung' },
  { href: '/performance-kpi', label: 'Performance KPI', icon: TrendingUp, desc: 'SLA & Operational' },
  { href: '/social-media', label: 'Social Media', icon: Share2, desc: 'Sentiment & Platform' },
  { href: '/angkasa-pura-indonesia', label: 'Angkasa Pura Indonesia', icon: Plane, desc: 'Dashboard & Report' },
];

export default function MenuConfigPage() {
  const { enabledMenus, toggleMenu, isLoaded } = useMenuConfig();

  if (!isLoaded) return <div className="p-6 text-[var(--text-muted)] animate-pulse">Loading menu configuration...</div>;

  return (
    <div className="p-6 max-w-3xl mx-auto mt-10 animate-in">
      <div className="glass-card p-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-lg">
            <Settings2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>
              Menu Visibility Configuration
            </h1>
            <p className="text-sm text-[var(--text-muted)]">
              Toggle the switches to show or hide modules in your dashboard sidebar.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {MENU_OPTIONS.map((menu) => {
            const isActive = enabledMenus.includes(menu.href);
            return (
              <div 
                key={menu.href} 
                className="bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-xl p-5 flex items-center justify-between transition-all hover:bg-[var(--bg-tertiary)]"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shadow-sm transition-colors ${isActive ? 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary-light)]' : 'bg-gray-500/10 text-gray-500'}`}>
                    <menu.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className={`font-bold transition-colors ${isActive ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'}`}>
                      {menu.label}
                    </h3>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">{menu.desc}</p>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={isActive}
                    onChange={(e) => toggleMenu(menu.href, e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-gray-500/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--accent-primary)] shadow-inner"></div>
                </label>
              </div>
            );
          })}
        </div>

        <div className="mt-8 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg flex gap-3 text-yellow-600 dark:text-yellow-400">
          <span className="text-lg">💡</span>
          <p className="text-xs font-medium leading-relaxed">
            Note: The <strong>Data Management</strong> menu is intentionally excluded from this list. It remains permanently enabled to ensure you never lose access to this configuration page.
          </p>
        </div>
      </div>
    </div>
  );
}
