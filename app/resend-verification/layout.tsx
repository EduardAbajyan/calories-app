import { buildMetadata } from "@/app/seo";

export const metadata = buildMetadata({
  title: "Resend Verification",
  description:
    "Send a new email verification link to finish activating your account.",
  path: "/resend-verification",
  noIndex: true,
});

export default function ResendVerificationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
