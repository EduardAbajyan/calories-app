import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { getCloudinaryImageUrl } from "@/lib/cloudinary-image";
import PendingNavigationLink from "@/components/pending-navigation-link";

type RecipesSearchParams = {
  recipeQ?: string;
  dishId?: string;
};

export default async function RecipesPage({
  searchParams,
}: {
  searchParams: Promise<RecipesSearchParams>;
}) {
  const resolvedSearchParams = await searchParams;
  const recipeQ = String(resolvedSearchParams.recipeQ ?? "").trim();
  const selectedDishId = Number(resolvedSearchParams.dishId ?? "");

  const dishes = await prisma.dish.findMany({
    where: {
      name: {
        contains: recipeQ,
        mode: "insensitive",
      },
    },
    orderBy: [{ name: "asc" }, { id: "asc" }],
    take: 36,
    select: {
      id: true,
      name: true,
      image: true,
      ingredients: {
        select: {
          amount: true,
          food: {
            select: {
              calories: true,
            },
          },
        },
      },
    },
  });

  return (
    <section className="relative w-full rounded-[28px] border border-border/70 bg-surface/80 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.12)] backdrop-blur-xl">
      <div className="mb-5">
        <p className="mb-2 inline-flex rounded-full border border-border bg-surface-elevated px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-accent">
          Recipes
        </p>
        <h3 className="text-xl font-semibold tracking-tight text-foreground">
          Search dishes
        </h3>
        <p className="mt-2 text-sm leading-6 text-foreground/70">
          Click a card to open full dish details in the panel on the right.
        </p>
      </div>

      <form method="get" action="/dishes" className="mb-5 space-y-3">
        <input
          type="hidden"
          name="dishId"
          value={Number.isInteger(selectedDishId) ? selectedDishId : ""}
        />
        <label
          htmlFor="recipeQ"
          className="block text-xs font-semibold text-accent"
        >
          Find a dish by name
        </label>
        <div className="group flex gap-3 rounded-xl border border-border bg-surface p-3 shadow-sm">
          <div className="min-w-0 flex-1">
            <input
              id="recipeQ"
              name="recipeQ"
              type="search"
              defaultValue={recipeQ}
              placeholder="Search dishes"
              className="w-full rounded-lg border border-border bg-surface px-4 py-2 text-sm text-foreground shadow-sm outline-none transition placeholder:text-foreground/35 focus:border-accent"
            />
          </div>
          <button
            type="submit"
            className="flex shrink-0 items-center rounded-lg border border-border bg-surface-elevated px-4 py-2 text-sm font-semibold text-foreground shadow-sm transition hover:border-accent hover:bg-surface"
          >
            Search
          </button>
        </div>
      </form>

      {dishes.length === 0 ? (
        <p className="rounded-2xl border border-border bg-surface-elevated px-4 py-3 text-sm text-foreground/70">
          No dishes found. Try another query.
        </p>
      ) : (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {dishes.map((dish) => {
            const hrefParams = new URLSearchParams();
            if (recipeQ) hrefParams.set("recipeQ", recipeQ);
            hrefParams.set("dishId", String(dish.id));
            const href = `/dishes?${hrefParams.toString()}`;
            const isActive = selectedDishId === dish.id;
            const totalCalories = dish.ingredients.reduce((sum, ingredient) => {
              return sum + (ingredient.food.calories * ingredient.amount) / 100;
            }, 0);

            return (
              <li key={dish.id}>
                <PendingNavigationLink
                  href={href}
                  className={`block rounded-2xl border p-3 transition ${
                    isActive
                      ? "border-accent bg-accent-soft/30"
                      : "border-border bg-surface-elevated hover:border-border-strong"
                  }`}
                  pendingClassName="pointer-events-none border-accent/70 bg-accent-soft/45 opacity-80"
                >
                  <div className="relative mb-3 h-36 w-full overflow-hidden rounded-xl bg-background">
                    {dish.image ? (
                      <Image
                        src={getCloudinaryImageUrl(dish.image, {
                          width: 640,
                          height: 288,
                        })}
                        alt={dish.name}
                        fill
                        sizes="(max-width: 640px) 100vw, 50vw"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs text-foreground/45">
                        No image
                      </div>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-foreground">
                    {dish.name}
                  </p>
                  <p className="mt-1 text-xs text-foreground/65">
                    {dish.ingredients.length} ingredient
                    {dish.ingredients.length === 1 ? "" : "s"} •{" "}
                    {Math.round(totalCalories)} kcal
                  </p>
                </PendingNavigationLink>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
