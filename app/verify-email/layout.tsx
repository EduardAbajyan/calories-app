import { Suspense } from "react";

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