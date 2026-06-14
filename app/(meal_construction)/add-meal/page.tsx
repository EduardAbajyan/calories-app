import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import ImageFileInput from "@/components/image-file-input";
import MealDishesBuilder from "@/components/meal-dishes-builder";
import TemporalMessage from "../../../components/temporal-message";

type AddMealSearchParams = {
  success?: string;
  error?: string;
};

export const metadata = {
  title: "Add Meal",
};

export default async function AddMealPage({
  searchParams,
}: {
  searchParams: Promise<AddMealSearchParams>;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/?mode=login");
  }

  const params = await searchParams;
  const isSuccess = params.success === "1";
  const error = params.error;
  const availableDishes = await prisma.dish.findMany({
    select: {
      id: true,
      name: true,
      image: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  async function addMeal(formData: FormData) {
    "use server";

    const activeSession = await auth();
    if (!activeSession?.user?.id) {
      redirect("/?mode=login");
    }

    const name = String(formData.get("name") ?? "").trim();
    const imageInput = formData.get("image");
    const dishIdsFromForm = formData.getAll("dishIds");
    let image: string | null = null;
    const parsedDishIds = dishIdsFromForm
      .map((value) => Number(value))
      .filter((value) => Number.isInteger(value) && value > 0);

    const uniqueDishIds = Array.from(new Set(parsedDishIds));
    const selectedDishes = uniqueDishIds.length
      ? await prisma.dish.findMany({
          where: {
            id: {
              in: uniqueDishIds,
            },
          },
          select: {
            id: true,
          },
        })
      : [];

    if (!name) {
      redirect("/add-meal?error=Meal%20name%20is%20required");
    }

    if (uniqueDishIds.length === 0) {
      redirect("/add-meal?error=Please%20select%20at%20least%20one%20dish");
    }

    if (selectedDishes.length !== uniqueDishIds.length) {
      redirect(
        "/add-meal?error=One%20or%20more%20selected%20dishes%20are%20invalid",
      );
    }

    if (imageInput instanceof File && imageInput.size > 0) {
      if (!imageInput.type.startsWith("image/")) {
        redirect("/add-meal?error=Please%20upload%20a%20valid%20image");
      }

      const maxImageSizeBytes = 2 * 1024 * 1024;
      if (imageInput.size > maxImageSizeBytes) {
        redirect("/add-meal?error=Image%20must%20be%202MB%20or%20smaller");
      }

      const imageBuffer = Buffer.from(await imageInput.arrayBuffer());
      image = `data:${imageInput.type};base64,${imageBuffer.toString("base64")}`;
    }

    try {
      await prisma.meal.create({
        data: {
          name,
          image,
          dishes: {
            create: selectedDishes.map((dish) => ({
              dish: {
                connect: {
                  id: dish.id,
                },
              },
            })),
          },
        },
      });

      redirect("/add-meal?success=1");
    } catch (err: unknown) {
      const isNextRedirectError =
        typeof err === "object" &&
        err !== null &&
        "digest" in err &&
        typeof err.digest === "string" &&
        err.digest.startsWith("NEXT_REDIRECT");

      if (isNextRedirectError) {
        redirect("/add-meal?success=1");
      } else {
        console.error("Error creating meal:", err);
        console.log("cloudinary result:", image);
        redirect("/add-meal?error=Failed%20to%20create%20meal");
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
              Add meal
            </h1>
            <p className="mt-2 max-w-lg text-sm leading-6 text-foreground/70">
              Group dishes together into a meal and attach an optional image and
              description.
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
            message="Meal added successfully."
          />
        ) : null}

        {error ? (
          <TemporalMessage
            className="rounded-2xl border border-danger/20 bg-danger-soft px-4 py-3 text-sm font-medium text-danger shadow-sm"
            message={error}
          />
        ) : null}

        <form action={addMeal} className="flex flex-col gap-5">
          <div className="space-y-2">
            <label
              htmlFor="name"
              className="block text-sm font-medium text-foreground"
            >
              Meal name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              placeholder="For example: Chicken bowl"
              className="w-full rounded-2xl border border-border bg-surface px-4 py-3 text-foreground shadow-sm outline-none transition placeholder:text-foreground/35 focus:border-accent focus:ring-4 focus:ring-accent-soft"
            />
          </div>

          <ImageFileInput />

          <MealDishesBuilder availableDishes={availableDishes} />

          <div className="pt-2 flex justify-center">
            <button
              type="submit"
              className="inline-flex w-full max-w-xs items-center justify-center rounded-full bg-accent px-5 py-3 text-sm font-bold uppercase tracking-[0.18em] text-accent-foreground shadow-[0_14px_30px_rgba(0,0,0,0.18)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_36px_rgba(0,0,0,0.24)]"
            >
              Save meal
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
