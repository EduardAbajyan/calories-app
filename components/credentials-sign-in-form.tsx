"use client";

import cssClasses from "./credentials-sign-in-form.module.css";

import { useActionState, useState, useEffect } from "react";
import { AuthAction, type ActionState } from "@/server_actions/auth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthPending } from "@/components/auth-pending-context";

export default function AuthForm({
  mode = "login",
}: {
  mode: "login" | "signup";
}) {
  const router = useRouter();
  const { pendingSource, setPendingSource } = useAuthPending();
  const isAnyPending = pendingSource !== null;
  
  const [formState, formAction, isPending] = useActionState(
    AuthAction.bind(null, mode),
    {
      success: false,
    } as ActionState,
  );

  const [showError, setShowError] = useState(false);

  // Hide error message after 10 seconds
  useEffect(() => {
    if (formState.error) {
      setShowError(true);
      const timer = setTimeout(() => {
        setShowError(false);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [formState.error]);

  // Redirect on successful login (but not signup since we need email verification)
  useEffect(() => {
    if (formState.success && mode === "login") {
      router.push("/dashboard");
    }
  }, [formState.success, mode, router]);

  useEffect(() => {
    if (!isPending && pendingSource === "credentials") {
      setPendingSource(null);
    }
  }, [isPending, pendingSource, setPendingSource]);

  return (
    <section className={cssClasses.auth}>
      {formState.success && mode === "signup" ? (
        // Show success message for signup with verification instructions
        <div className={cssClasses.form}>
          <h1 className={cssClasses.header}>Check Your Email! 📧</h1>
          <div className="space-y-4 text-center">
            <div
              className={`${cssClasses.success} p-4 bg-green-50 border border-green-200 rounded-lg`}
            >
              <p className="text-green-800 font-medium">
                {formState.message || "Account created successfully!"}
              </p>
              <p className="text-green-600 text-sm mt-2">
                Please check your inbox and click the verification link to
                complete your registration.
              </p>
            </div>

            <div className="space-y-2">
              <Link
                href="/resend-verification"
                className="inline-block text-sm text-blue-600 hover:text-blue-800 underline"
              >
                Didn&apos;t receive the email? Resend verification
              </Link>
              <br />
              <Link
                href="/?mode=login"
                className="inline-block text-sm text-gray-600 hover:text-gray-800"
              >
                Back to Login
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <form
          className={cssClasses.form}
          action={formAction}
          onSubmit={() => setPendingSource("credentials")}
        >
          <h1 className={cssClasses.header}>
            {mode === "login" ? "Login" : "Sign Up"}
          </h1>

          {formState.error && showError && (
            <div className={cssClasses.error}>
              {formState.error}
              {formState.needsVerification && (
                <div className="mt-2">
                  <Link
                    href="/resend-verification"
                    className="text-sm text-blue-600 hover:text-blue-800 underline"
                  >
                    Resend verification email
                  </Link>
                </div>
              )}
            </div>
          )}

          <div className={cssClasses.control}>
            <label htmlFor="email">Your Email:</label>
            <input
              className={cssClasses.input}
              type="email"
              id="email"
              name="email"
              placeholder="user@server.domain"
              required
            />
          </div>
          <div className={cssClasses.control}>
            <label htmlFor="password">Your Password:</label>
            <input
              className={cssClasses.input}
              type="password"
              id="password"
              name="password"
              placeholder="****************"
              required
            />
          </div>
          <div className={cssClasses.actions}>
            {mode === "login" ? (
              <Link href="/forgot-password">Forgot password?</Link>
            ) : null}
            <button
              className={cssClasses.button}
              disabled={isPending || isAnyPending}
            >
              {isPending || isAnyPending
                ? mode === "login"
                  ? "Logging in..."
                  : "Creating account..."
                : mode === "login"
                  ? "Login"
                  : "Create Account"}
            </button>
            <Link href={`/?mode=${mode === "login" ? "signup" : "login"}`}>
              {mode === "login"
                ? "Create an account."
                : "Login with existing account."}
            </Link>
          </div>
        </form>
      )}
    </section>
  );
}
