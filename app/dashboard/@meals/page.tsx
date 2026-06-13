import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

type MealRow = {
  id: number;
  name: string;
  likes: number;
  countsConsumed: number | null;
};

export default async function MealsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  const userLikedMeals = await prisma.usersBelovedMeals.findMany({
    where: {
      userId: session.user.id,
      isLiked: true,
    },
    orderBy: [{ countsConsumed: "desc" }, { mealId: "asc" }],
    include: {
      meal: {
        select: {
          id: true,
          name: true,
          likes: true,
        },
      },
    },
  });

  const userLikedMealIds = userLikedMeals.map((liked) => liked.mealId);

  const globallyLikedMeals = await prisma.meal.findMany({
    where: {
      id: {
        notIn: userLikedMealIds,
      },
    },
    orderBy: [{ likes: "desc" }, { id: "asc" }],
    select: {
      id: true,
      name: true,
      likes: true,
    },
  });

  const meals: MealRow[] = [
    ...userLikedMeals.map((liked) => ({
      id: liked.meal.id,
      name: liked.meal.name,
      likes: liked.meal.likes,
      countsConsumed: liked.countsConsumed,
    })),
    ...globallyLikedMeals.map((meal) => ({
      id: meal.id,
      name: meal.name,
      likes: meal.likes,
      countsConsumed: null,
    })),
  ];

  if (meals.length === 0) {
    return (
      <div className="w-full max-w-3xl rounded-[28px] border border-border/70 bg-surface/80 p-6 text-center shadow-[0_20px_60px_rgba(0,0,0,0.12)] backdrop-blur-xl">
        <p className="text-sm font-medium text-foreground/70">No meals yet.</p>
        <Link
          href="/add-meal"
          className="mt-4 inline-flex items-center rounded-full border border-border bg-surface-elevated px-4 py-2 text-sm font-medium text-accent shadow-sm transition hover:-translate-y-0.5 hover:border-border-strong hover:bg-surface"
        >
          Add your first meal
        </Link>
      </div>
    );
  }

  return (
    <section className="relative w-full md:min-w-full md:max-w-full rounded-[28px] border border-border/70 bg-surface/80 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.12)] backdrop-blur-xl">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="mb-2 inline-flex rounded-full border border-border bg-surface-elevated px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-accent">
            Meals
          </p>
          <h3 className="text-xl font-semibold tracking-tight text-foreground">
            Liked and trending meals
          </h3>
          <p className="mt-2 text-sm leading-6 text-foreground/70">
            Your favorites appear first, followed by the most liked meals from
            everyone else.
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-surface-elevated px-4 py-3 text-right shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">
            Total shown
          </p>
          <p className="mt-1 text-2xl font-semibold text-foreground">
            {meals.length}
          </p>
        </div>
      </div>

      <ul className="space-y-3">
        {meals.map((meal, index) => {
          const isUserLiked = meal.countsConsumed !== null;

          return (
            <li
              key={meal.id}
              className="flex flex-col gap-3 rounded-3xl border border-border/80 bg-[linear-gradient(180deg,var(--color-surface)_0%,var(--color-surface-elevated)_100%)] px-4 py-4 shadow-sm transition hover:-translate-y-0.5 hover:border-border-strong hover:shadow-md sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-surface-elevated text-sm font-semibold text-accent shadow-sm">
                  {index + 1}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground sm:text-base">
                    {meal.name}
                  </p>
                  <p className="mt-1 text-xs uppercase tracking-[0.18em] text-foreground/45">
                    {isUserLiked
                      ? "From your liked meals"
                      : "Popular with all users"}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-foreground/70">
                {isUserLiked ? (
                  <span className="rounded-full border border-border bg-accent-soft px-3 py-1.5 text-foreground shadow-sm">
                    consumed {meal.countsConsumed}
                  </span>
                ) : null}
                <span className="rounded-full border border-border bg-surface-elevated px-3 py-1.5 shadow-sm">
                  likes {meal.likes}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
