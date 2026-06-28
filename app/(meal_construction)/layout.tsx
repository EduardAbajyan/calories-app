import Sidebar from "@/components/dashboard/sidebar";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { buildMetadata } from "@/app/seo";

export const metadata = buildMetadata({
  title: "Meal Construction",
  description:
    "Create foods, build dishes, and compose meals with automatic calories and macro totals.",
  path: "/add-food",
  noIndex: true,
});

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect("/?mode=login");
  }
  return (
    <>
      <Sidebar />
      <div className="p-0 md:ml-64 min-h-screen">
        <div className="p-0 min-h-screen">{children}</div>
      </div>
    </>
  );
}
