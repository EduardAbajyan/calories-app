import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import ImageFileInput from "@/components/image-file-input";
import DishFoodsBuilder from "@/components/dish-foods-builder";
import TemporalMessage from "../../../components/temporal-message";

type AddDishSearchParams = {
  success?: string;
  error?: string;
};

export const metadata = {
  title: "Add Dish",
};

export default async function AddDishPage({
  searchParams,
}: {
  searchParams: Promise<AddDishSearchParams>;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/?mode=login");
  }

  const params = await searchParams;
  const isSuccess = params.success === "1";
  const error = params.error;
  const availableFoods = await prisma.food.findMany({
    select: {
      id: true,
      name: true,
      image: true,
      calories: true,
      protein: true,
      carbohydrates: true,
      fat: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  async function addDish(formData: FormData) {
    "use server";

    const activeSession = await auth();
    if (!activeSession?.user?.id) {
      redirect("/?mode=login");
    }

    const name = String(formData.get("name") ?? "").trim();
    const recipe = String(formData.get("recipe") ?? "").trim();
    const imageInput = formData.get("image");
    const foodIdsFromForm = formData.getAll("foodIds");
    const amountsFromForm = formData.getAll("amounts");
    let image: string | null = null;

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

    if (!name) {
      redirect("/add-dish?error=Dish%20name%20is%20required");
    }

    if (parsedIngredients.length === 0 || hasInvalidIngredient) {
      redirect(
        "/add-dish?error=Please%20select%20foods%20with%20valid%20amounts",
      );
    }

    const uniqueFoodIds = Array.from(
      new Set(parsedIngredients.map((ingredient) => ingredient.foodId)),
    );

    const existingFoods = await prisma.food.findMany({
      where: {
        id: {
          in: uniqueFoodIds,
        },
      },
      select: {
        id: true,
      },
    });

    if (existingFoods.length !== uniqueFoodIds.length) {
      redirect(
        "/add-dish?error=One%20or%20more%20selected%20foods%20are%20invalid",
      );
    }

    if (imageInput instanceof File && imageInput.size > 0) {
      if (!imageInput.type.startsWith("image/")) {
        redirect("/add-dish?error=Please%20upload%20a%20valid%20image");
      }

      const maxImageSizeBytes = 2 * 1024 * 1024;
      if (imageInput.size > maxImageSizeBytes) {
        redirect("/add-dish?error=Image%20must%20be%202MB%20or%20smaller");
      }

      const imageBuffer = Buffer.from(await imageInput.arrayBuffer());
      image = `data:${imageInput.type};base64,${imageBuffer.toString("base64")}`;
    }

    try {
      await prisma.dish.create({
        data: {
          name,
          image,
          path: recipe || null,
          ingredients: {
            create: parsedIngredients.map((ingredient) => ({
              food: {
                connect: {
                  id: ingredient.foodId,
                },
              },
              amount: ingredient.amount,
            })),
          },
        },
      });

      redirect("/add-dish?success=1");
    } catch (err: unknown) {
      const isNextRedirectError =
        typeof err === "object" &&
        err !== null &&
        "digest" in err &&
        typeof err.digest === "string" &&
        err.digest.startsWith("NEXT_REDIRECT");

      if (isNextRedirectError) {
        redirect("/add-dish?success=1");
      } else {
        console.error("Error creating dish:", err);
        console.log("cloudinary result:", image);
        redirect("/add-dish?error=Failed%20to%20create%20dish");
      }
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top_left,var(--color-accent-soft),transparent_38%),radial-gradient(circle_at_top_right,var(--color-surface-strong),transparent_34%),linear-gradient(180deg,var(--color-background)_0%,var(--color-surface-elevated)_100%)] p-4 sm:p-8">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="-left-24 -top-20 absolute h-48 w-48 rounded-full bg-accent-soft/70 blur-3xl" />
        <div className="-bottom-16 -right-12 absolute h-56 w-56 rounded-full bg-surface-strong/60 blur-3xl" />
      </div>

      <div className="relative mx-auto flex w-full max-w-2xl flex-col gap-6 rounded-[28px] border border-border/70 bg-surface/75 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.14)] backdrop-blur-xl sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="mb-2 inline-flex rounded-full border border-border bg-surface-elevated px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-accent">
              Meal construction
            </p>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Add dish
            </h1>
            <p className="mt-2 max-w-lg text-sm leading-6 text-foreground/70">
              Create a dish, add its recipe, and build it from foods you have
              already logged.
            </p>
          </div>

          <Link
            href="/dashboard"
            className="inline-flex h-10 items-center rounded-full border border-border bg-surface-elevated px-4 text-sm font-medium text-foreground shadow-sm transition hover:-translate-y-0.5 hover:border-border-strong hover:bg-surface"
          >
            Back to dashboard
          </Link>
        </div>

        {isSuccess ? (
          <TemporalMessage
            className="rounded-2xl border border-success/20 bg-success-soft px-4 py-3 text-sm font-medium text-success shadow-sm"
            message="Dish added successfully."
          />
        ) : null}

        {error ? (
          <TemporalMessage
            className="rounded-2xl border border-danger/20 bg-danger-soft px-4 py-3 text-sm font-medium text-danger shadow-sm"
            message={error}
          />
        ) : null}

        <form action={addDish} className="flex flex-col gap-5">
          <div className="space-y-2">
            <label
              htmlFor="name"
              className="block text-sm font-medium text-foreground"
            >
              Dish name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              placeholder="For example: Chicken stir-fry"
              className="w-full rounded-2xl border border-border bg-surface px-4 py-3 text-foreground shadow-sm outline-none transition placeholder:text-foreground/35 focus:border-accent focus:ring-4 focus:ring-accent-soft"
            />
          </div>

          <ImageFileInput />

          <div className="space-y-2">
            <label
              htmlFor="recipe"
              className="block text-sm font-medium text-foreground"
            >
              Recipe
            </label>
            <textarea
              id="recipe"
              name="recipe"
              rows={6}
              placeholder="Write the cooking steps, seasoning, and any notes here"
              className="w-full rounded-2xl border border-border bg-surface px-4 py-3 text-foreground shadow-sm outline-none transition placeholder:text-foreground/35 focus:border-accent focus:ring-4 focus:ring-accent-soft"
            />
          </div>

          <DishFoodsBuilder availableFoods={availableFoods} />

          <div className="pt-2 flex justify-center">
            <button
              type="submit"
              className="inline-flex w-full max-w-xs items-center justify-center rounded-full bg-accent px-5 py-3 text-sm font-bold uppercase tracking-[0.18em] text-accent-foreground shadow-[0_14px_30px_rgba(0,0,0,0.18)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_36px_rgba(0,0,0,0.24)]"
            >
              Save dish
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
