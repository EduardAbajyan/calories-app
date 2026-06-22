"use client";
import CaloriesTable from "@/components/dashboard/caloriesTable";
import Loading from "@/components/loading";
import { use, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

// Helpers use UTC midnight so client and server always agree on day boundaries
function getUTCToday(): Date {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
}

function formatAsDateInputValue(utcDate: Date) {
  const year = utcDate.getUTCFullYear();
  const month = String(utcDate.getUTCMonth() + 1).padStart(2, "0");
  const day = String(utcDate.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDateInputValue(value: string) {
  const [y, m, d] = value.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date;
}

function getDateFromOffset(offset: number, utcToday: Date) {
  const date = new Date(utcToday.getTime() - offset * MS_PER_DAY);
  return date;
}

function getOffsetFromDate(value: string, utcToday: Date) {
  const selected = parseDateInputValue(value);
  const diff = utcToday.getTime() - selected.getTime();
  return Math.max(0, Math.floor(diff / MS_PER_DAY));
}

function parseDayOffset(value?: string): number {
  if (!value || !/^\d+$/.test(value)) return 0;

  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) || parsed < 0 ? 0 : parsed;
}

export default function Table({
  params,
}: {
  params: Promise<{ day?: string[] }>;
}) {
  const router = useRouter();
  const today = useMemo(() => getUTCToday(), []);
  const maxDate = formatAsDateInputValue(today); // Today in YYYY-MM-DD (UTC)
  const minDate = formatAsDateInputValue(
    new Date(today.getTime() - 90 * MS_PER_DAY),
  );

  const paramsResolved = use(params);
  const routeValue = paramsResolved.day ? paramsResolved.day[0] : undefined;
  const routeOffset = parseDayOffset(routeValue);

  const [dayOffset, setDayOffset] = useState(routeOffset);
  const [selectedDate, setSelectedDate] = useState(
    formatAsDateInputValue(getDateFromOffset(routeOffset, today)),
  );
  const [isChangingDate, setIsChangingDate] = useState(false);

  useEffect(() => {
    const nextOffset = parseDayOffset(routeValue);
    setDayOffset(nextOffset);
    setSelectedDate(
      formatAsDateInputValue(getDateFromOffset(nextOffset, today)),
    );
  }, [routeValue, today]);

  return (
    <div className="relative min-w-full md:min-w-full max-w-full md:max-w-full space-y-6">
      <div className="overflow-hidden rounded-4xl border border-border/70 bg-[radial-gradient(circle_at_top_left,var(--color-accent-soft),transparent_36%),linear-gradient(180deg,var(--color-surface)_0%,var(--color-surface-elevated)_100%)] shadow-[0_24px_70px_rgba(0,0,0,0.14)] backdrop-blur-xl px-0 py-8 sm:p-8">
        <div className="min-w-full max-w-full   space-y-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="mb-3 inline-flex rounded-full border border-border bg-surface/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-accent shadow-sm">
                Daily log
              </p>
              <div className="flex items-center gap-3">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-surface/80 shadow-sm">
                  <svg
                    className="h-7 w-7"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <rect
                      x="9"
                      y="2"
                      width="6"
                      height="20"
                      rx="3"
                      fill="url(#verticalGradient)"
                    />
                    <rect
                      x="2"
                      y="9"
                      width="20"
                      height="6"
                      rx="3"
                      fill="url(#horizontalGradient)"
                    />
                    <defs>
                      <linearGradient
                        id="verticalGradient"
                        x1="0%"
                        y1="0%"
                        x2="0%"
                        y2="100%"
                      >
                        <stop offset="0%" stopColor="#3B82F6" />
                        <stop offset="100%" stopColor="#10B981" />
                      </linearGradient>
                      <linearGradient
                        id="horizontalGradient"
                        x1="0%"
                        y1="0%"
                        x2="100%"
                        y2="0%"
                      >
                        <stop offset="0%" stopColor="#10B981" />
                        <stop offset="100%" stopColor="#3B82F6" />
                      </linearGradient>
                    </defs>
                  </svg>
                </span>
                <div>
                  <h3 className="text-2xl font-semibold tracking-tight text-foreground">
                    Welcome to your calorie tracker
                  </h3>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-foreground/70">
                    Review a specific day, log meals, and compare entries
                    without leaving the dashboard.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-border bg-surface/85 p-5 shadow-sm lg:w-84">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
                <svg
                  className="h-5 w-5 text-accent"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <label htmlFor="date">Select a date</label>
              </div>

              <form action="" className="space-y-4">
                <input
                  type="date"
                  name="date"
                  id="date"
                  className="mx-auto block w-11/12 min-w-0 max-w-full appearance-none overflow-hidden rounded-2xl border border-border bg-surface-elevated px-4 py-3 text-center text-base font-medium text-foreground shadow-sm outline-none transition focus:border-accent focus:ring-4 focus:ring-accent-soft sm:w-full sm:text-sm"
                  min={minDate}
                  max={maxDate}
                  value={selectedDate}
                  onChange={(e) => {
                    e.target.disabled = true;
                    const nextDate = e.target.value;
                    setIsChangingDate(true);
                    setSelectedDate(nextDate);

                    const nextDayOffset = getOffsetFromDate(nextDate, today);
                    setDayOffset(nextDayOffset);
                    router.push(
                      nextDayOffset === 0
                        ? "/dashboard"
                        : `/dashboard/${nextDayOffset}`,
                    );
                  }}
                />

                <p className="flex items-center gap-2 text-sm leading-6 text-foreground/65">
                  <svg
                    className="h-4 w-4 shrink-0 text-accent"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Data is available for the last 3 months.
                </p>
              </form>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-border bg-surface/75 px-4 py-3 shadow-sm">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">
                Current view
              </p>
              <p className="mt-2 text-lg font-semibold text-foreground">
                {dayOffset === 0
                  ? "Today"
                  : `${dayOffset} day${dayOffset === 1 ? "" : "s"} ago`}
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-surface/75 px-4 py-3 shadow-sm">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">
                Selected date
              </p>
              <p className="mt-2 text-lg font-semibold text-foreground">
                {selectedDate}
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-surface/75 px-4 py-3 shadow-sm">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">
                Window
              </p>
              <p className="mt-2 text-lg font-semibold text-foreground">
                90 days
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-[28px] border border-border/70 bg-surface/80 shadow-[0_24px_70px_rgba(0,0,0,0.14)] backdrop-blur-xl">
        {isChangingDate && <Loading />}
        <div className={isChangingDate ? "hidden" : undefined}>
          <CaloriesTable
            day={dayOffset}
            onDayLoad={() => setIsChangingDate(false)}
          />
        </div>
      </div>
    </div>
  );
}
