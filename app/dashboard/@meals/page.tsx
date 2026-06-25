import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { logMealsDashboardError } from "@/app/dashboard/@meals/logging";
import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import TemporalMessage from "../../../components/temporal-message";
import FormSubmitButton from "../../../components/form-submit-button";
import TimezoneOffsetInput from "@/components/timezone-offset-input";

type MealsSearchParams = {
  mealQ?: string;
  dishQ?: string;
  foodQ?: string;
  tzOffsetMin?: string;
  success?: string;
  error?: string;
};

type MealMatch = {
  id: number;
  name: string;
  image: string | null;
  likes: number;
  dishes: { dishId: number }[];
};

type DishMatch = {
  id: number;
  name: string;
  image: string | null;
  ingredients: { id: number }[];
};

type FoodMatch = {
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

function parseTimezoneOffsetMinutes(value: unknown): number {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) return 0;
  if (!Number.isInteger(parsed)) return 0;
  if (parsed < -14 * 60 || parsed > 14 * 60) return 0;

  return parsed;
}

function getUTCStartOfClientDay(dayOffset = 0, tzOffsetMin = 0): Date {
  const now = Date.now();
  const localNowMs = now - tzOffsetMin * 60 * 1000;
  const localDayStartMs = Math.floor(localNowMs / MS_PER_DAY) * MS_PER_DAY;
  const targetLocalDayStartMs = localDayStartMs - dayOffset * MS_PER_DAY;
  const utcMs = targetLocalDayStartMs + tzOffsetMin * 60 * 1000;

  return new Date(utcMs);
}

