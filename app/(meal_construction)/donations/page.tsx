import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import TemporalMessage from "@/components/temporal-message";

export const metadata = {
  title: "Donations",
};

type DonationsSearchParams = {
  success?: string;
};

export default async function DonationsPage({
  searchParams,
}: {
  searchParams: Promise<DonationsSearchParams>;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/?mode=login");
  }

  const params = await searchParams;
  const isSuccess = params.success === "1";

  async function submitDonation(formData: FormData) {
    "use server";

    const activeSession = await auth();
    if (!activeSession?.user?.id) {
      redirect("/?mode=login");
    }

    const cardNumber = String(formData.get("cardNumber") ?? "").trim();
    const cardholderName = String(formData.get("cardholderName") ?? "").trim();
    const expirationMonth = String(formData.get("expirationMonth") ?? "").trim();
    const expirationYear = String(formData.get("expirationYear") ?? "").trim();
    const cvv = String(formData.get("cvv") ?? "").trim();
    const amount = Number(formData.get("amount") ?? 0);
    const currency = String(formData.get("currency") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();

    const hasMissingFields =
      !cardNumber ||
      !cardholderName ||
      !expirationMonth ||
      !expirationYear ||
      !cvv ||
      !currency ||
      !email ||
      !Number.isFinite(amount) ||
      amount <= 0;

    if (hasMissingFields) {
      redirect("/donations");
    }

    redirect("/donations?success=1");
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,var(--color-accent-soft),transparent_38%),radial-gradient(circle_at_top_right,var(--color-surface-strong),transparent_34%),linear-gradient(180deg,var(--color-background)_0%,var(--color-surface-elevated)_100%)] p-4 sm:p-8">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 rounded-[28px] border border-border/70 bg-surface/75 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.14)] backdrop-blur-xl sm:p-8">
        <div className="flex flex-col gap-3">
          <p className="inline-flex w-fit rounded-full border border-border bg-surface-elevated px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-accent">
            Support project
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Donations
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-foreground/70">
            Complete the donation form to support future features and
            maintenance. All fields below are required.
          </p>
        </div>

        {isSuccess ? (
          <TemporalMessage
            className="rounded-2xl border border-success/20 bg-success-soft px-4 py-3 text-sm font-medium text-success shadow-sm"
            message="Thank you. Your donation request has been submitted."
          />
        ) : null}

        <form action={submitDonation} className="grid gap-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="grid gap-2 text-sm text-foreground/80 sm:col-span-2">
              Card Number
              <input
                name="cardNumber"
                type="text"
                inputMode="numeric"
                autoComplete="cc-number"
                placeholder="1234 5678 9012 3456"
                required
                className="h-11 rounded-2xl border border-border bg-surface-elevated px-4 text-sm text-foreground outline-none transition focus:border-accent"
              />
            </label>

            <label className="grid gap-2 text-sm text-foreground/80 sm:col-span-2">
              Cardholder Name
              <input
                name="cardholderName"
                type="text"
                autoComplete="cc-name"
                placeholder="Jane Doe"
                required
                className="h-11 rounded-2xl border border-border bg-surface-elevated px-4 text-sm text-foreground outline-none transition focus:border-accent"
              />
            </label>

            <label className="grid gap-2 text-sm text-foreground/80">
              Expiration Month
              <input
                name="expirationMonth"
                type="number"
                min="1"
                max="12"
                placeholder="MM"
                required
                className="h-11 rounded-2xl border border-border bg-surface-elevated px-4 text-sm text-foreground outline-none transition focus:border-accent"
              />
            </label>

            <label className="grid gap-2 text-sm text-foreground/80">
              Expiration Year
              <input
                name="expirationYear"
                type="number"
                min="2026"
                max="2100"
                placeholder="YYYY"
                required
                className="h-11 rounded-2xl border border-border bg-surface-elevated px-4 text-sm text-foreground outline-none transition focus:border-accent"
              />
            </label>

            <label className="grid gap-2 text-sm text-foreground/80">
              CVV
              <input
                name="cvv"
                type="password"
                inputMode="numeric"
                autoComplete="cc-csc"
                placeholder="123"
                required
                className="h-11 rounded-2xl border border-border bg-surface-elevated px-4 text-sm text-foreground outline-none transition focus:border-accent"
              />
            </label>

            <label className="grid gap-2 text-sm text-foreground/80">
              Donation Amount
              <input
                name="amount"
                type="number"
                min="1"
                step="0.01"
                placeholder="10"
                required
                className="h-11 rounded-2xl border border-border bg-surface-elevated px-4 text-sm text-foreground outline-none transition focus:border-accent"
              />
            </label>

            <label className="grid gap-2 text-sm text-foreground/80">
              Currency
              <select
                name="currency"
                defaultValue="USD"
                required
                className="h-11 rounded-2xl border border-border bg-surface-elevated px-4 text-sm text-foreground outline-none transition focus:border-accent"
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="CAD">CAD</option>
              </select>
            </label>

            <label className="grid gap-2 text-sm text-foreground/80 sm:col-span-2">
              Email
              <input
                name="email"
                type="email"
                autoComplete="email"
                defaultValue={session.user.email ?? ""}
                placeholder="you@example.com"
                required
                className="h-11 rounded-2xl border border-border bg-surface-elevated px-4 text-sm text-foreground outline-none transition focus:border-accent"
              />
            </label>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              className="inline-flex items-center rounded-full border border-border bg-surface-elevated px-5 py-2.5 text-sm font-medium text-foreground transition hover:border-accent hover:text-accent"
            >
              Submit donation
            </button>
            <Link
              href="/dashboard"
              className="inline-flex items-center rounded-full border border-border bg-surface px-5 py-2.5 text-sm font-medium text-foreground/80 transition hover:border-accent hover:text-accent"
            >
              Back to dashboard
            </Link>
          </div>
        </form>

      </div>
    </main>
  );
}
