import Sidebar from "@/components/dashboard/sidebar";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Dashboard",
};

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
