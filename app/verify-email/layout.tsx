import { Suspense } from "react";
import { buildMetadata } from "@/app/seo";

export const metadata = buildMetadata({
  title: "Verify Email",
  description:
    "Confirm your email address to activate your CalorieCounter account.",
  path: "/verify-email",
  noIndex: true,
});

export default function VerifyEmailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<div className="p-4 text-center">Loading...</div>}>
      {children}
    </Suspense>
  );
}