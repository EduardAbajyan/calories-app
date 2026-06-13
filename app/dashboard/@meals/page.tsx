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
      <div className="w-full max-w-3xl rounded-base border border-default bg-neutral-primary-soft p-4 text-center text-fg-disabled">
        <p>No meals yet.</p>
        <Link
          href="/add-meal"
          className="mt-2 inline-block text-fg-brand hover:underline"
        >
          Add your first meal
        </Link>
      </div>
    );
  }

  return (
    <section className="w-full max-w-3xl space-y-3 rounded-base border border-default bg-neutral-primary-soft p-4">
      <h3 className="text-base font-semibold text-heading">Meals</h3>
      <ul className="space-y-2">
        {meals.map((meal, index) => {
          const isUserLiked = meal.countsConsumed !== null;

          return (
            <li
              key={meal.id}
              className="flex items-center justify-between rounded-base border border-default bg-background px-3 py-2"
            >
              <div className="flex min-w-0 items-center gap-2">
                <span className="text-xs text-fg-disabled">#{index + 1}</span>
                <p className="truncate text-sm font-medium text-body">
                  {meal.name}
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs text-fg-disabled">
                {isUserLiked ? (
                  <span className="rounded-base bg-neutral-secondary-soft px-2 py-1 text-body">
                    consumed {meal.countsConsumed}
                  </span>
                ) : null}
                <span>likes {meal.likes}</span>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
