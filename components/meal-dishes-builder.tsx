"use client";

import { useMemo, useState } from "react";

type DishOption = {
  id: number;
  name: string;
  image: string | null;
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
};

type SelectedDish = {
  dishId: number;
  amount: string;
};

export default function MealDishesBuilder({
	availableDishes,
}: {
	availableDishes: DishOption[];
}) {
	const [selectedDishes, setSelectedDishes] = useState<SelectedDish[]>([]);
	const [searchTerm, setSearchTerm] = useState("");

	const selectedDishIds = useMemo(
		() => new Set(selectedDishes.map((dish) => dish.dishId)),
		[selectedDishes],
	);

	const filteredDishes = useMemo(() => {
		const normalizedSearch = searchTerm.trim().toLowerCase();

		if (!normalizedSearch) {
			return availableDishes;
		}

		return availableDishes.filter((dish) =>
			dish.name.toLowerCase().includes(normalizedSearch),
		);
	}, [availableDishes, searchTerm]);

	function toggleDish(dishId: number) {
		setSelectedDishes((prev) => {
			const isAlreadySelected = prev.some((item) => item.dishId === dishId);
			if (isAlreadySelected) {
				return prev.filter((item) => item.dishId !== dishId);
			}

			return [...prev, { dishId, amount: "100" }];
		});
	}

	function updateAmount(dishId: number, amount: string) {
    if (amount === "0") {
      setSelectedDishes((prev) =>
        prev.filter((item) => item.dishId !== dishId),
      );
      return;
    }

    setSelectedDishes((prev) =>
      prev.map((item) => (item.dishId === dishId ? { ...item, amount } : item)),
    );
  }

	return (
		<div className="space-y-4 rounded-[28px] border border-border/70 bg-surface-elevated p-4 shadow-sm sm:p-5">
			<div>
				<p className="block text-sm font-medium text-foreground">Dishes in this meal</p>
				<p className="mt-1 text-xs text-foreground/60">Click a dish to add it to the meal.</p>
			</div>
			{availableDishes.length === 0 ? (
				<p className="rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-foreground/60 shadow-sm">
					No dishes found yet. Create dishes first, then attach them to a meal.
				</p>
			) : (
				<>
					<div>
						<label htmlFor="dish-search" className="mb-1 block text-xs font-semibold uppercase tracking-[0.18em] text-accent">
							Search dishes
						</label>
						<input
							id="dish-search"
							type="search"
							value={searchTerm}
							onChange={(event) => setSearchTerm(event.target.value)}
							placeholder="Search by dish name"
							className="w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-foreground shadow-sm outline-none transition placeholder:text-foreground/35 focus:border-accent focus:ring-4 focus:ring-accent-soft"
						/>
					</div>

					<div className="max-h-64 space-y-2 overflow-y-auto rounded-2xl border border-border bg-surface p-2 shadow-sm">
						{filteredDishes.length === 0 ? (
							<p className="px-2 py-3 text-sm text-foreground/60">No dishes match your search.</p>
						) : null}

						{filteredDishes.map((dish) => {
							const isSelected = selectedDishIds.has(dish.id);

							return (
                <button
                  key={dish.id}
                  type="button"
                  onClick={() => toggleDish(dish.id)}
                  className={`w-full rounded-base border px-3 py-2 text-left text-sm transition-colors ${
                    isSelected
                      ? "border-accent bg-accent-soft"
                      : "border-border bg-surface hover:border-accent"
                  }`}
                  aria-pressed={isSelected}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 shrink-0 overflow-hidden rounded-base border border-border bg-surface-elevated">
                      {dish.image ? (
                        <img
                          src={dish.image}
                          alt={dish.name}
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
                          {dish.name}
                        </span>
                        <span className="text-xs text-foreground/60">
                          {isSelected ? "Selected" : "Click to add"}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-foreground/60">
                        {dish.calories.toFixed(0)} kcal • P{" "}
                        {dish.protein.toFixed(1)} • C{" "}
                        {dish.carbohydrates.toFixed(1)} • F{" "}
                        {dish.fat.toFixed(1)}
                      </p>
                    </div>
                  </div>
                </button>
              );
						})}
					</div>

						<div className="space-y-2 rounded-2xl border border-border bg-surface p-4 shadow-sm">
							<p className="text-sm font-medium text-foreground">Selected dishes</p>

						{selectedDishes.length === 0 ? (
								<p className="text-sm text-foreground/60">Select one or more dishes above.</p>
						) : (
							<div className="space-y-2">
								{selectedDishes.map((selectedDish) => {
									const dish = availableDishes.find((item) => item.id === selectedDish.dishId);
									if (!dish) {
										return null;
									}

									return (
                    <div
                      key={selectedDish.dishId}
                      className="grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-2xl border border-border px-3 py-2"
                    >
                      <div className="h-10 w-10 overflow-hidden rounded-base border border-border bg-surface-elevated">
                        {dish.image ? (
                          <img
                            src={dish.image}
                            alt={dish.name}
                            className="h-full w-full object-cover"
                          />
                        ) : null}
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm text-foreground">
                          {dish.name}
                        </p>
                        <p className="text-xs text-foreground/60">
                          {dish.calories.toFixed(0)} kcal • P{" "}
                          {dish.protein.toFixed(1)} • C{" "}
                          {dish.carbohydrates.toFixed(1)} • F{" "}
                          {dish.fat.toFixed(1)}
                        </p>
                      </div>

                      <label className="flex items-center gap-2 text-sm text-foreground">
                        Amount in grams:
                        <input
                          type="number"
                          min={0}
                          step={1}
                          inputMode="numeric"
                          value={selectedDish.amount}
                          onChange={(event) =>
                            updateAmount(
                              selectedDish.dishId,
                              event.target.value,
                            )
                          }
                          className="w-20 rounded-2xl border border-border bg-surface-elevated px-2 py-1 text-sm text-foreground outline-none focus:border-accent focus:ring-4 focus:ring-accent-soft"
                        />
                      </label>

                      <input
                        type="hidden"
                        name="dishIds"
                        value={selectedDish.dishId}
                      />
                      <input
                        type="hidden"
                        name="amounts"
                        value={selectedDish.amount}
                      />
                    </div>
                  );
								})}
							</div>
						)}
					</div>
				</>
			)}
		</div>
	);
}
