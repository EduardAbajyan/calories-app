import Image from "next/image";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

import styles from "./page.module.css";
import logo from "./assets/logo.png";

import GoogleSingIn from "@/components/google-sign-in-button";
import AuthForm from "@/components/credentials-sign-in-form";
import { AuthPendingProvider } from "@/components/auth-pending-context";

const appScreenshots = [
  {
    id: "1",
    src: "https://res.cloudinary.com/dgh4grnch/image/upload/v1782558715/1_lv5wkc.png",
    alt: "Dashboard with date picker and daily nutrition table",
    title: "Daily dashboard",
  },
  {
    id: "2",
    src: "https://res.cloudinary.com/dgh4grnch/image/upload/v1782558716/2_gt81ou.png",
    alt: "Foods search and quick add list",
    title: "Food search",
  },
  {
    id: "3",
    src: "https://res.cloudinary.com/dgh4grnch/image/upload/v1782558716/3_yo6igj.png",
    alt: "Dish explorer and recipe cards",
    title: "Dish explorer",
  },
  {
    id: "4",
    src: "https://res.cloudinary.com/dgh4grnch/image/upload/v1782558716/4_yw74tn.png",
    alt: "Dish details modal with recipe, macros, and ingredients",
    title: "Recipe spotlight",
  },
  {
    id: "5",
    src: "https://res.cloudinary.com/dgh4grnch/image/upload/v1782558716/5_lpuaq1.png",
    alt: "Add food form with macro inputs and image upload",
    title: "Create foods",
  },
  {
    id: "7",
    src: "https://res.cloudinary.com/dgh4grnch/image/upload/v1782558716/7_tjaspn.png",
    alt: "Dish builder with selected foods and totals",
    title: "Build dishes",
  },
  {
    id: "8",
    src: "https://res.cloudinary.com/dgh4grnch/image/upload/v1782558716/8_s9x70y.png",
    alt: "Meal builder with selected dishes and totals",
    title: "Build meals",
  },
];

export default async function Home({
  searchParams,
}: {
  searchParams: { mode?: "login" | "signup" };
}) {
  const session = await auth();
  if (!session) {
    const Params = await searchParams;
    const mode = Params.mode ?? "login";
    return (
      <div className={styles.container}>
        <div className={styles.authShell}>
          <div className={styles.brandBlock}>
            <Image
              src={logo}
              alt="Calorie tracker logo"
              width={315}
              height={270}
              loading="eager"
            />
            <p className={styles.tagline}>Meal Tracker</p>
            <h1 className={styles.title}>
              Simple daily logging with reusable recipes
            </h1>
            <p className={styles.subtitle}>
              Track foods, compose dishes, and combine dishes into meals while
              automatically calculating calories and macros.
            </p>
          </div>

          <div className={styles.authPanel}>
            <AuthPendingProvider>
              <GoogleSingIn />
              <AuthForm mode={mode} />
            </AuthPendingProvider>
          </div>
        </div>

        <section
          className={styles.introSection}
          aria-label="Application introduction"
        >
          <div className={styles.introHeader}>
            <p className={styles.eyebrow}>Quick Tour</p>
            <h2>Everything in one flow</h2>
            <p>
              Search foods, build dishes from ingredients, combine dishes into
              meals, and review totals by date from the dashboard.
            </p>
          </div>

          <div className={styles.gallery}>
            {appScreenshots.map((shot) => (
              <article key={shot.id} className={styles.shotCard}>
                <div className={styles.shotImageWrap}>
                  <Image
                    src={shot.src}
                    alt={shot.alt}
                    fill
                    sizes="(max-width: 768px) 92vw, (max-width: 1200px) 44vw, 320px"
                    className={styles.shotImage}
                  />
                </div>
                <p className={styles.shotTitle}>{shot.title}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    );
  } else {
    return redirect("/dashboard");
  }
}
