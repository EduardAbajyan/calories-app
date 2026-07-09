"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import type { GenerateRecipeState } from "@/app/(meal_construction)/add-dish/recipe-state";

type IngredientWithFood = {
  foodId: number;
  amount: number;
  food: {
    id: number;
    name: string;
    calories: number;
    protein: number;
    carbohydrates: number;
    fat: number;
  };
};

function extractFirstJsonObject(text: string): string | null {
  const fencedJsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/i);
  if (fencedJsonMatch?.[1]) {
    return fencedJsonMatch[1].trim();
  }

  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");

  if (start === -1 || end === -1 || end <= start) {
    return null;
  }

  return text.slice(start, end + 1);
}

export async function generateRecipeAction(
  _prevState: GenerateRecipeState,
  formData: FormData,
): Promise<GenerateRecipeState> {
  const session = await auth();
  if (!session?.user?.id) {
    return {
      recipe: "",
      error: "You must be signed in.",
      generated: false,
    };
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      recipe: "",
      error: "Server is missing GEMINI_API_KEY.",
      generated: false,
    };
  }

  const dishName = String(formData.get("name") ?? "").trim();
  const foodIdsFromForm = formData.getAll("foodIds");
  const amountsFromForm = formData.getAll("amounts");

  const parsedIngredients = foodIdsFromForm.map((foodIdValue, index) => ({
    foodId: Number(foodIdValue),
    amount: Number(amountsFromForm[index] ?? ""),
  }));

  const hasInvalidIngredient = parsedIngredients.some(
    (ingredient) =>
      !Number.isInteger(ingredient.foodId) ||
      ingredient.foodId <= 0 ||
      !Number.isInteger(ingredient.amount) ||
      ingredient.amount <= 0,
  );

  if (parsedIngredients.length === 0 || hasInvalidIngredient) {
    return {
      recipe: "",
      error: "Please select foods with valid amounts first.",
      generated: false,
    };
  }

  const uniqueFoodIds = Array.from(
    new Set(parsedIngredients.map((ingredient) => ingredient.foodId)),
  );

  const foods = await prisma.food.findMany({
    where: {
      id: {
        in: uniqueFoodIds,
      },
    },
    select: {
      id: true,
      name: true,
      calories: true,
      protein: true,
      carbohydrates: true,
      fat: true,
    },
  });

  if (foods.length !== uniqueFoodIds.length) {
    return {
      recipe: "",
      error: "One or more selected foods are invalid.",
      generated: false,
    };
  }

  const foodById = new Map(foods.map((food) => [food.id, food]));

  const ingredientsWithFood: IngredientWithFood[] = [];
  for (const ingredient of parsedIngredients) {
    const food = foodById.get(ingredient.foodId);
    if (!food) {
      return {
        recipe: "",
        error: "One or more selected foods are invalid.",
        generated: false,
      };
    }

    ingredientsWithFood.push({
      ...ingredient,
      food,
    });
  }

  const ingredientLines = ingredientsWithFood
    .map((ingredient) => {
      const factor = ingredient.amount / 100;
      const proteinGrams = (ingredient.food.protein * factor) / 10;
      const carbsGrams = (ingredient.food.carbohydrates * factor) / 10;
      const fatGrams = (ingredient.food.fat * factor) / 10;
      const calories = ingredient.food.calories * factor;

      return [
        `- ${ingredient.food.name}: ${ingredient.amount}g`,
        `  calories: ${calories.toFixed(0)} kcal`,
        `  protein: ${proteinGrams.toFixed(1)} g`,
        `  carbohydrates: ${carbsGrams.toFixed(1)} g`,
        `  fat: ${fatGrams.toFixed(1)} g`,
      ].join("\n");
    })
    .join("\n");

  const prompt = [
    "Create concise cooking instructions for this dish.",
    `Dish name: ${dishName || "Unnamed dish"}`,
    "Ingredients and macros:",
    ingredientLines,
    "Output rules:",
    "1) Return valid JSON only.",
    '2) The JSON must contain exactly one property: "recipe".',
    "3) The recipe value must be plain text instructions in English.",
    "4) Do not include markdown code fences.",
  ].join("\n\n");

  const configuredModel = (
    process.env.GEMINI_MODEL ?? "gemini-2.5-flash"
  ).trim();
  const candidateModels = Array.from(
    new Set(
      [configuredModel, "gemini-2.5-flash", "gemini-2.5-flash-lite"].filter(
        (model) => model.length > 0,
      ),
    ),
  );

  try {
    let data: {
      candidates?: Array<{
        content?: {
          parts?: Array<{
            text?: string;
          }>;
        };
      }>;
    } | null = null;
    let lastStatus = 0;
    let lastFailureBody = "";

    for (const model of candidateModels) {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [{ text: prompt }],
              },
            ],
            generationConfig: {
              responseMimeType: "application/json",
            },
          }),
        },
      );

      if (response.ok) {
        data = (await response.json()) as {
          candidates?: Array<{
            content?: {
              parts?: Array<{
                text?: string;
              }>;
            };
          }>;
        };
        break;
      }

      lastStatus = response.status;
      lastFailureBody = await response.text();
      console.error(
        "Gemini generation failed:",
        model,
        response.status,
        lastFailureBody,
      );

      if (response.status === 404) {
        continue;
      }

      if (response.status === 429) {
        return {
          recipe: "",
          error: "Gemini quota exceeded. Please wait a minute and try again.",
          generated: false,
        };
      }

      return {
        recipe: "",
        error: "Failed to generate recipe.",
        generated: false,
      };
    }

    if (!data) {
      if (lastStatus === 404) {
        return {
          recipe: "",
          error:
            "Gemini model is unavailable. Set GEMINI_MODEL to an available model and try again.",
          generated: false,
        };
      }

      if (lastStatus === 429) {
        return {
          recipe: "",
          error: "Gemini quota exceeded. Please wait a minute and try again.",
          generated: false,
        };
      }

      if (lastFailureBody) {
        console.error("Gemini final failure body:", lastFailureBody);
      }

      return {
        recipe: "",
        error: "Failed to generate recipe.",
        generated: false,
      };
    }

    const rawText =
      data.candidates?.[0]?.content?.parts
        ?.map((part) => part.text ?? "")
        .join("\n")
        .trim() ?? "";

    const candidateJson = extractFirstJsonObject(rawText);
    if (!candidateJson) {
      return {
        recipe: "",
        error: "Gemini returned an invalid format.",
        generated: false,
      };
    }

    const parsedUnknown = JSON.parse(candidateJson) as unknown;

    if (
      typeof parsedUnknown !== "object" ||
      parsedUnknown === null ||
      Array.isArray(parsedUnknown)
    ) {
      return {
        recipe: "",
        error: "Gemini returned an invalid format.",
        generated: false,
      };
    }

    const parsed = parsedUnknown as Record<string, unknown>;
    const keys = Object.keys(parsed);

    if (keys.length !== 1 || keys[0] !== "recipe") {
      return {
        recipe: "",
        error: "Gemini returned an invalid format.",
        generated: false,
      };
    }

    const recipe =
      typeof parsed.recipe === "string" ? parsed.recipe.trim() : "";

    if (!recipe) {
      return {
        recipe: "",
        error: "Gemini did not return a recipe.",
        generated: false,
      };
    }

    return {
      recipe,
      error: null,
      generated: true,
    };
  } catch (error) {
    console.error("Failed to generate recipe:", error);
    return {
      recipe: "",
      error: "Failed to generate recipe.",
      generated: false,
    };
  }
}
