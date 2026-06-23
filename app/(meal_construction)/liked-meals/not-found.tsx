import Link from "next/link";

export default function LikedMealsNotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="flex w-full max-w-md flex-col items-center gap-4 rounded-[28px] border border-border/70 bg-surface/80 px-6 py-8 shadow-[0_20px_60px_rgba(0,0,0,0.12)] backdrop-blur-xl">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-accent">
          Not found
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          No meals found
        </h1>
        <p className="text-center text-sm text-foreground/70">
          You have not liked any meals yet.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center rounded-full border border-border bg-surface-elevated px-4 py-2 text-sm font-medium text-foreground transition hover:border-accent hover:text-accent"
        >
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
