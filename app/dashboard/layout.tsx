import Sidebar from "@/components/dashboard/sidebar";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Dashboard",
};

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  table,
  meals,
}: {
  table: React.ReactNode;
  meals: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect("/?mode=login");
  }
  return (
    <>
      <Sidebar />
      <div className="py-4 sm:py-8 h-screen  min-w-full md:min-w-[calc(100%-16rem)] md:ml-64">
        <div className="relative p-0 md:p-4 h-full sm:p-0  min-w-full md:min-w-[calc(100%-16rem)] justify-center items-center flex">
          <div className="relative sm:p-0 min-w-11/12 md:min-w-full max-w-10/12 md:max-w-full h-full flex flex-col items-center justify-around rounded-base bg-neutral-secondary-soft gap-5">
            {table}
            {meals}
          </div>
        </div>
      </div>
    </>
  );
}