async function getOrCreateUserDayWithClient(
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

function buildDashboardHref(
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
  return query ? `/dashboard?${query}` : "/dashboard";
}

function revalidateDashboardTable() {
  revalidatePath("/dashboard", "layout");
}

function getRefreshKey() {
  return Date.now().toString();
}

export default async function MealsPage({
  searchParams,
}: {
  searchParams: Promise<MealsSearchParams>;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  const params = await searchParams;
  const mealQ = String(params.mealQ ?? "").trim();
  const dishQ = String(params.dishQ ?? "").trim();
  const foodQ = String(params.foodQ ?? "").trim();
  const success = params.success;
  const error = params.error;

  async function addFoodToToday(formData: FormData) {
    "use server";

    const activeSession = await auth();
    if (!activeSession?.user?.id) {
      redirect("/?mode=login");
    }

    const foodId = Number(formData.get("foodId"));
    const grams = Number(formData.get("amount") ?? 100);
    const nextMealQ = String(formData.get("mealQ") ?? "").trim();
    const nextDishQ = String(formData.get("dishQ") ?? "").trim();
    const nextFoodQ = String(formData.get("foodQ") ?? "").trim();
    const nextTzOffsetMin = parseTimezoneOffsetMinutes(
      formData.get("tzOffsetMin"),
    );

    if (!Number.isInteger(foodId) || foodId <= 0) {
      redirect(
        buildDashboardHref(nextMealQ, nextDishQ, nextFoodQ, nextTzOffsetMin, {
          error: "Invalid food",
        }),
      );
    }

    const safeAmount = Number.isFinite(grams)
      ? Math.max(1, Math.round(grams))
      : 100;

    try {
      await prisma.$transaction(async (tx) => {
        const dayStart = getUTCStartOfClientDay(0, nextTzOffsetMin);
        const userDay = await getOrCreateUserDayWithClient(
          activeSession.user.id,
          dayStart,
          tx,
        );

        await tx.dailyLog.create({
          data: {
            user_day_id: userDay.id,
            foodId,
            amount: safeAmount,
          },
        });
      });
    } catch (err) {
      logMealsDashboardError("Failed to add food to daily log", err, {
        userId: activeSession.user.id,
        foodId,
        amount: safeAmount,
        tzOffsetMin: nextTzOffsetMin,
      });
      redirect(
        buildDashboardHref(nextMealQ, nextDishQ, nextFoodQ, nextTzOffsetMin, {
          error: "Failed to add food",
        }),
      );
    }

    revalidateDashboardTable();
    redirect(
      buildDashboardHref(nextMealQ, nextDishQ, nextFoodQ, nextTzOffsetMin, {
        success: "food",
        refreshKey: getRefreshKey(),
      }),
    );
  }

  async function addDishToToday(formData: FormData) {
    "use server";

    const activeSession = await auth();
    if (!activeSession?.user?.id) {
      redirect("/?mode=login");
    }

    const dishId = Number(formData.get("dishId"));
    const servings = Number(formData.get("servings") ?? 1);
    const nextMealQ = String(formData.get("mealQ") ?? "").trim();
    const nextDishQ = String(formData.get("dishQ") ?? "").trim();
    const nextFoodQ = String(formData.get("foodQ") ?? "").trim();
    const nextTzOffsetMin = parseTimezoneOffsetMinutes(
      formData.get("tzOffsetMin"),
    );

    if (!Number.isInteger(dishId) || dishId <= 0) {
      redirect(
        buildDashboardHref(nextMealQ, nextDishQ, nextFoodQ, nextTzOffsetMin, {
          error: "Invalid dish",
        }),
      );
    }

    let dish: { id: number } | null;

    try {
      dish = await prisma.dish.findUnique({
        where: { id: dishId },
        select: { id: true },
      });
    } catch (err) {
      logMealsDashboardError("Failed to load dish before add", err, {
        userId: activeSession.user.id,
        dishId,
        tzOffsetMin: nextTzOffsetMin,
      });
      redirect(
        buildDashboardHref(nextMealQ, nextDishQ, nextFoodQ, nextTzOffsetMin, {
          error: "Failed to add dish",
        }),
      );
    }

    if (!dish) {
      redirect(
        buildDashboardHref(nextMealQ, nextDishQ, nextFoodQ, nextTzOffsetMin, {
          error: "Dish not found",
        }),
      );
    }

    const safeServings = Number.isFinite(servings)
      ? Math.max(1, Math.round(servings))
      : 1;

    try {
      await prisma.$transaction(async (tx) => {
        const dayStart = getUTCStartOfClientDay(0, nextTzOffsetMin);
        const userDay = await getOrCreateUserDayWithClient(
          activeSession.user.id,
          dayStart,
          tx,
        );

        await tx.dailyLog.create({
          data: {
            user_day_id: userDay.id,
            dishId,
            amount: safeServings,
          },
        });
      });
    } catch (err) {
      logMealsDashboardError("Failed to add dish to daily log", err, {
        userId: activeSession.user.id,
        dishId,
        amount: safeServings,
        tzOffsetMin: nextTzOffsetMin,
      });
      redirect(
        buildDashboardHref(nextMealQ, nextDishQ, nextFoodQ, nextTzOffsetMin, {
          error: "Failed to add dish",
        }),
      );
    }

    revalidateDashboardTable();
    redirect(
      buildDashboardHref(nextMealQ, nextDishQ, nextFoodQ, nextTzOffsetMin, {
        success: "dish",
        refreshKey: getRefreshKey(),
      }),
    );
  }

  async function addMealContentsToToday(formData: FormData) {
    "use server";

    const activeSession = await auth();
    if (!activeSession?.user?.id) {
      redirect("/?mode=login");
    }

    const mealId = Number(formData.get("mealId"));
    const nextMealQ = String(formData.get("mealQ") ?? "").trim();
    const nextDishQ = String(formData.get("dishQ") ?? "").trim();
    const nextFoodQ = String(formData.get("foodQ") ?? "").trim();
    const nextTzOffsetMin = parseTimezoneOffsetMinutes(
      formData.get("tzOffsetMin"),
    );

    if (!Number.isInteger(mealId) || mealId <= 0) {
      redirect(
        buildDashboardHref(nextMealQ, nextDishQ, nextFoodQ, nextTzOffsetMin, {
          error: "Invalid meal",
        }),
      );
    }

    let meal: { id: number; dishes: Array<{ dishId: number }> } | null;

    try {
      meal = await prisma.meal.findUnique({
        where: { id: mealId },
        select: {
          id: true,
          dishes: {
            select: {
              dishId: true,
            },
          },
        },
      });
    } catch (err) {
      logMealsDashboardError("Failed to load meal before add", err, {
        userId: activeSession.user.id,
        mealId,
        tzOffsetMin: nextTzOffsetMin,
      });
      redirect(
        buildDashboardHref(nextMealQ, nextDishQ, nextFoodQ, nextTzOffsetMin, {
          error: "Failed to add meal",
        }),
      );
    }

    if (!meal || meal.dishes.length === 0) {
      redirect(
        buildDashboardHref(nextMealQ, nextDishQ, nextFoodQ, nextTzOffsetMin, {
          error: "Meal has no dishes",
        }),
      );
    }

    try {
      await prisma.$transaction(async (tx) => {
        const dayStart = getUTCStartOfClientDay(0, nextTzOffsetMin);
        const userDay = await getOrCreateUserDayWithClient(
          activeSession.user.id,
          dayStart,
          tx,
        );

        await tx.dailyLog.createMany({
          data: meal.dishes.map((dish) => ({
            user_day_id: userDay.id,
            dishId: dish.dishId,
            amount: 1,
          })),
        });
      });
    } catch (err) {
      logMealsDashboardError("Failed to add meal contents to daily log", err, {
        userId: activeSession.user.id,
        mealId,
        tzOffsetMin: nextTzOffsetMin,
        dishCount: meal.dishes.length,
      });
      redirect(
        buildDashboardHref(nextMealQ, nextDishQ, nextFoodQ, nextTzOffsetMin, {
          error: "Failed to add meal",
        }),
      );
    }

    // Best-effort update: do not fail the add flow if this counter update fails.
    try {
      await prisma.usersBelovedMeals.updateMany({
        where: {
          userId: activeSession.user.id,
          mealId: meal.id,
        },
        data: {
          countsConsumed: {
            increment: 1,
          },
        },
      });
    } catch (error) {
      logMealsDashboardError("Failed to increment beloved meal consumption", error, {
        userId: activeSession.user.id,
        mealId: meal.id,
      });
    }

    revalidateDashboardTable();
    redirect(
      buildDashboardHref(nextMealQ, nextDishQ, nextFoodQ, nextTzOffsetMin, {
        success: "meal",
        refreshKey: getRefreshKey(),
      }),
    );
  }

  let mealMatches: MealMatch[] = [];
  let dishMatches: DishMatch[] = [];
  let foodMatches: FoodMatch[] = [];

  try {
    mealMatches = await prisma.meal.findMany({
      where: {
        name: {
          contains: mealQ,
          mode: "insensitive",
        },
      },
      orderBy: [{ likes: "desc" }, { id: "asc" }],
      take: 24,
      include: {
        dishes: {
          select: {
            dishId: true,
          },
        },
      },
    });
  } catch (err) {
    logMealsDashboardError("Failed to load meal matches", err, {
      userId: session.user.id,
      mealQ,
      tzOffsetMin: parseTimezoneOffsetMinutes(params.tzOffsetMin),
    });
  }

  try {
    dishMatches = await prisma.dish.findMany({
      where: {
        name: {
          contains: dishQ,
          mode: "insensitive",
        },
      },
      orderBy: [{ name: "asc" }, { id: "asc" }],
      take: 24,
      select: {
        id: true,
        name: true,
        image: true,
        ingredients: {
          select: {
            id: true,
          },
        },
      },
    });
  } catch (err) {
    logMealsDashboardError("Failed to load dish matches", err, {
      userId: session.user.id,
      dishQ,
      tzOffsetMin: parseTimezoneOffsetMinutes(params.tzOffsetMin),
    });
  }

  try {
    foodMatches = await prisma.food.findMany({
      where: {
        name: {
          contains: foodQ,
          mode: "insensitive",
        },
      },
      orderBy: [{ name: "asc" }, { id: "asc" }],
      take: 24,
      select: {
        id: true,
        name: true,
        image: true,
        calories: true,
        protein: true,
        carbohydrates: true,
        fat: true,
      },
    });
  } catch (err) {
    logMealsDashboardError("Failed to load food matches", err, {
      userId: session.user.id,
      foodQ,
      tzOffsetMin: parseTimezoneOffsetMinutes(params.tzOffsetMin),
    });
  }

  return (
    <section className="relative w-full rounded-[28px] border border-border/70 bg-surface/80 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.12)] backdrop-blur-xl">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <p className="mb-2 inline-flex rounded-full border border-border bg-surface-elevated px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-accent">
            Quick add
          </p>
          <h3 className="text-xl font-semibold tracking-tight text-foreground">
            Search meals, dishes, and foods
          </h3>
          <p className="mt-2 text-sm leading-6 text-foreground/70">
            Add selected foods, dishes, or full meal contents directly to
            today&apos;s daily log.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/add-meal"
            className="inline-flex items-center rounded-full border border-border bg-surface-elevated px-4 py-2 text-sm font-medium text-foreground shadow-sm transition hover:-translate-y-0.5 hover:border-border-strong hover:bg-surface"
          >
            Add meal
          </Link>
          <Link
            href="/liked-meals"
            className="inline-flex items-center rounded-full border border-border bg-surface-elevated px-4 py-2 text-sm font-medium text-foreground shadow-sm transition hover:-translate-y-0.5 hover:border-border-strong hover:bg-surface"
          >
            Liked meals
          </Link>
        </div>
      </div>

      {success ? (
        <TemporalMessage
          className="mb-4 rounded-2xl border border-success/20 bg-success-soft px-4 py-3 text-sm font-medium text-success shadow-sm"
          message={
            success === "meal"
              ? "Meal contents added to today."
              : success === "dish"
                ? "Dish added to today."
                : "Food added to today."
          }
        />
      ) : null}

      {error ? (
        <TemporalMessage
          className="mb-4 rounded-2xl border border-danger/20 bg-danger-soft px-4 py-3 text-sm font-medium text-danger shadow-sm"
          message={error}
        />
      ) : null}

      <div className="space-y-8">
        <div className="space-y-3">
          <div className="border-b-2 border-rose-300 pb-3">
            <h4 className="bg-linear-to-r from-rose-600 to-orange-500 bg-clip-text text-2xl font-bold text-transparent">
              Meals
            </h4>
          </div>
          <form method="get" action="/dashboard" className="space-y-2">
            <input type="hidden" name="dishQ" value={dishQ} />
            <input type="hidden" name="foodQ" value={foodQ} />
            <TimezoneOffsetInput />
            <label
              htmlFor="mealQ"
              className="block text-xs font-semibold text-accent"
            >
              Search meal names and add all dish contents to today
            </label>
            <div className="group flex gap-3 rounded-xl border border-border bg-surface p-3 shadow-sm">
              <div className="min-w-0 flex-1 transition-all duration-300 ease-out group-focus-within:flex-[1_1_100%]">
                <input
                  id="mealQ"
                  name="mealQ"
                  type="search"
                  defaultValue={mealQ}
                  placeholder="Search by meal name"
                  className="w-full rounded-lg border border-border bg-surface px-4 py-2 text-sm text-foreground shadow-sm outline-none transition-all duration-300 placeholder:text-foreground/35 focus:border-accent"
                />
              </div>
              <button
                type="submit"
                className="flex shrink-0 items-center gap-2 overflow-hidden rounded-lg border border-border bg-surface-elevated px-4 py-2 text-sm font-semibold text-foreground shadow-sm transition-all duration-300 ease-out hover:border-accent hover:bg-surface"
              >
                Search
              </button>
            </div>
          </form>

          {mealMatches.length === 0 ? (
            <p className="text-sm text-foreground/60">No meals found.</p>
          ) : (
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {mealMatches.map((meal: (typeof mealMatches)[number]) => (
                <li
                  key={meal.id}
                  className="rounded-base bg-neutral-primary-soft p-3"
                >
                  <form
                    action={addMealContentsToToday}
                    className="flex flex-col gap-3"
                  >
                    <input type="hidden" name="mealId" value={meal.id} />
                    <input type="hidden" name="mealQ" value={mealQ} />
                    <input type="hidden" name="dishQ" value={dishQ} />
                    <input type="hidden" name="foodQ" value={foodQ} />
                    <TimezoneOffsetInput />
                    <div className="h-44 w-full overflow-hidden rounded-base bg-background">
                      {meal.image ? (
                        <img
                          src={meal.image}
                          alt={meal.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[10px] text-foreground/45">
                          No image
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {meal.name}
                      </p>
                      <p className="text-xs text-foreground/55">
                        {meal.dishes.length} dish
                        {meal.dishes.length === 1 ? "" : "es"} • likes{" "}
                        {meal.likes}
                      </p>
                    </div>
                    <FormSubmitButton
                      label="Add meal to today's list"
                      pendingLabel="Add meal to today"
                      className="inline-flex items-center justify-center rounded-full border border-border bg-surface-elevated px-3 py-2 text-xs font-semibold text-foreground shadow-sm transition hover:-translate-y-0.5 hover:border-border-strong hover:bg-surface"
                    />
                  </form>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="space-y-3">
          <div className="border-b-2 border-blue-300 pb-3">
            <h4 className="bg-linear-to-r from-blue-600 to-indigo-600 bg-clip-text text-2xl font-bold text-transparent">
              Dishes
            </h4>
          </div>
          <form method="get" action="/dashboard" className="space-y-2">
            <input type="hidden" name="mealQ" value={mealQ} />
            <input type="hidden" name="foodQ" value={foodQ} />
            <TimezoneOffsetInput />
            <label
              htmlFor="dishQ"
              className="block text-xs font-semibold text-accent"
            >
              Search dishes and add one serving to today
            </label>
            <div className="group flex gap-3 rounded-xl border border-border bg-surface p-3 shadow-sm">
              <div className="min-w-0 flex-1 transition-all duration-300 ease-out group-focus-within:flex-[1_1_100%]">
                <input
                  id="dishQ"
                  name="dishQ"
                  type="search"
                  defaultValue={dishQ}
                  placeholder="Search by dish name"
                  className="w-full rounded-lg border border-border bg-surface px-4 py-2 text-sm text-foreground shadow-sm outline-none transition-all duration-300 placeholder:text-foreground/35 focus:border-accent"
                />
              </div>
              <button
                type="submit"
                className="flex shrink-0 items-center gap-2 overflow-hidden rounded-lg border border-border bg-surface-elevated px-4 py-2 text-sm font-semibold text-foreground shadow-sm transition-all duration-300 ease-out hover:border-accent hover:bg-surface"
              >
                Search
              </button>
            </div>
          </form>

          {dishMatches.length === 0 ? (
            <p className="text-sm text-foreground/60">No dishes found.</p>
          ) : (
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {dishMatches.map((dish: (typeof dishMatches)[number]) => (
                <li
                  key={dish.id}
                  className="rounded-base bg-neutral-primary-soft p-3"
                >
                  <form action={addDishToToday} className="flex flex-col gap-3">
                    <input type="hidden" name="dishId" value={dish.id} />
                    <input type="hidden" name="servings" value="1" />
                    <input type="hidden" name="mealQ" value={mealQ} />
                    <input type="hidden" name="dishQ" value={dishQ} />
                    <input type="hidden" name="foodQ" value={foodQ} />
                    <TimezoneOffsetInput />
                    <div className="h-44 w-full overflow-hidden rounded-base bg-background">
                      {dish.image ? (
                        <img
                          src={dish.image}
                          alt={dish.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[10px] text-foreground/45">
                          No image
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {dish.name}
                      </p>
                      <p className="text-xs text-foreground/55">
                        {dish.ingredients.length} ingredient
                        {dish.ingredients.length === 1 ? "" : "s"}
                      </p>
                    </div>
                    <FormSubmitButton
                      label="Add dish to today's list"
                      pendingLabel="Add dish to today"
                      className="inline-flex items-center justify-center rounded-full border border-border bg-surface-elevated px-3 py-2 text-xs font-semibold text-foreground shadow-sm transition hover:-translate-y-0.5 hover:border-border-strong hover:bg-surface"
                    />
                  </form>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="space-y-3">
          <div className="border-b-2 border-emerald-300 pb-3">
            <h4 className="bg-linear-to-r from-emerald-600 to-teal-600 bg-clip-text text-2xl font-bold text-transparent">
              Foods
            </h4>
          </div>
          <form method="get" action="/dashboard" className="space-y-2">
            <input type="hidden" name="mealQ" value={mealQ} />
            <input type="hidden" name="dishQ" value={dishQ} />
            <TimezoneOffsetInput />
            <label
              htmlFor="foodQ"
              className="block text-xs font-semibold text-accent"
            >
              Search foods and add them to today (default 100g)
            </label>
            <div className="group flex gap-3 rounded-xl border border-border bg-surface p-3 shadow-sm">
              <div className="min-w-0 flex-1 transition-all duration-300 ease-out group-focus-within:flex-[1_1_100%]">
                <input
                  id="foodQ"
                  name="foodQ"
                  type="search"
                  defaultValue={foodQ}
                  placeholder="Search by food name"
                  className="w-full rounded-lg border border-border bg-surface px-4 py-2 text-sm text-foreground shadow-sm outline-none transition-all duration-300 placeholder:text-foreground/35 focus:border-accent"
                />
              </div>
              <button
                type="submit"
                className="flex shrink-0 items-center gap-2 overflow-hidden rounded-lg border border-border bg-surface-elevated px-4 py-2 text-sm font-semibold text-foreground shadow-sm transition-all duration-300 ease-out hover:border-accent hover:bg-surface"
              >
                Search
              </button>
            </div>
          </form>

          {foodMatches.length === 0 ? (
            <p className="text-sm text-foreground/60">No foods found.</p>
          ) : (
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {foodMatches.map((food: (typeof foodMatches)[number]) => (
                <li
                  key={food.id}
                  className="rounded-base bg-neutral-primary-soft p-3"
                >
                  <form action={addFoodToToday} className="flex flex-col gap-3">
                    <input type="hidden" name="foodId" value={food.id} />
                    <input type="hidden" name="amount" value="100" />
                    <input type="hidden" name="mealQ" value={mealQ} />
                    <input type="hidden" name="dishQ" value={dishQ} />
                    <input type="hidden" name="foodQ" value={foodQ} />
                    <TimezoneOffsetInput />
                    <div className="h-44 w-full overflow-hidden rounded-base bg-background">
                      {food.image ? (
                        <img
                          src={food.image}
                          alt={food.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[10px] text-foreground/45">
                          No image
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {food.name}
                      </p>
                      <p className="text-xs text-foreground/55">
                        {food.calories} kcal • P {food.protein / 10} • C{" "}
                        {food.carbohydrates / 10} • F {food.fat / 10}
                      </p>
                    </div>
                    <FormSubmitButton
                      label="Add 100g to today's list"
                      pendingLabel="Adding 100g to today's list..."
                      className="inline-flex items-center justify-center rounded-full border border-border bg-surface-elevated px-3 py-2 text-xs font-semibold text-foreground shadow-sm transition hover:-translate-y-0.5 hover:border-border-strong hover:bg-surface"
                    />
                  </form>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
