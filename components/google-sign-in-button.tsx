"use client"; // Ensure this is a client component
import { signIn } from "next-auth/react";

export default function SignInButton() {
  function handleSignIn() {
    // NextAuth v5: callbacks must be defined in auth config, not passed to signIn()
    signIn("google");
  }

  return (
    <div className="w-full px-5 flex flex-col items-center gap-4">
      <button
        onClick={handleSignIn}
        className="w-full max-w-100 flex items-center justify-center gap-2 p-5 border rounded-lg bg-transparent hover:bg-[#34A853]/15 transition"
      >
        <img
          src="https://authjs.dev/img/providers/google.svg"
          alt="Google logo"
          width={20}
        />
        <span>Sign in with Google</span>
      </button>
    </div>
  );
}
