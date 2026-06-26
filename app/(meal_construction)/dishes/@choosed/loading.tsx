export default function ChoosedLoading() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6 sm:px-8">
      <div className="absolute inset-0 bg-black/45 backdrop-blur-[2px]" />
      <section className="relative z-10 w-full max-w-3xl rounded-[30px] border border-border/80 bg-[radial-gradient(circle_at_top_left,var(--color-accent-soft),transparent_38%),linear-gradient(180deg,var(--color-surface)_0%,var(--color-surface-elevated)_100%)] p-6 shadow-[0_30px_90px_rgba(0,0,0,0.3)] backdrop-blur-xl">
        <div className="flex flex-col items-center gap-3 py-10">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-accent" />
          <p className="text-sm font-medium text-foreground/70">
            Loading dish spotlight…
          </p>
        </div>
      </section>
    </div>
  );
}
