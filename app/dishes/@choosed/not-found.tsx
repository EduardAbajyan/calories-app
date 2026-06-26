import Link from "next/link";

export default function ChoosedNotFound() {
  return (
    <section className="relative w-full rounded-[28px] border border-border/70 bg-surface/80 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.12)] backdrop-blur-xl">
      <p className="mb-2 inline-flex rounded-full border border-border bg-surface-elevated px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-accent">
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
  );
}
