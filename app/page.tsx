import Image from "next/image";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

import styles from "./page.module.css";
import logo from "./assets/logo.png";

import GoogleSingIn from "@/components/google-sign-in-button";
import AuthForm from "@/components/credentials-sign-in-form";
import { AuthPendingProvider } from "@/components/auth-pending-context";

export default async function Home({
  searchParams,
}: {
  searchParams: { mode?: "login" | "signup" };
}) {
  const session = await auth();
  if (!session) {
    const Params = await searchParams;
    const mode = Params.mode ?? "login";
    return (
      <div className={styles.container}>
        <Image src={logo} alt="logo" width={315} height={270} loading="eager" />
        <AuthPendingProvider>
          <GoogleSingIn />
          <AuthForm mode={mode} />
        </AuthPendingProvider>
      </div>
    );
  } else {
    return redirect("/dashboard");
  }
}
