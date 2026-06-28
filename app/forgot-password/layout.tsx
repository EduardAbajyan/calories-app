import { buildMetadata } from "@/app/seo";

export const metadata = buildMetadata({
  title: "Forgot Password",
  description:
    "Request a password reset link for your CalorieCounter account.",
  path: "/forgot-password",
  noIndex: true,
});

export default function ForgotPasswordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
