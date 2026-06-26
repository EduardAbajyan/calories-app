export default function ResipesLoading() {
  return (
    <section className="relative w-full rounded-[28px] border border-border/70 bg-surface/80 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.12)] backdrop-blur-xl">
      <p className="mb-2 inline-flex rounded-full border border-border bg-surface-elevated px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-accent">
        Resipes
      </p>
      <div className="mt-4 space-y-3">
        <div className="h-10 w-full animate-pulse rounded-xl bg-surface-elevated" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="h-44 animate-pulse rounded-2xl bg-surface-elevated" />
          <div className="h-44 animate-pulse rounded-2xl bg-surface-elevated" />
          <div className="h-44 animate-pulse rounded-2xl bg-surface-elevated" />
          <div className="h-44 animate-pulse rounded-2xl bg-surface-elevated" />
        </div>
      </div>
    </section>
  );
}
