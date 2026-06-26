"use client";

import Link from "next/link";
import { useActionState } from "react";
import { changePasswordAction, type ActionState } from "@/server_actions/auth";

export default function ChangePasswordForm() {
  const [state, formAction, isPending] = useActionState(
    changePasswordAction,
    { success: false } as ActionState,
  );

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="currentPassword" className="block text-sm font-medium text-foreground">
          Current password
        </label>
        <input
          id="currentPassword"
          name="currentPassword"
          type="password"
          required
          className="mt-1 w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-foreground shadow-sm outline-none transition placeholder:text-foreground/35 focus:border-accent focus:ring-4 focus:ring-accent-soft"
          placeholder="Current password"
        />
      </div>

      <div>
        <label htmlFor="newPassword" className="block text-sm font-medium text-foreground">
          New password
        </label>
        <input
          id="newPassword"
          name="newPassword"
          type="password"
          minLength={8}
          required
          className="mt-1 w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-foreground shadow-sm outline-none transition placeholder:text-foreground/35 focus:border-accent focus:ring-4 focus:ring-accent-soft"
          placeholder="At least 8 characters"
        />
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground">
          Confirm new password
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          minLength={8}
          required
          className="mt-1 w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-foreground shadow-sm outline-none transition placeholder:text-foreground/35 focus:border-accent focus:ring-4 focus:ring-accent-soft"
          placeholder="Re-enter your new password"
        />
      </div>

      {state.error ? (
        <p className="rounded-2xl border border-danger/20 bg-danger-soft px-4 py-3 text-sm text-danger">
          {state.error}
        </p>
      ) : null}

      {state.success ? (
        <p className="rounded-2xl border border-success/20 bg-success-soft px-4 py-3 text-sm text-success">
          {state.message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex w-full items-center justify-center rounded-full bg-accent px-5 py-3 text-sm font-bold uppercase tracking-[0.14em] text-accent-foreground shadow-[0_14px_30px_rgba(0,0,0,0.18)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_36px_rgba(0,0,0,0.24)] disabled:translate-y-0 disabled:opacity-60 disabled:shadow-none"
      >
        {isPending ? "Updating..." : "Change password"}
      </button>

      <div className="text-center">
        <Link href="/dashboard" className="text-sm text-accent hover:underline">
          Back to dashboard
        </Link>
      </div>
    </form>
  );
}
