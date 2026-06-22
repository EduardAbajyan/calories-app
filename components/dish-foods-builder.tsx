"use client";

import { useMemo, useState } from "react";

type FoodOption = {
  id: number;
  name: string;
  image: string | null;
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
};

type SelectedFood = {
  foodId: number;
  amount: string;
};

export default function DishFoodsBuilder({
  availableFoods,
}: {
  availableFoods: FoodOption[];
}) {
  const [selectedFoods, setSelectedFoods] = useState<SelectedFood[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  const transformedFoods = useMemo(
    () =>
      availableFoods.map((food) => ({
        ...food,
        protein: food.protein,
        carbohydrates: food.carbohydrates,
        fat: food.fat,
      })),
    [availableFoods],
  );

  const selectedFoodIds = useMemo(
    () => new Set(selectedFoods.map((food) => food.foodId)),
    [selectedFoods],
  );

  const filteredFoods = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    if (!normalizedSearch) {
      return transformedFoods;
    }

    return transformedFoods.filter((food) =>
      food.name.toLowerCase().includes(normalizedSearch),
    );
  }, [transformedFoods, searchTerm]);

  const dishTotals = useMemo(() => {
    return selectedFoods.reduce(
      (totals, selectedFood) => {
        const food = transformedFoods.find(
          (item) => item.id === selectedFood.foodId,
        );
        if (!food) {
          return totals;
        }

        const amount = Number(selectedFood.amount);
        if (!Number.isFinite(amount) || amount <= 0) {
          return totals;
        }

        const factor = amount / 100;

        return {
          calories: totals.calories + food.calories * factor,
          protein: totals.protein + food.protein * factor,
          carbohydrates: totals.carbohydrates + food.carbohydrates * factor,
          fat: totals.fat + food.fat * factor,
        };
      },
      {
        calories: 0,
        protein: 0,
        carbohydrates: 0,
        fat: 0,
      },
    );
  }, [selectedFoods, transformedFoods]);

  function toggleFood(foodId: number) {
    setSelectedFoods((prev) => {
      const isAlreadySelected = prev.some((item) => item.foodId === foodId);
      if (isAlreadySelected) {
        return prev.filter((item) => item.foodId !== foodId);
      }
      return [...prev, { foodId, amount: "100" }];
    });
  }

  function updateAmount(foodId: number, amount: string) {
    if (amount === "0") {
      setSelectedFoods((prev) => prev.filter((item) => item.foodId !== foodId));
      return;
    }

    setSelectedFoods((prev) =>
      prev.map((item) => (item.foodId === foodId ? { ...item, amount } : item)),
    );
  }

  if (transformedFoods.length === 0) {
    return (
      <div>
        <p className="mb-2 block text-sm font-medium text-foreground">
          Foods in this dish
        </p>
        <p className="rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-foreground/60 shadow-sm">
          No foods found yet. Create foods first, then add them to a dish.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-[28px] border border-border/70 bg-surface-elevated p-4 shadow-sm sm:p-5">
      <div>
        <p className="block text-sm font-medium text-foreground">
          Foods in this dish
        </p>
        <p className="mt-1 text-xs text-foreground/60">
          Click a food to add it, then set the amount below.
        </p>
      </div>

      <div>
        <label
          htmlFor="food-search"
          className="mb-1 block text-xs font-semibold uppercase tracking-[0.18em] text-accent"
        >
          Search foods
        </label>
        <input
          id="food-search"
          type="search"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Search by food name"
          className="w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-foreground shadow-sm outline-none transition placeholder:text-foreground/35 focus:border-accent focus:ring-4 focus:ring-accent-soft"
        />
      </div>

      <div className="max-h-64 space-y-2 overflow-y-auto rounded-2xl border border-border bg-surface p-2 shadow-sm">
        {filteredFoods.length === 0 ? (
          <p className="px-2 py-3 text-sm text-foreground/60">
            No foods match your search.
          </p>
        ) : null}

        {filteredFoods.map((food) => {
          const isSelected = selectedFoodIds.has(food.id);

          return (
            <button
              key={food.id}
              type="button"
              onClick={() => toggleFood(food.id)}
              className={`w-full rounded-base border px-3 py-2 text-left text-sm transition-colors ${
                isSelected
                  ? "border-accent bg-accent-soft"
                  : "border-border bg-surface hover:border-accent"
              }`}
              aria-pressed={isSelected}
            >
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-base border border-border bg-surface-elevated">
                  {food.image ? (
                    <img
                      src={food.image}
                      alt={food.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[10px] text-foreground/50">
                      No image
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate font-medium text-foreground">
                      {food.name}
                    </span>
                    <span className="text-xs text-foreground/60">
                      {isSelected ? "Selected" : "Click to add"}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-foreground/60">
                    {food.calories} kcal • P {food.protein / 10} • C{" "}
                    {food.carbohydrates / 10} • F {food.fat / 10}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="space-y-2 rounded-2xl border border-border bg-surface p-4 shadow-sm">
        <p className="text-sm font-medium text-foreground">
          Selected foods and amounts
        </p>

        {selectedFoods.length > 0 ? (
          <div className="rounded-2xl border border-accent/25 bg-accent-soft/40 px-4 py-3 text-sm text-foreground">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">
              Dish totals
            </p>
            <p className="mt-1">
              {dishTotals.calories.toFixed(0)} kcal • P{" "}
              {(dishTotals.protein / 10).toFixed(1)} • C{" "}
              {(dishTotals.carbohydrates / 10).toFixed(1)} • F{" "}
              {(dishTotals.fat / 10).toFixed(1)}
            </p>
          </div>
        ) : null}

        {selectedFoods.length === 0 ? (
          <p className="text-sm text-foreground/60">
            Select one or more foods above.
          </p>
        ) : (
          <div className="space-y-2">
            {selectedFoods.map((selectedFood) => {
              const food = transformedFoods.find(
                (item) => item.id === selectedFood.foodId,
              );
              if (!food) {
                return null;
              }

              return (
                <div
                  key={selectedFood.foodId}
                  className="grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-2xl border border-border px-3 py-2"
                >
                  <div className="h-10 w-10 overflow-hidden rounded-base border border-border bg-surface-elevated">
                    {food.image ? (
                      <img
                        src={food.image}
                        alt={food.name}
                        className="h-full w-full object-cover"
                      />
                    ) : null}
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm text-foreground">
                      {food.name}
                    </p>
                    <p className="text-xs text-foreground/60">
                      {food.calories} kcal • P {food.protein / 10} • C{" "}
                      {food.carbohydrates / 10} • F {food.fat / 10}
                    </p>
                  </div>

                  <label className="flex items-center gap-2 text-sm text-foreground">
                    Amount in grams:
                    <input
                      type="number"
                      min={0}
                      step={1}
                      inputMode="numeric"
                      value={selectedFood.amount}
                      onChange={(event) =>
                        updateAmount(selectedFood.foodId, event.target.value)
                      }
                      className="w-20 rounded-2xl border border-border bg-surface-elevated px-2 py-1 text-sm text-foreground outline-none focus:border-accent focus:ring-4 focus:ring-accent-soft"
                    />
                  </label>

                  <input
                    type="hidden"
                    name="foodIds"
                    value={selectedFood.foodId}
                  />
                  <input
                    type="hidden"
                    name="amounts"
                    value={selectedFood.amount}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
