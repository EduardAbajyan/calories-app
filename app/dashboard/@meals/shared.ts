import { revalidatePath } from "next/cache";
import type { Prisma } from "@prisma/client";

export type MealsSearchParams = {
  mealQ?: string;
  dishQ?: string;
  foodQ?: string;
  tzOffsetMin?: string;
  success?: string;
  error?: string;
};

export type MealMatch = {
  id: number;
  name: string;
  image: string | null;
  likes: number;
  dishes: { dishId: number }[];
};

export type DishMatch = {
  id: number;
  name: string;
  image: string | null;
  amount: number | null;
  ingredients: { id: number }[];
};

export type FoodMatch = {
  id: number;
  name: string;
  image: string | null;
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;

type UserDaysListClient = Pick<Prisma.TransactionClient, "userDaysList">;

function getDayNumberFromDate(date: Date): number {
  return Math.floor(date.getTime() / MS_PER_DAY);
}

export function parseTimezoneOffsetMinutes(value: unknown): number {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) return 0;
  if (!Number.isInteger(parsed)) return 0;
  if (parsed < -14 * 60 || parsed > 14 * 60) return 0;

  return parsed;
}

export function getUTCStartOfClientDay(dayOffset = 0, tzOffsetMin = 0): Date {
  const now = Date.now();
  const localNowMs = now - tzOffsetMin * 60 * 1000;
  const localDayStartMs = Math.floor(localNowMs / MS_PER_DAY) * MS_PER_DAY;
  const targetLocalDayStartMs = localDayStartMs - dayOffset * MS_PER_DAY;
  const utcMs = targetLocalDayStartMs + tzOffsetMin * 60 * 1000;

  return new Date(utcMs);
}

export function parseDayOffset(value?: string): number {
  if (!value || !/^\d+$/.test(value)) return 0;

  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) || parsed < 0 ? 0 : parsed;
}

export function formatDateDisplayForOffset(
  date: Date,
  tzOffsetMin: number,
): string {
  const shifted = new Date(date.getTime() - tzOffsetMin * 60 * 1000);

  return shifted.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

export async function getOrCreateUserDayWithClient(
  userId: string,
  dayStart: Date,
  db: UserDaysListClient,
) {
  const dayNumber = getDayNumberFromDate(dayStart);
  const dayEnd = new Date(dayStart.getTime() + MS_PER_DAY);

  const existingByDayNumber = await db.userDaysList.findUnique({
    where: {
      userId_dayNumber: {
        userId,
        dayNumber,
      },
    },
  });

  if (existingByDayNumber) return existingByDayNumber;

  const existing = await db.userDaysList.findFirst({
    where: {
      userId,
      date: { gte: dayStart, lt: dayEnd },
    },
    orderBy: { id: "desc" },
  });

  if (existing) return existing;

  try {
    return await db.userDaysList.create({
      data: { userId, dayNumber, date: dayStart },
    });
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: string }).code === "P2002"
    ) {
      const raceByDayNumber = await db.userDaysList.findUnique({
        where: {
          userId_dayNumber: {
            userId,
            dayNumber,
          },
        },
      });
      if (raceByDayNumber) return raceByDayNumber;

      const race = await db.userDaysList.findFirst({
        where: { userId, date: { gte: dayStart, lt: dayEnd } },
        orderBy: { id: "desc" },
      });
      if (race) return race;
    }

    throw error;
  }
}

export function buildDashboardHref(
  dayOffset: number,
  mealQ: string,
  dishQ: string,
  foodQ: string,
  tzOffsetMin: number,
  message: { success?: string; error?: string; refreshKey?: string },
) {
  const params = new URLSearchParams();

  if (mealQ) params.set("mealQ", mealQ);
  if (dishQ) params.set("dishQ", dishQ);
  if (foodQ) params.set("foodQ", foodQ);
  params.set("tzOffsetMin", String(tzOffsetMin));

  if (message.success) params.set("success", message.success);
  if (message.error) params.set("error", message.error);
  if (message.refreshKey) params.set("refreshKey", message.refreshKey);

  const query = params.toString();
  const basePath = dayOffset > 0 ? `/dashboard/${dayOffset}` : "/dashboard";
  return query ? `${basePath}?${query}` : basePath;
}

export function revalidateDashboardTable(dayOffset: number) {
  revalidatePath("/dashboard", "layout");

  if (dayOffset > 0) {
    revalidatePath(`/dashboard/${dayOffset}`, "layout");
  }
}

export function getRefreshKey() {
  return Date.now().toString();
}