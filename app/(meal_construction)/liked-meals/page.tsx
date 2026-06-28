import Link from "next/link";
import Image from "next/image";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import TemporalMessage from "../../../components/temporal-message";
import PendingActionButton from "@/components/pending-action-button";
import { getCloudinaryImageUrl } from "@/lib/cloudinary-image";
import { buildMetadata } from "@/app/seo";

type LikedMealsSearchParams = {
  dishQ?: string;
  foodQ?: string;
  likedLimit?: string;
  otherLimit?: string;
  dishLimit?: string;
  foodLimit?: string;
  error?: string;
};

const PAGE_SIZE = 9;

type TransactionClient = Parameters<
  Extract<Parameters<typeof prisma.$transaction>[0], (arg: any) => any>
>[0];

function parseLimit(value: string | undefined) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return PAGE_SIZE;
  }

  return parsed;
}

export const metadata = buildMetadata({
  title: "Liked Meals",
  description:
    "Browse and manage your favorite meals and quickly reuse them in your meal planning flow.",
  path: "/liked-meals",
  noIndex: true,
});

export default async function LikedMealsPage({
  searchParams,
}: {
  searchParams: Promise<LikedMealsSearchParams>;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/?mode=login");
  }

  const params = await searchParams;
  const dishQ = String(params.dishQ ?? "").trim();
  const foodQ = String(params.foodQ ?? "").trim();
  const likedLimit = parseLimit(params.likedLimit);
  const otherLimit = parseLimit(params.otherLimit);
  const dishLimit = parseLimit(params.dishLimit);
  const foodLimit = parseLimit(params.foodLimit);
  const error = params.error;

  async function unlikeMeal(formData: FormData) {
    "use server";

    const activeSession = await auth();
    if (!activeSession?.user?.id) {
      redirect("/?mode=login");
    }

    const mealId = Number(formData.get("mealId"));
    if (!Number.isInteger(mealId) || mealId <= 0) {
      redirect("/liked-meals?error=Invalid%20meal");
    }

    await prisma.$transaction(async (tx: TransactionClient) => {
      const existingBelovedMeal = await tx.usersBelovedMeals.findUnique({
        where: {
          userId_mealId: {
            userId: activeSession.user.id,
            mealId,
          },
        },
        select: {
          userId: true,
          mealId: true,
          isLiked: true,
        },
      });

      if (!existingBelovedMeal || !existingBelovedMeal.isLiked) {
        return;
      }

      await tx.usersBelovedMeals.delete({
        where: {
          userId_mealId: {
            userId: activeSession.user.id,
            mealId,
          },
        },
      });

      await tx.meal.update({
        where: {
          id: mealId,
        },
        data: {
          likes: {
            decrement: 1,
          },
        },
      });
    });

    revalidatePath("/liked-meals");
    redirect("/liked-meals");
  }

  async function likeMeal(formData: FormData) {
    "use server";

    const activeSession = await auth();
    if (!activeSession?.user?.id) {
      redirect("/?mode=login");
    }

    const mealId = Number(formData.get("mealId"));
    if (!Number.isInteger(mealId) || mealId <= 0) {
      redirect("/liked-meals?error=Invalid%20meal");
    }

    const mealNotFound = await prisma.$transaction(
      async (tx: TransactionClient) => {
        const mealExists = await tx.meal.findUnique({
          where: { id: mealId },
          select: { id: true },
        });

        if (!mealExists) {
          return true;
        }

        const existingBelovedMeal = await tx.usersBelovedMeals.findUnique({
          where: {
            userId_mealId: {
              userId: activeSession.user.id,
              mealId,
            },
          },
          select: {
            isLiked: true,
          },
        });

        if (existingBelovedMeal?.isLiked) {
          return false;
        }

        if (existingBelovedMeal) {
          await tx.usersBelovedMeals.update({
            where: {
              userId_mealId: {
                userId: activeSession.user.id,
                mealId,
              },
            },
            data: {
              isLiked: true,
            },
          });
        } else {
          await tx.usersBelovedMeals.create({
            data: {
              userId: activeSession.user.id,
              mealId,
              isLiked: true,
            },
          });
        }

        await tx.meal.update({
          where: {
            id: mealId,
          },
          data: {
            likes: {
              increment: 1,
            },
          },
        });

        return false;
      },
    );

    if (mealNotFound) {
      redirect("/liked-meals?error=Meal%20not%20found");
    }

    revalidatePath("/liked-meals");
    redirect("/liked-meals");
  }

  async function createSingleDishMeal(formData: FormData) {
    "use server";

    const activeSession = await auth();
    if (!activeSession?.user?.id) {
      redirect("/?mode=login");
    }

    const dishId = Number(formData.get("dishId"));
    if (!Number.isInteger(dishId) || dishId <= 0) {
      redirect("/liked-meals?error=Invalid%20dish");
    }

    const dish = await prisma.dish.findUnique({
      where: { id: dishId },
      select: {
        id: true,
        name: true,
        image: true,
      },
    });

    if (!dish) {
      redirect("/liked-meals?error=Dish%20not%20found");
    }

    await prisma.meal.create({
      data: {
        name: dish.name,
        image: dish.image,
        dishes: {
          create: {
            dish: {
              connect: {
                id: dish.id,
              },
            },
          },
        },
      },
    });

    revalidatePath("/liked-meals");
    redirect("/liked-meals");
  }

  async function createSingleFoodMeal(formData: FormData) {
    "use server";

    const activeSession = await auth();
    if (!activeSession?.user?.id) {
      redirect("/?mode=login");
    }

    const foodId = Number(formData.get("foodId"));
    if (!Number.isInteger(foodId) || foodId <= 0) {
      redirect("/liked-meals?error=Invalid%20food");
    }

    const food = await prisma.food.findUnique({
      where: { id: foodId },
      select: {
        id: true,
        name: true,
        image: true,
      },
    });

    if (!food) {
      redirect("/liked-meals?error=Food%20not%20found");
    }

    const existingDishes = await prisma.dish.findMany({
      where: {
        name: food.name,
        ingredients: {
          some: {
            foodId: food.id,
          },
        },
      },
      select: {
        id: true,
        name: true,
        image: true,
        ingredients: {
          select: {
            foodId: true,
            amount: true,
          },
        },
      },
    });

    const existingSingleFoodDish = existingDishes.find(
      (candidate: { ingredients: { foodId: number; amount: number }[] }) =>
        candidate.ingredients.length === 1 &&
        candidate.ingredients[0].foodId === food.id &&
        candidate.ingredients[0].amount === 1,
    );

    const dish =
      existingSingleFoodDish ??
      (await prisma.dish.create({
        data: {
          name: food.name,
          image: food.image,
          amount: 1,
          ingredients: {
            create: {
              food: {
                connect: {
                  id: food.id,
                },
              },
              amount: 1,
            },
          },
        },
        select: {
          id: true,
          name: true,
          image: true,
        },
      }));

    await prisma.meal.create({
      data: {
        name: dish.name,
        image: dish.image,
        dishes: {
          create: {
            dish: {
              connect: {
                id: dish.id,
              },
            },
          },
        },
      },
    });

    revalidatePath("/liked-meals");
    redirect("/liked-meals");
  }

  const likedMeals = await prisma.usersBelovedMeals.findMany({
    where: {
      userId: session.user.id,
      isLiked: true,
    },
    orderBy: [{ meal: { likes: "desc" } }, { mealId: "asc" }],
    include: {
      meal: {
        select: {
          id: true,
          name: true,
          likes: true,
          image: true,
        },
      },
    },
  });

  const likedMealIds = likedMeals.map((row: { mealId: number }) => row.mealId);

  const unconfirmedMeals = await prisma.meal.findMany({
    where: {
      id: {
        notIn: likedMealIds,
      },
    },
    orderBy: [{ likes: "desc" }, { id: "asc" }],
    select: {
      id: true,
      name: true,
      likes: true,
      image: true,
    },
  });

  const dishMatches = await prisma.dish.findMany({
    where: dishQ
      ? {
          name: {
            contains: dishQ,
            mode: "insensitive",
          },
        }
      : undefined,
    orderBy: [{ name: "asc" }, { id: "asc" }],
    take: 25,
    select: {
      id: true,
      name: true,
      image: true,
    },
  });

  const foodMatches = await prisma.food.findMany({
    where: foodQ
      ? {
          name: {
            contains: foodQ,
            mode: "insensitive",
          },
        }
      : undefined,
    orderBy: [{ name: "asc" }, { id: "asc" }],
    take: 25,
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

  const visibleLikedMeals = likedMeals.slice(0, likedLimit);
  const visibleUnconfirmedMeals = unconfirmedMeals.slice(0, otherLimit);
  const visibleDishMatches = dishMatches.slice(0, dishLimit);
  const visibleFoodMatches = foodMatches.slice(0, foodLimit);

  const hasMoreLikedMeals = likedMeals.length > likedLimit;
  const hasMoreUnconfirmedMeals = unconfirmedMeals.length > otherLimit;
  const hasMoreDishMatches = dishMatches.length > dishLimit;
  const hasMoreFoodMatches = foodMatches.length > foodLimit;

  const buildLoadMoreHref = (
    overrides: Partial<
      Record<"likedLimit" | "otherLimit" | "dishLimit" | "foodLimit", number>
    >,
  ) => {
    const nextParams = new URLSearchParams();

    if (dishQ) {
      nextParams.set("dishQ", dishQ);
    }

    if (foodQ) {
      nextParams.set("foodQ", foodQ);
    }

    nextParams.set("likedLimit", String(overrides.likedLimit ?? likedLimit));
    nextParams.set("otherLimit", String(overrides.otherLimit ?? otherLimit));
    nextParams.set("dishLimit", String(overrides.dishLimit ?? dishLimit));
    nextParams.set("foodLimit", String(overrides.foodLimit ?? foodLimit));

    return `/liked-meals?${nextParams.toString()}`;
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top_left,var(--color-accent-soft),transparent_38%),radial-gradient(circle_at_top_right,var(--color-surface-strong),transparent_34%),linear-gradient(180deg,var(--color-background)_0%,var(--color-surface-elevated)_100%)] p-4 sm:p-8">
      <section className="relative mx-auto w-full max-w-4xl space-y-8 overflow-hidden rounded-[28px] border border-border/70 bg-surface/75 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.14)] backdrop-blur-xl">
        <div className="flex items-center justify-between gap-3">
          <h1 className="bg-linear-to-r from-purple-600 to-pink-600 bg-clip-text text-4xl font-bold text-transparent">
            ❤️ Liked meals
          </h1>
          <Link
            href="/add-meal"
            className="text-sm text-fg-brand hover:underline"
          >
            Add new meal
          </Link>
        </div>

        {error ? (
          <TemporalMessage
            className="rounded-base border border-default bg-background px-3 py-2 text-sm text-red-600"
            message={error}
          />
        ) : null}

        <div className="space-y-3 p-4">
          <div className="border-b-2 border-pink-300 pb-3">
            <h2 className="bg-linear-to-r from-pink-600 to-rose-600 bg-clip-text text-2xl font-bold text-transparent">
              💕 Meals you like
            </h2>
          </div>
          {likedMeals.length === 0 ? (
            <p className="text-sm text-fg-disabled">
              You have no confirmed liked meals yet.
            </p>
          ) : (
            <>
              <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3">
                {visibleLikedMeals.map(
                  (row: (typeof visibleLikedMeals)[number], index: number) => (
                    <li
                      key={row.meal.id}
                      className="rounded-base bg-neutral-primary-soft p-3"
                    >
                      <div className="flex flex-col items-center gap-3">
                        <div className="relative h-56 w-56 shrink-0 overflow-hidden rounded-base bg-background">
                          {row.meal.image ? (
                            <Image
                              src={getCloudinaryImageUrl(row.meal.image, {
                                width: 448,
                                height: 448,
                              })}
                              alt={row.meal.name}
                              fill
                              sizes="224px"
                              className="object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-[10px] text-fg-disabled">
                              No image
                            </div>
                          )}
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-medium text-body">
                            {index + 1}. {row.meal.name}
                          </p>
                          <p className="text-xs text-fg-disabled">
                            consumed {row.countsConsumed} times
                          </p>
                          <p className="mt-1 text-xs text-fg-disabled">
                            likes {row.meal.likes}
                          </p>
                          <form action={unlikeMeal} className="mt-2">
                            <input
                              type="hidden"
                              name="mealId"
                              value={row.meal.id}
                            />
                            <PendingActionButton
                              className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-linear-to-r from-slate-100 to-zinc-200 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-1"
                              pendingChildren="Updating..."
                            >
                              <svg
                                className="h-3.5 w-3.5"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                                aria-hidden="true"
                              >
                                <path d="M5 5.7a1 1 0 0 1 1.4 0L10 9.3l3.6-3.6a1 1 0 1 1 1.4 1.4L11.4 10.7l3.6 3.6a1 1 0 0 1-1.4 1.4L10 12.1l-3.6 3.6a1 1 0 0 1-1.4-1.4l3.6-3.6-3.6-3.6a1 1 0 0 1 0-1.4z" />
                              </svg>
                              Unlike
                            </PendingActionButton>
                          </form>
                        </div>
                      </div>
                    </li>
                  ),
                )}
              </ul>
              {hasMoreLikedMeals ? (
                <div className="flex justify-center pt-4">
                  <Link
                    href={buildLoadMoreHref({
                      likedLimit: likedLimit + PAGE_SIZE,
                    })}
                    className="inline-flex w-56 items-center justify-center rounded-none border-2 border-slate-700 bg-slate-700 px-5 py-3 text-sm font-bold tracking-[0.18em] text-slate-50 uppercase transition-colors hover:bg-slate-800"
                  >
                    Load more
                  </Link>
                </div>
              ) : null}
            </>
          )}
        </div>

        <div className="space-y-3 p-4">
          <div className="border-b-2 border-orange-300 pb-3">
            <h2 className="bg-linear-to-r from-orange-600 to-amber-600 bg-clip-text text-2xl font-bold text-transparent">
              ⭐ Meals other people like
            </h2>
          </div>
          {unconfirmedMeals.length === 0 ? (
            <p className="text-sm text-fg-disabled">
              No meals available outside your liked list.
            </p>
          ) : (
            <>
              <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3">
                {visibleUnconfirmedMeals.map(
                  (
                    meal: (typeof visibleUnconfirmedMeals)[number],
                    index: number,
                  ) => (
                    <li
                      key={meal.id}
                      className="rounded-base bg-neutral-primary-soft p-3"
                    >
                      <div className="flex flex-col items-center gap-3">
                        <div className="relative h-56 w-56 shrink-0 overflow-hidden rounded-base bg-background">
                          {meal.image ? (
                            <Image
                              src={getCloudinaryImageUrl(meal.image, {
                                width: 448,
                                height: 448,
                              })}
                              alt={meal.name}
                              fill
                              sizes="224px"
                              className="object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-[10px] text-fg-disabled">
                              No image
                            </div>
                          )}
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-medium text-body">
                            {index + 1}. {meal.name}
                          </p>
                          <p className="mt-1 text-xs text-fg-disabled">
                            likes {meal.likes}
                          </p>
                          <form action={likeMeal} className="mt-2">
                            <input
                              type="hidden"
                              name="mealId"
                              value={meal.id}
                            />
                            <PendingActionButton
                              className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-linear-to-r from-amber-200 via-orange-200 to-rose-200 px-3 py-1.5 text-xs font-semibold text-amber-900 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-1"
                              pendingChildren="Updating..."
                            >
                              <svg
                                className="h-3.5 w-3.5"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                                aria-hidden="true"
                              >
                                <path d="M10 17.5l-1.2-1.1C4.6 12.5 2 10.1 2 7.1 2 4.7 3.9 2.8 6.3 2.8c1.4 0 2.8.7 3.7 1.8.9-1.1 2.3-1.8 3.7-1.8 2.4 0 4.3 1.9 4.3 4.3 0 3-2.6 5.4-6.8 9.3L10 17.5z" />
                              </svg>
                              Like
                            </PendingActionButton>
                          </form>
                        </div>
                      </div>
                    </li>
                  ),
                )}
              </ul>
              {hasMoreUnconfirmedMeals ? (
                <div className="flex justify-center pt-4">
                  <Link
                    href={buildLoadMoreHref({
                      otherLimit: otherLimit + PAGE_SIZE,
                    })}
                    className="inline-flex w-56 items-center justify-center rounded-none border-2 border-slate-700 bg-slate-700 px-5 py-3 text-sm font-bold tracking-[0.18em] text-slate-50 uppercase transition-colors hover:bg-slate-800"
                  >
                    Load more
                  </Link>
                </div>
              ) : null}
            </>
          )}
        </div>

        <div className="space-y-3 p-4">
          <div className="border-b-2 border-blue-300 pb-3">
            <h2 className="bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-2xl font-bold text-transparent">
              🍽️ Create meal from dish
            </h2>
          </div>
          <form method="get" action="/liked-meals" className="space-y-2">
            <input type="hidden" name="foodQ" value={foodQ} />
            <label
              htmlFor="dishQ"
              className="block text-xs font-semibold text-fg-brand"
            >
              Search dishes and create meal from them by clicking on the dish
              card
            </label>
            <div className="group flex gap-3 rounded-xl border border-default bg-background p-3 shadow-sm">
              <div className="min-w-0 flex-1 transition-all duration-300 ease-out group-focus-within:flex-[1_1_100%]">
                <input
                  id="dishQ"
                  name="dishQ"
                  type="search"
                  defaultValue={dishQ}
                  placeholder="Search by dish name"
                  className="w-full rounded-lg border border-default bg-background px-4 py-2 text-sm text-body shadow-sm outline-none transition-all duration-300 placeholder:text-fg-disabled focus:border-fg-brand"
                />
              </div>
              <button
                type="submit"
                className="flex shrink-0 items-center gap-2 overflow-hidden rounded-lg border border-default bg-neutral-primary-soft px-4 py-2 text-sm font-semibold text-body shadow-sm transition-all duration-300 ease-out hover:border-fg-brand hover:bg-neutral-primary focus:outline-none focus:border-fg-brand group-focus-within:w-0 group-focus-within:border-transparent group-focus-within:px-0 group-focus-within:opacity-0"
              >
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
                Search
              </button>
            </div>
          </form>

          {dishMatches.length === 0 ? (
            <p className="text-sm text-fg-disabled">No dishes found.</p>
          ) : (
            <>
              <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3">
                {visibleDishMatches.map(
                  (dish: (typeof visibleDishMatches)[number]) => (
                    <li key={dish.id}>
                      <form action={createSingleDishMeal}>
                        <input type="hidden" name="dishId" value={dish.id} />
                        <PendingActionButton
                          className="flex w-full flex-col items-center gap-3 rounded-base bg-neutral-primary-soft p-3 text-center hover:bg-neutral-primary"
                          pendingChildren={
                            <span className="text-sm font-semibold text-body">
                              Creating meal...
                            </span>
                          }
                        >
                          <div className="relative h-56 w-56 overflow-hidden rounded-base bg-background">
                            {dish.image ? (
                              <Image
                                src={getCloudinaryImageUrl(dish.image, {
                                  width: 448,
                                  height: 448,
                                })}
                                alt={dish.name}
                                fill
                                sizes="224px"
                                className="object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-[10px] text-fg-disabled">
                                No image
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-body">
                              {dish.name}
                            </p>
                            <p className="mt-1 text-xs text-fg-disabled">
                              Click to create single-dish meal
                            </p>
                          </div>
                        </PendingActionButton>
                      </form>
                    </li>
                  ),
                )}
              </ul>
              {hasMoreDishMatches ? (
                <div className="flex justify-center pt-4">
                  <Link
                    href={buildLoadMoreHref({
                      dishLimit: dishLimit + PAGE_SIZE,
                    })}
                    className="inline-flex w-56 items-center justify-center rounded-none border-2 border-slate-700 bg-slate-700 px-5 py-3 text-sm font-bold tracking-[0.18em] text-slate-50 uppercase transition-colors hover:bg-slate-800"
                  >
                    Load more
                  </Link>
                </div>
              ) : null}
            </>
          )}
        </div>

        <div className="space-y-3 p-4">
          <div className="border-b-2 border-emerald-300 pb-3">
            <h2 className="bg-linear-to-r from-emerald-600 to-teal-600 bg-clip-text text-2xl font-bold text-transparent">
              🥗 Create meal from food
            </h2>
          </div>
          <form method="get" action="/liked-meals" className="space-y-2">
            <input type="hidden" name="dishQ" value={dishQ} />
            <label
              htmlFor="foodQ"
              className="block text-xs font-semibold text-fg-brand"
            >
              Search foods and create meal from them by clicking on the food
              card
            </label>
            <div className="group flex gap-3 rounded-xl border border-default bg-background p-3 shadow-sm">
              <div className="min-w-0 flex-1 transition-all duration-300 ease-out group-focus-within:flex-[1_1_100%]">
                <input
                  id="foodQ"
                  name="foodQ"
                  type="search"
                  defaultValue={foodQ}
                  placeholder="Search by food name"
                  className="w-full rounded-lg border border-default bg-background px-4 py-2 text-sm text-body shadow-sm outline-none transition-all duration-300 placeholder:text-fg-disabled focus:border-fg-brand"
                />
              </div>
              <button
                type="submit"
                className="flex shrink-0 items-center gap-2 overflow-hidden rounded-lg border border-default bg-neutral-primary-soft px-4 py-2 text-sm font-semibold text-body shadow-sm transition-all duration-300 ease-out hover:border-fg-brand hover:bg-neutral-primary focus:outline-none focus:border-fg-brand group-focus-within:w-0 group-focus-within:border-transparent group-focus-within:px-0 group-focus-within:opacity-0"
              >
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
                Search
              </button>
            </div>
          </form>

          {foodMatches.length === 0 ? (
            <p className="text-sm text-fg-disabled">No foods found.</p>
          ) : (
            <>
              <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3">
                {visibleFoodMatches.map(
                  (food: (typeof visibleFoodMatches)[number]) => (
                    <li key={food.id}>
                      <form action={createSingleFoodMeal}>
                        <input type="hidden" name="foodId" value={food.id} />
                        <PendingActionButton
                          className="flex w-full flex-col items-center gap-3 rounded-base bg-neutral-primary-soft p-3 text-center hover:bg-neutral-primary"
                          pendingChildren={
                            <span className="text-sm font-semibold text-body">
                              Creating meal...
                            </span>
                          }
                        >
                          <div className="relative h-56 w-56 overflow-hidden rounded-base bg-background">
                            {food.image ? (
                              <Image
                                src={getCloudinaryImageUrl(food.image, {
                                  width: 448,
                                  height: 448,
                                })}
                                alt={food.name}
                                fill
                                sizes="224px"
                                className="object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-[10px] text-fg-disabled">
                                No image
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-body">
                              {food.name}
                            </p>
                            <p className="text-xs text-fg-disabled">
                              {food.calories} kcal • P {food.protein} • C{" "}
                              {food.carbohydrates} • F {food.fat}
                            </p>
                            <p className="mt-1 text-xs text-fg-disabled">
                              Click to create single-food meal
                            </p>
                          </div>
                        </PendingActionButton>
                      </form>
                    </li>
                  ),
                )}
              </ul>
              {hasMoreFoodMatches ? (
                <div className="flex justify-center pt-4">
                  <Link
                    href={buildLoadMoreHref({
                      foodLimit: foodLimit + PAGE_SIZE,
                    })}
                    className="inline-flex w-56 items-center justify-center rounded-none border-2 border-slate-700 bg-slate-700 px-5 py-3 text-sm font-bold tracking-[0.18em] text-slate-50 uppercase transition-colors hover:bg-slate-800"
                  >
                    Load more
                  </Link>
                </div>
              ) : null}
            </>
          )}
        </div>
      </section>
    </main>
  );
}
