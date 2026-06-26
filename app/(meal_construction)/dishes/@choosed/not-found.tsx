import Link from "next/link";

export default function ChoosedNotFound() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6 sm:px-8">
      <Link
        href="/dishes"
        aria-label="Close dish spotlight"
        className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
      />

      <section className="relative z-10 w-full max-w-xl rounded-[30px] border border-border/80 bg-[radial-gradient(circle_at_top_left,var(--color-accent-soft),transparent_38%),linear-gradient(180deg,var(--color-surface)_0%,var(--color-surface-elevated)_100%)] p-6 shadow-[0_30px_90px_rgba(0,0,0,0.3)] backdrop-blur-xl">
        <p className="mb-2 inline-flex rounded-full border border-border bg-surface/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-accent">
          Dish not found
        </p>
        <h3 className="text-xl font-semibold tracking-tight text-foreground">
          This dish does not exist anymore.
        </h3>
        <p className="mt-2 text-sm leading-6 text-foreground/70">
          Return to dishes and choose another dish.
        </p>
        <Link
          href="/dishes"
          className="mt-4 inline-flex items-center rounded-full border border-border bg-surface-elevated px-4 py-2 text-sm font-medium text-foreground transition hover:border-accent hover:text-accent"
        >
          Back to dishes
        </Link>
      </section>
    </div>
  );
}
