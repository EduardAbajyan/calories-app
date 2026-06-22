import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import ImageFileInput from "@/components/image-file-input";
import TemporalMessage from "../../../components/temporal-message";
import cloudinary from "@/cludinary";

type AddFoodSearchParams = {
  success?: string;
  error?: string;
};

export const metadata = {
  title: "Add Food",
};

export default async function AddFoodPage({
  searchParams,
}: {
  searchParams: Promise<AddFoodSearchParams>;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/?mode=login");
  }

  const params = await searchParams;
  const isSuccess = params.success === "1";
  const error = params.error;

  async function addFood(formData: FormData) {
    "use server";

    const activeSession = await auth();
    if (!activeSession?.user?.id) {
      redirect("/?mode=login");
    }

    const name = String(formData.get("name") ?? "").trim();
    const proteinRaw = String(formData.get("protein") ?? "").trim();
    const carbohydratesRaw = String(formData.get("carbohydrates") ?? "").trim();
    const fatRaw = String(formData.get("fat") ?? "").trim();
    const caloriesRaw = String(formData.get("calories") ?? "").trim();
    const imageInput = formData.get("image");
    let image: string | null = null;

    if (!name) {
      redirect("/add-food?error=Food%20name%20is%20required");
    }

    const protein = Number(proteinRaw) * 10;
    const carbohydrates = Number(carbohydratesRaw) * 10;
    const fat = Number(fatRaw) * 10;
    const calories = Number(caloriesRaw);

    if (protein < 0 || carbohydrates < 0 || fat < 0 || calories < 0) {
      redirect(
        "/add-food?error=Macros%20and%20calories%20cannot%20be%20negative",
      );
    }

    if (imageInput instanceof File && imageInput.size > 0) {
      if (!imageInput.type.startsWith("image/")) {
        redirect("/add-food?error=Please%20upload%20a%20valid%20image");
      }

      const maxImageSizeBytes = 2 * 1024 * 1024;
      if (imageInput.size > maxImageSizeBytes) {
        redirect("/add-food?error=Image%20must%20be%202MB%20or%20smaller");
      }

      const imageBuffer = Buffer.from(await imageInput.arrayBuffer());

      const result = await new Promise<any>((resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            {
              folder: "my-images",
            },
            (err, res) => {
              if (err) return reject(err);
              resolve(res);
            },
          )
          .end(imageBuffer);
      });

      image = result.secure_url;
    }

    try {
      await prisma.food.create({
        data: {
          name,
          protein,
          carbohydrates,
          fat,
          calories,
          image,
        },
      });

      redirect("/add-food?success=1");
    } catch (err: unknown) {
      const isNextRedirectError =
        typeof err === "object" &&
        err !== null &&
        "digest" in err &&
        typeof err.digest === "string" &&
        err.digest.startsWith("NEXT_REDIRECT");

      if (isNextRedirectError) {
        redirect("/add-food?success=1");
      } else {
        console.error("Error creating food:", err);
        console.log("cloudinary result:", image);
        redirect("/add-food?error=Failed%20to%20create%20food");
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
              Food log
            </p>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Add food
            </h1>
            <p className="mt-2 max-w-lg text-sm leading-6 text-foreground/70">
              Create a new food entry with macros, calories, and an optional
              preview image.
            </p>
          </div>
        </div>

        {isSuccess ? (
          <TemporalMessage
            className="rounded-2xl border border-success/20 bg-success-soft px-4 py-3 text-sm font-medium text-success shadow-sm"
            message="Food added successfully."
          />
        ) : null}

        {error ? (
          <TemporalMessage
            className="rounded-2xl border border-danger/20 bg-danger-soft px-4 py-3 text-sm font-medium text-danger shadow-sm"
            message={error}
          />
        ) : null}

        <form action={addFood} className="flex flex-col gap-5">
          <div className="space-y-2">
            <label
              htmlFor="name"
              className="block text-sm font-medium text-foreground"
            >
              Food name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              placeholder="For example: Chicken breast"
              className="w-full rounded-2xl border border-border bg-surface px-4 py-3 text-foreground shadow-sm outline-none transition placeholder:text-foreground/35 focus:border-accent focus:ring-4 focus:ring-accent-soft"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label
                htmlFor="protein"
                className="block text-sm font-medium text-foreground"
              >
                Protein (g)
              </label>
              <input
                id="protein"
                name="protein"
                type="number"
                required
                min={0}
                step={0.1}
                placeholder="0"
                className="w-full rounded-2xl border border-border bg-surface px-4 py-3 text-foreground shadow-sm outline-none transition placeholder:text-foreground/35 focus:border-accent focus:ring-4 focus:ring-accent-soft"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="carbohydrates"
                className="block text-sm font-medium text-foreground"
              >
                Carbohydrates (g)
              </label>
              <input
                id="carbohydrates"
                name="carbohydrates"
                type="number"
                required
                min={0}
                step={0.1}
                placeholder="0"
                className="w-full rounded-2xl border border-border bg-surface px-4 py-3 text-foreground shadow-sm outline-none transition placeholder:text-foreground/35 focus:border-accent focus:ring-4 focus:ring-accent-soft"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="fat"
                className="block text-sm font-medium text-foreground"
              >
                Fat (g)
              </label>
              <input
                id="fat"
                name="fat"
                type="number"
                required
                min={0}
                step={0.1}
                placeholder="0"
                className="w-full rounded-2xl border border-border bg-surface px-4 py-3 text-foreground shadow-sm outline-none transition placeholder:text-foreground/35 focus:border-accent focus:ring-4 focus:ring-accent-soft"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="calories"
                className="block text-sm font-medium text-foreground"
              >
                Calories
              </label>
              <input
                id="calories"
                name="calories"
                type="number"
                required
                min={0}
                step={1}
                placeholder="0"
                className="w-full rounded-2xl border border-border bg-surface px-4 py-3 text-foreground shadow-sm outline-none transition placeholder:text-foreground/35 focus:border-accent focus:ring-4 focus:ring-accent-soft"
              />
            </div>
          </div>

          <ImageFileInput />

          <div className="pt-2 flex justify-center">
            <button
              type="submit"
              className="inline-flex w-full max-w-xs items-center justify-center rounded-full bg-accent px-5 py-3 text-sm font-bold uppercase tracking-[0.18em] text-accent-foreground shadow-[0_14px_30px_rgba(0,0,0,0.18)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_36px_rgba(0,0,0,0.24)]"
            >
              Save food
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
