import { buildMetadata } from "@/app/seo";

export const metadata = buildMetadata({
  title: "Reset Password",
  description:
    "Set a new password to regain access to your CalorieCounter account.",
  path: "/reset-password",
  noIndex: true,
});

export default function ResetPasswordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
