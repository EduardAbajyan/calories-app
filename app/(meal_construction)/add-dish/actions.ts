import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export type GenerateRecipeState = {
  recipe: string;
  error: string | null;
  generated: boolean;
};

export const initialGenerateRecipeState: GenerateRecipeState = {
  recipe: "",
  error: null,
  generated: false,
};

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
  "use server";

  console.log(`/n/n/n/nGenerating \n\n\n\n\nrecipe with formData: `, formData); // Debugging line

  const session = await auth();
  if (!session?.user?.id) {
    return {
      recipe: "",
      error: "You must be signed in.",
      generated: false,
    };
  }

  console.log("User session:", session);

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      recipe: "",
      error: "Server is missing GEMINI_API_KEY.",
      generated: false,
    };
  }

  console.log("GEMINI_API_KEY is present.");

  const dishName = String(formData.get("name") ?? "").trim();
  const foodIdsFromForm = formData.getAll("foodIds");
  const amountsFromForm = formData.getAll("amounts");

  const parsedIngredients = foodIdsFromForm.map((foodIdValue, index) => ({
    foodId: Number(foodIdValue),
    amount: Number(amountsFromForm[index] ?? ""),
  }));

  console.log("Parsed ingredients:", parsedIngredients);

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

  console.log("Ingredients with food details:", ingredientsWithFood);

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

  console.log("Ingredient lines for prompt:", ingredientLines);

  const prompt = [
    "Create concise cooking instructions for this dish.",
    `Dish name: ${dishName || "Unnamed dish"}`,
    "Ingredients and macros:",
    ingredientLines,
    "Output rules:",
    "1) Return valid JSON only.",
    '2) The JSON must contain exactly one property: "recipe".',
    "3) The recipe value must be plain text instructions in English.",
  ].join("\n\n");

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(apiKey)}`,
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
            responseSchema: {
              type: "OBJECT",
              properties: {
                recipe: {
                  type: "STRING",
                },
              },
              required: ["recipe"],
            },
          },
        }),
      },
    );

    console.log("Gemini API response status:", response.status);

    if (!response.ok) {
      return {
        recipe: "",
        error: "Failed to generate recipe.",
        generated: false,
      };
    }

    const data = (await response.json()) as {
      candidates?: Array<{
        content?: {
          parts?: Array<{
            text?: string;
          }>;
        };
      }>;
    };

    console.log("Gemini API response data:", data);

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

    const parsed = JSON.parse(candidateJson) as { recipe?: unknown };
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
