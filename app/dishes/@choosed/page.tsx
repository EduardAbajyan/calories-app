import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

type ChoosedSearchParams = {
  dishId?: string;
};

export default async function ChoosedPage({
  searchParams,
}: {
  searchParams: Promise<ChoosedSearchParams>;
}) {
  const resolvedSearchParams = await searchParams;
  const dishId = Number(resolvedSearchParams.dishId ?? "");

  if (!Number.isInteger(dishId) || dishId <= 0) {
    return (
      <section className="relative w-full rounded-[28px] border border-border/70 bg-surface/80 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.12)] backdrop-blur-xl">
        <p className="mb-2 inline-flex rounded-full border border-border bg-surface-elevated px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-accent">
          Choosed dish
        </p>
        <h3 className="text-xl font-semibold tracking-tight text-foreground">
          Select a dish to open details
        </h3>
        <p className="mt-2 text-sm leading-6 text-foreground/70">
          Pick a dish card in the Resipes panel to view ingredients, recipe info,
          and macros here.
        </p>
      </section>
    );
  }

  const dish = await prisma.dish.findUnique({
    where: { id: dishId },
    select: {
      id: true,
      name: true,
      image: true,
      path: true,
      amount: true,
      ingredients: {
        select: {
          id: true,
          amount: true,
          food: {
            select: {
              id: true,
              name: true,
              calories: true,
              protein: true,
              carbohydrates: true,
              fat: true,
            },
          },
        },
        orderBy: { id: "asc" },
      },
    },
  });

  if (!dish) {
    notFound();
  }

  const totals = dish.ingredients.reduce(
    (sum, ingredient) => {
      const factor = ingredient.amount / 100;
      return {
        calories: sum.calories + ingredient.food.calories * factor,
        protein: sum.protein + ingredient.food.protein * factor,
        carbohydrates:
          sum.carbohydrates + ingredient.food.carbohydrates * factor,
        fat: sum.fat + ingredient.food.fat * factor,
      };
    },
    {
      calories: 0,
      protein: 0,
      carbohydrates: 0,
      fat: 0,
    },
  );

  const amountFactor = dish.amount > 0 ? 100 / dish.amount : 1;
  const per100 = {
    calories: totals.calories * amountFactor,
    protein: totals.protein * amountFactor,
    carbohydrates: totals.carbohydrates * amountFactor,
    fat: totals.fat * amountFactor,
  };

  return (
    <section className="relative w-full rounded-[28px] border border-border/70 bg-surface/80 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.12)] backdrop-blur-xl">
      <div className="mb-5">
        <p className="mb-2 inline-flex rounded-full border border-border bg-surface-elevated px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-accent">
          Choosed dish
        </p>
        <h3 className="text-xl font-semibold tracking-tight text-foreground">
          {dish.name}
        </h3>
        <p className="mt-2 text-sm leading-6 text-foreground/70">
          Full dish details with ingredients and nutrition profile.
        </p>
      </div>

      <div className="mb-5 h-52 w-full overflow-hidden rounded-2xl border border-border bg-background">
        {dish.image ? (
          <img
            src={dish.image}
            alt={dish.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-foreground/45">
            No image
          </div>
        )}
      </div>

      <div className="mb-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-border bg-surface-elevated px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">
            Dish weight
          </p>
          <p className="mt-1 text-lg font-semibold text-foreground">{dish.amount} g</p>
        </div>
        <div className="rounded-2xl border border-border bg-surface-elevated px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">
            Recipe
          </p>
          <p className="mt-1 text-sm text-foreground/75">
            {dish.path ? dish.path : "No recipe text saved yet"}
          </p>
        </div>
      </div>

      <div className="mb-5 rounded-2xl border border-border bg-surface-elevated p-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-accent">
          Macros per dish
        </p>
        <p className="text-sm text-foreground/80">
          {Math.round(totals.calories)} kcal • P {(totals.protein / 10).toFixed(1)} • C {(totals.carbohydrates / 10).toFixed(1)} • F {(totals.fat / 10).toFixed(1)}
        </p>
        <p className="mt-2 text-xs text-foreground/60">
          Per 100g: {Math.round(per100.calories)} kcal • P {(per100.protein / 10).toFixed(1)} • C {(per100.carbohydrates / 10).toFixed(1)} • F {(per100.fat / 10).toFixed(1)}
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-surface-elevated p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-accent">
          Ingredients
        </p>
        {dish.ingredients.length === 0 ? (
          <p className="text-sm text-foreground/65">No ingredients.</p>
        ) : (
          <ul className="space-y-2">
            {dish.ingredients.map((ingredient) => (
              <li
                key={ingredient.id}
                className="flex items-center justify-between rounded-xl border border-border bg-surface px-3 py-2 text-sm"
              >
                <span className="font-medium text-foreground">
                  {ingredient.food.name}
                </span>
                <span className="text-foreground/65">{ingredient.amount} g</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
