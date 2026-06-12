export default function AdminLoading() {
  return (
    <div className="admin-shell pb-10">
      <header className="admin-hero">
        <div className="space-y-4">
          <div className="h-3 w-32 animate-pulse rounded bg-[color:var(--admin-violet)] opacity-40" />
          <div className="h-16 w-96 animate-pulse rounded bg-[color:var(--admin-panel)] opacity-60" />
          <div className="h-4 w-[600px] animate-pulse rounded bg-[color:var(--admin-panel)] opacity-40" />
        </div>
      </header>

      <section className="admin-grid admin-grid-five">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="admin-stat gray">
            <div className="h-3 w-20 animate-pulse rounded bg-[color:var(--admin-muted)] opacity-60" />
            <div className="mt-4 h-12 w-24 animate-pulse rounded bg-[color:var(--admin-text)] opacity-60" />
            <div className="mt-3 h-3 w-32 animate-pulse rounded bg-[color:var(--admin-soft)] opacity-40" />
          </div>
        ))}
      </section>

      <section className="admin-section">
        <div className="mb-4 space-y-2">
          <div className="h-3 w-24 animate-pulse rounded bg-[color:var(--admin-violet)] opacity-40" />
          <div className="h-8 w-48 animate-pulse rounded bg-[color:var(--admin-text)] opacity-60" />
          <div className="h-3 w-96 animate-pulse rounded bg-[color:var(--admin-muted)] opacity-40" />
        </div>
        <div className="admin-panel">
          <div className="space-y-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl bg-[color:var(--admin-panel-strong)] opacity-60" />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
