'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart3, Users, TrendingUp, Share2, Database, LayoutDashboard, Star,
} from 'lucide-react';

const navItems = [
  { href: '/executive-summary', label: 'Executive Summary', icon: Star, emoji: '⭐', description: 'Landing overview — key scorecards from all modules', gradient: 'linear-gradient(135deg, #6366f1, #06b6d4)' },
  { href: '/cx-performance', label: 'CX Performance & CSAT Analytics', icon: BarChart3, emoji: '📊', description: 'CSAT & 3P Driver Analytics', gradient: 'linear-gradient(135deg, #6366f1, #06b6d4)' },
  { href: '/operations', label: 'Operations', icon: Users, emoji: '👥', description: 'Interaksi & Pengunjung', gradient: 'linear-gradient(135deg, #0ea5e9, #10b981)' },
  { href: '/performance-kpi', label: 'Performance KPI', icon: TrendingUp, emoji: '📈', description: 'SLA & Operational', gradient: 'linear-gradient(135deg, #ec4899, #f43f5e)' },
  { href: '/social-media', label: 'Social Media', icon: Share2, emoji: '📱', description: 'Sentiment & Platform', gradient: 'linear-gradient(135deg, #8b5cf6, #d946ef)' },
  { href: '/data-management', label: 'Data Management', icon: Database, emoji: '⚙️', description: 'Integration Controls', gradient: 'linear-gradient(135deg, #64748b, #94a3b8)' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-[var(--bg-secondary)] border-r border-[var(--glass-border)] flex flex-col shrink-0 sticky top-0 h-screen overflow-y-auto">
        {/* Logo */}
        <div className="p-5 border-b border-[var(--glass-border)]">
          <Link href="/executive-summary" className="flex items-center gap-3 no-underline">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] flex items-center justify-center text-white font-bold text-sm shadow-lg">
              CX
            </div>
            <div>
              <h1 className="text-base font-bold text-[var(--text-primary)] leading-tight" style={{ fontFamily: 'var(--font-display)' }}>
                CX One
              </h1>
              <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest">Dashboard</p>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1">
          <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest px-3 pt-3 pb-2">Analytics</p>
          {navItems.map(item => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm no-underline transition-all duration-200
                  ${isActive
                    ? 'bg-[var(--accent-primary)]/15 text-[var(--accent-primary-light)] border border-[var(--accent-primary)]/20'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--glass-bg)] hover:text-[var(--text-primary)]'
                  }
                `}
              >
                <item.icon className="w-4 h-4 shrink-0" />
                <div>
                  <div className="font-medium leading-tight">{item.label}</div>
                  <div className="text-[10px] text-[var(--text-muted)] leading-tight mt-0.5">{item.description}</div>
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-[var(--glass-border)]">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[var(--accent-success)] animate-pulse" />
            <span className="text-[11px] text-[var(--text-muted)]">System Online</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Top Bar */}
        <header className="sticky top-0 z-10 bg-[var(--bg-primary)]/80 backdrop-blur-xl border-b border-[var(--glass-border)] px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {(() => {
              const currentNav = navItems.find(item => item.href === pathname);
              if (currentNav) {
                return (
                  <>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shadow-sm"
                      style={{ background: currentNav.gradient }}>
                      {currentNav.emoji}
                    </div>
                    <div>
                      <h1 className="text-lg font-bold text-[var(--text-primary)] leading-tight" style={{ fontFamily: 'var(--font-display)' }}>
                        {currentNav.label}
                      </h1>
                      <p className="text-[10px] text-[var(--text-muted)] leading-tight">{currentNav.description}</p>
                    </div>
                  </>
                );
              }
              return (
                <>
                  <LayoutDashboard className="w-5 h-5 text-[var(--text-muted)]" />
                  <span className="text-sm font-semibold text-[var(--text-secondary)]">Customer Experience Dashboard</span>
                </>
              );
            })()}
          </div>
          <div className="text-xs text-[var(--text-muted)]" id="lastUpdated">
            {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
          </div>
        </header>

        {/* Page Content */}
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
