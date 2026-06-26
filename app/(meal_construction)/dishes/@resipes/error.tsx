"use client";

import { useEffect } from "react";

export default function ResipesSlotError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error("Resipes slot render failed", {
      message: error.message,
      digest: error.digest,
    });
  }, [error]);

  return (
    <section className="relative w-full rounded-[28px] border border-danger/20 bg-surface/80 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.12)] backdrop-blur-xl">
      <p className="mb-2 inline-flex rounded-full border border-danger/20 bg-danger-soft px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-danger">
        Resipes unavailable
      </p>
      <h3 className="text-xl font-semibold tracking-tight text-foreground">
        We couldn&apos;t load the dish search panel.
      </h3>
      <p className="mt-2 text-sm leading-6 text-foreground/70">
        Please try again.
      </p>
      {error.digest ? (
        <p className="mt-4 rounded-full border border-border bg-surface-elevated px-3 py-1 text-xs text-foreground/70">
          Error reference: {error.digest}
        </p>
      ) : null}
      <button
        type="button"
        onClick={() => unstable_retry()}
        className="mt-4 inline-flex items-center rounded-full border border-border bg-surface-elevated px-4 py-2 text-sm font-medium text-foreground transition hover:border-accent hover:text-accent"
      >
        Try again
      </button>
    </section>
  );
}
