"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function getDayNumberFromDate(date: Date): number {
  return Math.floor(date.getTime() / MS_PER_DAY);
}

function getUTCStartOfDay(dayOffset = 0): Date {
  const now = new Date();
  const utcToday = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );

  if (!dayOffset) return utcToday;
  return new Date(utcToday.getTime() - dayOffset * MS_PER_DAY);
}

async function getOrCreateUserDay(userId: string, dayStart: Date) {
  const dayNumber = getDayNumberFromDate(dayStart);
  const dayEnd = new Date(dayStart.getTime() + MS_PER_DAY);

  console.log("getOrCreateUserDay", {
    userId,
    dayStart: dayStart.toISOString(),
    dayNumber,
    dayEnd: dayEnd.toISOString(),
  });
  // First look for any existing row within the same calendar day (handles
  // legacy rows stored with a different time component).
  const existing = await prisma.userDaysList.findFirst({
    where: {
      userId,
      date: { gte: dayStart, lt: dayEnd },
    },
    orderBy: { id: "desc" },
  });

  console.log("existing user day record:", JSON.stringify(existing, null, 2));

  if (existing) return existing;

  // No row yet — create one with the canonical UTC midnight date.
  try {
    return await prisma.userDaysList.create({
      data: { userId, dayNumber, date: dayStart },
    });
  } catch (error: unknown) {
    // Guard against a race condition where another request created the row
    // between our findFirst and create.
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: string }).code === "P2002"
    ) {
      const race = await prisma.userDaysList.findFirst({
        where: { userId, date: { gte: dayStart, lt: dayEnd } },
        orderBy: { id: "desc" },
      });
      if (race) return race;
    }

    throw error;
  }
}

export interface DailyLogItem {
  id: number;
  name: string;
  amount: number;
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
}

export async function fetchChosenDate(day = 0): Promise<DailyLogItem[]> {
  console.log(`Fetching daily log of day ${day}...`);
  const session = await auth();

  if (!session) {
    redirect("/?mode=login");
  }
  try {
    const session = await auth();
    console.log("Session object:", JSON.stringify(session, null, 2));

    if (!session?.user?.id) {
      console.warn("User not authenticated. Returning empty daily log.");
      console.log("Session exists:", !!session);
      console.log("User exists:", !!session?.user);
      console.log("User ID exists:", !!session?.user?.id);
      return [];
    }
    console.log("Authenticated user ID:", session.user.id);
    const dayStart = getUTCStartOfDay(day);

    // Create or get the day record atomically, with fallback for legacy unique key collisions.
    const userDay = await getOrCreateUserDay(session.user.id, dayStart);

    console.log(`/n/n/n/n/n/n`);
    console.log("dayStart (UTC):", dayStart.toISOString());
    console.log("dayStart (local):", dayStart.toString());
    console.log("userDay record:", JSON.stringify(userDay, null, 2));
    console.log(`/n/n/n/n/n/n`);

    // Get today's daily logs with related food/dish data
    const logs = await prisma.dailyLog.findMany({
      where: {
        use_day_id: userDay.id,
      },
      include: {
        food: true,
        dish: {
          include: {
            ingredients: {
              include: {
                food: true,
              },
            },
          },
        },
      },
    });

    // Transform the data into the format expected by the component
    const dailyLogItems: DailyLogItem[] = logs.map((log) => {
      if (log.food) {
        // Direct food logging
        return {
          id: log.id,
          name: log.food.name,
          amount: log.amount,
          calories: Math.round((log.food.calories * log.amount) / 100), // Assuming calories per 100g
          protein: Math.round((log.food.protein * log.amount) / 100),
          carbohydrates: Math.round(
            (log.food.carbohydrates * log.amount) / 100,
          ),
          fat: Math.round((log.food.fat * log.amount) / 100),
        };
      } else if (log.dish) {
        // Dish logging - calculate total calories from ingredients
        const totalCalories = log.dish.ingredients.reduce(
          (total, ingredient) => {
            return total + (ingredient.food.calories * ingredient.amount) / 100;
          },
          0,
        );
        const totalProtein = log.dish.ingredients.reduce(
          (total, ingredient) => {
            return total + (ingredient.food.protein * ingredient.amount) / 100;
          },
          0,
        );
        const totalCarbohydrates = log.dish.ingredients.reduce(
          (total, ingredient) => {
            return (
              total + (ingredient.food.carbohydrates * ingredient.amount) / 100
            );
          },
          0,
        );
        const totalFat = log.dish.ingredients.reduce((total, ingredient) => {
          return total + (ingredient.food.fat * ingredient.amount) / 100;
        }, 0);

        return {
          id: log.id,
          name: log.dish.name,
          amount: log.amount,
          calories: Math.round(totalCalories * log.amount),
          protein: Math.round(totalProtein * log.amount),
          carbohydrates: Math.round(totalCarbohydrates * log.amount),
          fat: Math.round(totalFat * log.amount),
        };
      } else {
        // Fallback case
        return {
          id: log.id,
          name: "Unknown item",
          amount: log.amount,
          calories: 0,
          protein: 0,
          carbohydrates: 0,
          fat: 0,
        };
      }
    });

    return dailyLogItems;
  } catch (error) {
    console.error("Error fetching today's daily log:", error);
    return [];
  }
}

export async function addDailyLogItem(
  data: {
    name: string;
    amount: number;
    calories: number;
    protein: number;
    carbohydrates: number;
    fat: number;
  },
  day = 0,
): Promise<{ success: boolean; error?: string }> {
  console.log("Adding item to daily log:", data);
  try {
    const session = await auth();
    console.log("Add item session:", JSON.stringify(session, null, 2));

    if (!session?.user?.id) {
      console.warn("User not authenticated for adding item");
      return { success: false, error: "Not authenticated" };
    }

    if (data.amount <= 0) {
      return { success: false, error: "Amount must be greater than zero" };
    }

    // For now, we'll create a basic food item and log it
    // In a real app, you might want to search existing foods first
    const food = await prisma.food.create({
      data: {
        name: data.name,
        calories: Math.round((data.calories * 100) / data.amount), // Convert to calories per 100g
        protein: Math.round((data.protein * 100) / data.amount),
        carbohydrates: Math.round((data.carbohydrates * 100) / data.amount),
        fat: Math.round((data.fat * 100) / data.amount),
      },
    });

    const dayStart = getUTCStartOfDay(day);

    const userDay = await getOrCreateUserDay(session.user.id, dayStart);

    // Create the daily log entry
    await prisma.dailyLog.create({
      data: {
        use_day_id: userDay.id,
        foodId: food.id,
        amount: data.amount,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error adding daily log item:", error);
    return { success: false, error: "Failed to add item" };
  }
}

export async function deleteDailyLogItem(
  logId: number,
): Promise<{ success: boolean }> {
  console.log("Deleting daily log item with ID:", logId);
  try {
    const session = await auth();
    console.log("Delete item session:", JSON.stringify(session, null, 2));

    if (!session?.user?.id) {
      console.warn("User not authenticated for deleting item");
      return { success: false };
    }

    // Verify the log belongs to the current user
    const log = await prisma.dailyLog.findFirst({
      where: {
        id: logId,
        day: {
          userId: session.user.id,
        },
      },
    });

    if (!log) {
      return { success: false };
    }

    await prisma.dailyLog.delete({
      where: { id: logId },
    });

    return { success: true };
  } catch (error) {
    console.error("Error deleting daily log item:", error);
    return { success: false };
  }
}
