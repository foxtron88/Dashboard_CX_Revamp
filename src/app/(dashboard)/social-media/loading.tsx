export default function Loading() {
  return (
    <div className="space-y-6 p-6 animate-pulse">
      {/* Filter bar skeleton */}
      <div className="glass-card h-14 rounded-xl bg-[var(--glass-bg)]" />

      {/* Metrics row skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="glass-card h-24 rounded-xl bg-[var(--glass-bg)]" />
        ))}
      </div>

      {/* Sentiment chart skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass-card h-56 rounded-xl bg-[var(--glass-bg)]" />
        <div className="glass-card h-56 rounded-xl bg-[var(--glass-bg)]" />
      </div>

      {/* Trend chart skeleton */}
      <div className="glass-card h-64 rounded-xl bg-[var(--glass-bg)]" />
    </div>
  );
}
