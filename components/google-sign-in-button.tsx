"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useAuthPending } from "@/components/auth-pending-context";

export default function SignInButton() {
  const [isPending, setIsPending] = useState(false);
  const { pendingSource, setPendingSource } = useAuthPending();
  const isAnyPending = pendingSource !== null;

  async function handleSignIn() {
    if (isPending || isAnyPending) {
      return;
    }

    setIsPending(true);
    setPendingSource("google");
    await signIn("google");
  }

  const disableButton = isPending || isAnyPending;

  return (
    <div className="w-full px-5 flex flex-col items-center gap-4">
      <button
        type="button"
        disabled={disableButton}
        onClick={handleSignIn}
        className="w-full max-w-100 flex items-center justify-center gap-2 p-5 border rounded-lg bg-transparent hover:bg-[#34A853]/15 transition disabled:cursor-not-allowed disabled:opacity-70"
      >
        <img
          src="https://authjs.dev/img/providers/google.svg"
          alt="Google logo"
          width={20}
        />
        <span>{disableButton ? "Signing in..." : "Sign in with Google"}</span>
      </button>
    </div>
  );
}
