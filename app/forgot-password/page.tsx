"use client";

import Link from "next/link";
import { useActionState } from "react";
import { forgotPasswordAction, type ActionState } from "@/server_actions/auth";

export default function ForgotPasswordPage() {
  const [state, formAction, isPending] = useActionState(
    forgotPasswordAction,
    { success: false } as ActionState,
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-emerald-50 to-teal-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Forgot password
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Enter your email and we&apos;ll send a reset link.
          </p>
        </div>

        <div className="bg-white shadow-2xl rounded-lg px-8 py-8">
          {state.success ? (
            <div className="rounded-md bg-green-50 p-4 text-sm text-green-800">
              {state.message}
            </div>
          ) : null}

          <form action={formAction} className="space-y-6">
            <div>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-lg block w-full px-3 py-3 border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="Enter your email address"
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
              {isPending ? "Sending..." : "Send reset link"}
            </button>

            <div className="text-center">
              <Link href="/?mode=login" className="text-sm text-emerald-700 hover:underline">
                Back to login
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
