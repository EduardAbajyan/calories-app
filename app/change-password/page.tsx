import { auth } from "@/auth";
import { redirect } from "next/navigation";
import ChangePasswordForm from "@/components/change-password-form";
import { buildMetadata } from "@/app/seo";

export const metadata = buildMetadata({
  title: "Change Password",
  description:
    "Update your account password to keep your CalorieCounter account secure.",
  path: "/change-password",
  noIndex: true,
});

export default async function ChangePasswordPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/?mode=login");
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top_left,var(--color-accent-soft),transparent_38%),radial-gradient(circle_at_top_right,var(--color-surface-strong),transparent_34%),linear-gradient(180deg,var(--color-background)_0%,var(--color-surface-elevated)_100%)] p-4 sm:p-8">
      <div className="relative mx-auto flex w-full max-w-md flex-col gap-6 rounded-[28px] border border-border/70 bg-surface/75 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.14)] backdrop-blur-xl sm:p-8">
        <div>
          <p className="mb-2 inline-flex rounded-full border border-border bg-surface-elevated px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-accent">
            Account security
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Change password
          </h1>
        </div>
        <ChangePasswordForm />
      </div>
    </main>
  );
}
