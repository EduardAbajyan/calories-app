"use client";

import { useEffect } from "react";

export default function ForgotPasswordError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="flex w-full max-w-md flex-col items-center gap-4 rounded-[28px] border border-danger/20 bg-surface/80 px-6 py-8 shadow-[0_20px_60px_rgba(0,0,0,0.12)] backdrop-blur-xl">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-danger">
          Something went wrong
        </p>
        <p className="text-center text-sm text-foreground/70">
          {error.message || "Failed to process your password reset request."}
        </p>
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center rounded-full border border-border bg-surface-elevated px-4 py-2 text-sm font-medium text-foreground transition hover:border-accent hover:text-accent"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
