import Sidebar from "@/components/dashboard/sidebar";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Dishes",
};

export const dynamic = "force-dynamic";

export default async function DishesLayout({
  children,
  resipes,
  choosed,
}: {
  children: React.ReactNode;
  resipes: React.ReactNode;
  choosed: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect("/?mode=login");
  }

  return (
    <>
      <Sidebar />
      <div className="min-w-full py-4 md:ml-64 md:min-w-[calc(100%-16rem)] sm:py-8">
        <div className="relative flex h-full min-w-full items-center justify-center p-0 sm:p-0 md:min-w-[calc(100%-16rem)] md:p-4">
          <div className="relative flex h-full min-w-11/12 max-w-10/12 flex-col gap-5 rounded-base bg-neutral-secondary-soft p-3 sm:p-4 md:min-w-full md:max-w-full">
            <div className="rounded-[28px] border border-border/70 bg-surface/80 px-6 py-5 shadow-[0_20px_60px_rgba(0,0,0,0.12)] backdrop-blur-xl">
              <p className="mb-2 inline-flex rounded-full border border-border bg-surface-elevated px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-accent">
                Dish explorer
              </p>
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                Search and inspect dishes
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-foreground/70">
                Browse dish cards on the left and open full ingredient and macro
                details on the right.
              </p>
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              {resipes}
              {choosed}
            </div>
            {children}
          </div>
        </div>
      </div>
    </>
  );
}
