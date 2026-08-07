// loading.tsx — shown by Next.js App Router instantly while the page loads.
// Gives users immediate visual feedback (<100ms perceived response).
export default function Loading() {
  return (
    <div className="space-y-6 p-6 animate-pulse">
      {/* Filter bar skeleton */}
      <div className="glass-card h-16 rounded-xl bg-[var(--glass-bg)]" />

      {/* KPI cards skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="glass-card h-28 rounded-xl bg-[var(--glass-bg)]" />
        ))}
      </div>

      {/* Chart skeleton rows */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass-card h-52 rounded-xl bg-[var(--glass-bg)]" />
        <div className="glass-card h-52 rounded-xl bg-[var(--glass-bg)]" />
      </div>
      <div className="glass-card h-64 rounded-xl bg-[var(--glass-bg)]" />
    </div>
  );
}
