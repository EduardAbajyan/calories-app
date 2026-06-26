"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useActionState } from "react";
import { resetPasswordAction, type ActionState } from "@/server_actions/auth";

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const email = searchParams.get("email") ?? "";

  const [state, formAction, isPending] = useActionState(
    resetPasswordAction,
    { success: false } as ActionState,
  );

  const hasRequiredParams = token.length > 0 && email.length > 0;

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-emerald-50 to-teal-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Reset password
          </h2>
        </div>

        <div className="bg-white shadow-2xl rounded-lg px-8 py-8">
          {!hasRequiredParams ? (
            <div className="rounded-md bg-red-50 p-4 text-sm text-red-800">
              Invalid reset link. Please request a new one.
            </div>
          ) : null}

          {state.success ? (
            <div className="rounded-md bg-green-50 p-4 text-sm text-green-800">
              {state.message}
            </div>
          ) : null}

          {hasRequiredParams ? (
            <form action={formAction} className="space-y-6">
              <input type="hidden" name="token" value={token} />
              <input type="hidden" name="email" value={email} />

              <div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  className="appearance-none rounded-lg block w-full px-3 py-3 border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="New password"
                />
              </div>

              {state.error ? (
                <div className="rounded-md bg-red-50 p-4 text-sm text-red-800">
                  {state.error}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={isPending}
                className="w-full py-3 px-4 text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60"
              >
                {isPending ? "Updating..." : "Update password"}
              </button>
            </form>
          ) : null}

          <div className="mt-4 text-center">
            <Link href="/?mode=login" className="text-sm text-emerald-700 hover:underline">
              Back to login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
