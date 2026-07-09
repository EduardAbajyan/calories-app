"use client";

import { useActionState, useEffect, useState } from "react";
import { generateRecipeAction } from "@/app/(meal_construction)/add-dish/actions";
import { initialGenerateRecipeState } from "@/app/(meal_construction)/add-dish/recipe-state";

export default function RecipeGeneratorField() {
  const [state, formAction, isPending] = useActionState(
    generateRecipeAction,
    initialGenerateRecipeState,
  );
  const [pathValue, setPathValue] = useState("");
  const [isGenerateHidden, setIsGenerateHidden] = useState(false);

  useEffect(() => {
    if (!state.generated || !state.recipe) {
      return;
    }

    setPathValue(state.recipe);
    setIsGenerateHidden(true);
  }, [state.generated, state.recipe]);

  return (
    <div className="space-y-2 rounded-3xl border border-border bg-surface-elevated p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <label htmlFor="path" className="block text-sm font-medium text-foreground">
          Recipe (optional)
        </label>

        {!isGenerateHidden ? (
          <button
            type="submit"
            formAction={formAction}
            formNoValidate
            disabled={isPending}
            className="inline-flex items-center rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-foreground shadow-sm transition hover:-translate-y-0.5 hover:border-border-strong hover:bg-surface-elevated disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isPending ? "Generating..." : "Generate"}
          </button>
        ) : null}
      </div>

      <textarea
        id="path"
        name="path"
        rows={4}
        value={pathValue}
        onChange={(event) => setPathValue(event.target.value)}
        placeholder="Write the recipe instructions for this dish"
        className="w-full resize-y rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-foreground shadow-sm outline-none transition placeholder:text-foreground/35 focus:border-accent focus:ring-4 focus:ring-accent-soft"
      />

      {state.error ? (
        <p className="text-xs font-medium text-danger">{state.error}</p>
      ) : null}

      <p className="text-xs text-foreground/60">
        This recipe will be saved in the dish path field.
      </p>
    </div>
  );
}