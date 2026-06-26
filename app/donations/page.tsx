import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export const metadata = {
  title: "Donations",
};

const donationOptions = [
  {
    title: "Buy one coffee",
    amount: "$5",
    description: "Help cover hosting and database costs for a day.",
  },
  {
    title: "Support one week",
    amount: "$15",
    description: "Keep feature development moving with steady support.",
  },
  {
    title: "Champion tier",
    amount: "$30",
    description: "Fund major UX and performance improvements.",
  },
] as const;

export default async function DonationsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/?mode=login");
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,var(--color-accent-soft),transparent_38%),radial-gradient(circle_at_top_right,var(--color-surface-strong),transparent_34%),linear-gradient(180deg,var(--color-background)_0%,var(--color-surface-elevated)_100%)] p-4 sm:p-8">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 rounded-[28px] border border-border/70 bg-surface/75 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.14)] backdrop-blur-xl sm:p-8">
        <div className="flex flex-col gap-3">
          <p className="inline-flex w-fit rounded-full border border-border bg-surface-elevated px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-accent">
            Support project
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Donations
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-foreground/70">
            If this calories tracker helps your routine, you can support future
            improvements. Choose an amount and contact us to proceed with your
            preferred payment method.
          </p>
        </div>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {donationOptions.map((option) => (
            <article
              key={option.title}
              className="flex flex-col gap-3 rounded-3xl border border-border/70 bg-surface-elevated/70 p-5"
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-accent">
                {option.amount}
              </p>
              <h2 className="text-lg font-semibold text-foreground">{option.title}</h2>
              <p className="text-sm leading-6 text-foreground/70">{option.description}</p>
            </article>
          ))}
        </section>

        <div className="flex flex-wrap gap-3">
          <Link
            href="mailto:support@mealtracker.app?subject=Donation%20for%20Meal%20Tracker"
            className="inline-flex items-center rounded-full border border-border bg-surface-elevated px-5 py-2.5 text-sm font-medium text-foreground transition hover:border-accent hover:text-accent"
          >
            Contact for donation
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center rounded-full border border-border bg-surface px-5 py-2.5 text-sm font-medium text-foreground/80 transition hover:border-accent hover:text-accent"
          >
            Back to dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
