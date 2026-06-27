"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useAuthPending } from "@/components/auth-pending-context";
import Image from "next/image";

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
    <div className="w-full flex flex-col items-center gap-3">
      <button
        type="button"
        disabled={disableButton}
        onClick={handleSignIn}
        className="w-full max-w-100 flex items-center justify-center gap-2 px-5 py-4 border border-black/65 rounded-lg bg-transparent hover:bg-[#34A853]/15 transition disabled:cursor-not-allowed disabled:opacity-70"
      >
        <Image src="/google.svg" alt="Google logo" width={20} height={20} />
        <span>{disableButton ? "Signing in..." : "Sign in with Google"}</span>
      </button>
    </div>
  );
}
