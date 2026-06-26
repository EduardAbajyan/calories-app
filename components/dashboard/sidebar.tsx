"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { signOutAction } from "./sidebar-actions";
import Link from "next/link";

export default function DashboardSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    setPendingHref(null);
  }, [pathname]);

  function handleNavClick(href: string) {
    setPendingHref(href);
    setIsOpen(false);
  }

  const linkClassName = (href: string) => {
    const isPending = pendingHref === href;

    return `group flex items-center rounded-2xl border border-transparent px-3 py-2 text-foreground transition hover:border-border hover:bg-surface-elevated hover:text-accent ${
      isPending ? "pointer-events-none opacity-60" : ""
    }`;
  };

  return (
    <>
      <button
        type="button"
        aria-controls="default-sidebar"
        aria-expanded={isOpen}
        aria-label={isOpen ? "Close sidebar" : "Open sidebar"}
        onClick={() => setIsOpen((current) => !current)}
        className="fixed right-8 top-8 z-50 inline-flex items-center justify-center rounded-2xl border border-border bg-surface/90 p-3 text-foreground shadow-lg backdrop-blur-xl transition hover:bg-surface-elevated md:hidden"
      >
        <span className="sr-only">Toggle sidebar</span>
        <svg
          className="h-6 w-6"
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
            strokeWidth="2"
            d={isOpen ? "M6 6l12 12M18 6 6 18" : "M5 7h14M5 12h14M5 17h10"}
          />
        </svg>
      </button>

      {isOpen ? (
        <button
          type="button"
          aria-label="Close sidebar backdrop"
          className="fixed inset-0 z-40 cursor-default bg-black/30 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      ) : null}

      <aside
        id="default-sidebar"
        className={`fixed left-0 top-0 z-40 h-screen w-screen max-w-full transition-transform duration-300 ease-out md:w-64 md:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
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
                aria-disabled={pendingHref === "/dashboard"}
                onClick={() => handleNavClick("/dashboard")}
                className={linkClassName("/dashboard")}
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
                aria-disabled={pendingHref === "/dashboard/1"}
                onClick={() => handleNavClick("/dashboard/1")}
                className={linkClassName("/dashboard/1")}
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
                aria-disabled={pendingHref === "/add-meal"}
                onClick={() => handleNavClick("/add-meal")}
                className={linkClassName("/add-meal")}
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
                aria-disabled={pendingHref === "/add-dish"}
                onClick={() => handleNavClick("/add-dish")}
                className={linkClassName("/add-dish")}
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
                aria-disabled={pendingHref === "/add-food"}
                onClick={() => handleNavClick("/add-food")}
                className={linkClassName("/add-food")}
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
                aria-disabled={pendingHref === "/liked-meals"}
                onClick={() => handleNavClick("/liked-meals")}
                className={linkClassName("/liked-meals")}
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
              <Link
                href="/change-password"
                aria-disabled={pendingHref === "/change-password"}
                onClick={() => handleNavClick("/change-password")}
                className={linkClassName("/change-password")}
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
                    d="M12 8V5a3 3 0 0 0-6 0v3m-2 0h10a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2Zm5 5a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z"
                  />
                </svg>
                <span className="ms-3">Change password</span>
              </Link>
            </li>

            <li>
              <Link
                href="/dishes"
                aria-disabled={pendingHref === "/dishes"}
                onClick={() => handleNavClick("/dishes")}
                className={linkClassName("/dishes")}
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
                    d="M3 7h18M6 7v10a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7"
                  />
                </svg>
                <span className="ms-3">Dishes</span>
              </Link>
            </li>

            <li>
              <form action={signOutAction}>
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
    </>
  );
}
