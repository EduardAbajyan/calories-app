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
    <div className="min-w-full space-y-6">
      {/* Welcome Header Card */}
      <div className="bg-neutral-primary-soft border border-default rounded-lg shadow-lg p-6">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-3">
            {/* Medical Cross Icon - Calorie Counter Logo Style */}
            <svg
              className="w-10 h-10"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Vertical bar - gradient from blue to green */}
              <rect
                x="9"
                y="2"
                width="6"
                height="20"
                rx="3"
                fill="url(#verticalGradient)"
              />
              {/* Horizontal bar - gradient from green to blue */}
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
            <h3 className="text-2xl font-bold text-body">
              Welcome to Your Calorie Tracker
            </h3>
          </div>

          {/* Date Selection Card */}
          <div className="bg-background border border-default rounded-lg p-6 shadow-sm">
            <form action="" className="space-y-4">
              <div className="flex items-center justify-center space-x-2 mb-3">
                <svg
                  className="w-5 h-5 text-fg-brand"
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
                <label
                  htmlFor="date"
                  className="text-lg font-semibold text-body"
                >
                  Select a Date
                </label>
              </div>

              <div className="max-w-xs mx-auto">
                <input
                  type="date"
                  name="date"
                  id="date"
                  className="w-full px-4 py-3 border border-default rounded-lg bg-neutral-primary-soft text-body text-center font-medium shadow-sm hover:shadow-md transition-all duration-200 focus:ring-2 focus:ring-fg-brand focus:border-fg-brand focus:shadow-lg"
                  min={minDate}
                  max={maxDate}
                  value={selectedDate}
                  onChange={(e) => {
                    e.target.disabled = true; // Prevent multiple rapid changes
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
              </div>

              <p className="text-sm text-body opacity-70 flex items-center justify-center space-x-1">
                <svg
                  className="w-4 h-4"
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
                <span>Data available for the last 3 months only</span>
              </p>
            </form>
          </div>
        </div>
      </div>

      <div className="bg-neutral-primary-soft border border-default rounded-lg shadow-lg">
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
