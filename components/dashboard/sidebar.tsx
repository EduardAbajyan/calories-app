"use server";
import { signOut } from "@/auth";
import Link from "next/link";

export default async function DashboardSidebar() {
  async function handleSignOut() {
    "use server";
    return await signOut({ redirectTo: "/" });
  }
  return (
    <aside
      id="default-sidebar"
      className="fixed left-0 top-0 z-40 h-full w-64 -translate-x-full transition-transform sm:translate-x-0"
      aria-label="Sidebar"
    >
      <div className="h-full overflow-y-auto border-e border-border bg-[radial-gradient(circle_at_top_left,var(--color-accent-soft),transparent_38%),linear-gradient(180deg,var(--color-surface)_0%,var(--color-surface-elevated)_100%)] px-3 py-4 backdrop-blur-xl">
        <div className="mb-4 rounded-3xl border border-border bg-surface/80 px-4 py-4 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-accent">
            Meal tracker
          </p>
          <p className="mt-2 text-sm leading-6 text-foreground/70">
            Navigate your daily logs and meal construction screens.
          </p>
        </div>

        <ul className="space-y-2 font-medium">
          <li>
            <Link
              href="/dashboard"
              className="group flex items-center rounded-2xl border border-transparent px-3 py-2 text-foreground transition hover:border-border hover:bg-surface-elevated hover:text-accent"
            >
              <svg
                className="h-5 w-6 shrink-0 transition duration-75 group-hover:text-accent"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                fill="none"
                viewBox="0 0 24 24"
              >
                <path
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M5 7h14M5 12h14M5 17h10"
                />
              </svg>
              <span className="ms-3">Today&apos;s list</span>
            </Link>
          </li>
          <li>
            <Link
              href="/dashboard/1"
              className="group flex items-center rounded-2xl border border-transparent px-3 py-2 text-foreground transition hover:border-border hover:bg-surface-elevated hover:text-accent"
            >
              <svg
                className="h-5 w-5 shrink-0 transition duration-75 group-hover:text-accent"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                fill="none"
                viewBox="0 0 24 24"
              >
                <path
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M5 7h14M5 12h14M5 17h10"
                />
              </svg>
              <span className="ms-3">Yesterday&apos;s list</span>
            </Link>
          </li>

          <li>
            <Link
              href="/add-meal"
              className="group flex items-center rounded-2xl border border-transparent px-3 py-2 text-foreground transition hover:border-border hover:bg-surface-elevated hover:text-accent"
            >
              <svg
                className="h-5 w-5 shrink-0 transition duration-75 group-hover:text-accent"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                fill="none"
                viewBox="0 0 24 24"
              >
                <path
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M5 12h14m-7 7V5"
                />
              </svg>
              <span className="ms-3">Add meal</span>
            </Link>
          </li>

          <li>
            <Link
              href="/add-dish"
              className="group flex items-center rounded-2xl border border-transparent px-3 py-2 text-foreground transition hover:border-border hover:bg-surface-elevated hover:text-accent"
            >
              <svg
                className="h-5 w-5 shrink-0 transition duration-75 group-hover:text-accent"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                fill="none"
                viewBox="0 0 24 24"
              >
                <path
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M5 12h14m-7 7V5"
                />
              </svg>
              <span className="ms-3">Add dish</span>
            </Link>
          </li>

          <li>
            <Link
              href="/add-food"
              className="group flex items-center rounded-2xl border border-transparent px-3 py-2 text-foreground transition hover:border-border hover:bg-surface-elevated hover:text-accent"
            >
              <svg
                className="h-5 w-5 shrink-0 transition duration-75 group-hover:text-accent"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                fill="none"
                viewBox="0 0 24 24"
              >
                <path
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M5 12h14m-7 7V5"
                />
              </svg>
              <span className="ms-3">Add food</span>
            </Link>
          </li>

          <li>
            <Link
              href="/liked-meals"
              className="group flex items-center rounded-2xl border border-transparent px-3 py-2 text-foreground transition hover:border-border hover:bg-surface-elevated hover:text-accent"
            >
              <svg
                className="h-5 w-5 shrink-0 transition duration-75 group-hover:text-accent"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                fill="none"
                viewBox="0 0 24 24"
              >
                <path
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 21s-7-4.35-7-10a4 4 0 0 1 7-2.646A4 4 0 0 1 19 11c0 5.65-7 10-7 10Z"
                />
              </svg>
              <span className="ms-3">Liked meals</span>
            </Link>
          </li>

          <li>
            <form action={handleSignOut}>
              <button
                type="submit"
                className="group flex w-full cursor-pointer items-center gap-3 rounded-2xl border border-transparent px-3 py-2 text-foreground transition hover:border-border hover:bg-surface-elevated hover:text-accent"
              >
                <svg
                  className="h-5 w-5 shrink-0 transition duration-75 group-hover:text-accent"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M8 12h12m-12 0 4-4m-4 4 4 4m-3-12H9a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h2"
                  />
                </svg>
                <span className="whitespace-nowrap">Sign Out</span>
              </button>
            </form>
          </li>
        </ul>
      </div>
    </aside>
  );
}
