import Sidebar from "@/components/dashboard/sidebar";
import Main from "@/components/dashboard/main";
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
      <button
        data-drawer-target="default-sidebar"
        data-drawer-toggle="default-sidebar"
        aria-controls="default-sidebar"
        type="button"
        className="text-heading bg-transparent box-border border border-transparent hover:bg-neutral-secondary-medium focus:ring-4 focus:ring-neutral-tertiary font-medium leading-5 rounded-base ms-3 mt-3 text-sm p-2 focus:outline-none inline-flex sm:hidden"
      >
        <span className="sr-only">Open sidebar</span>
        <svg
          className="w-6 h-6"
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          fill="none"
          viewBox="0 0 24 24"
        >
          <path
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="2"
            d="M5 7h14M5 12h14M5 17h10"
          />
        </svg>
      </button>
      <Sidebar />
      <div className="p-0 sm:ml-64 h-screen">
        <div className="p-4 h-full">
          <div className="h-full flex flex-col items-center justify-around rounded-base bg-neutral-secondary-soft ">
            {table}
            {meals}
          </div>
        </div>
      </div>
    </>
  );
}

// "use server";
// import { signOut } from "@/auth";

// export default async function DashboardPage({
//   searchParams,
// }: {
//   searchParams: { message?: string };
// }) {
//   const message = (await searchParams).message;

//   async function handleSignOut() {
//     "use server";
//     return await signOut({ redirectTo: "/" });
//   }

//   return (
//     <div>
//       <p>Dashboard</p>
//       {message && <p>{message}</p>}
//       <form action={handleSignOut}>
//         <button type="submit">Go back to Home</button>
//       </form>
//     </div>
//   );
// }
