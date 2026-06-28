import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "next-auth/react";
import { SITE_URL } from "./seo";
import logo from "./assets/logo.png";

const defaultDescription =
  "CalorieCounter helps you log foods, build dishes, compose meals, and track calories and macros in one clean daily workflow.";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "CalorieCounter | Daily Calories and Macros Tracker",
    template: "%s | CalorieCounter",
  },
  description: defaultDescription,
  applicationName: "CalorieCounter",
  icons: {
    icon: logo.src,
    shortcut: logo.src,
    apple: logo.src,
  },
  category: "health",
  keywords: [
    "calorie tracker",
    "macro tracker",
    "meal planner",
    "nutrition app",
    "food log",
    "daily calories",
    "dish builder",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "CalorieCounter",
    title: "CalorieCounter | Daily Calories and Macros Tracker",
    description: defaultDescription,
    locale: "en_US",
    images: [
      {
        url: "https://res.cloudinary.com/dgh4grnch/image/upload/v1782558715/1_lv5wkc.png",
        width: 1200,
        height: 630,
        alt: "CalorieCounter dashboard preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "CalorieCounter | Daily Calories and Macros Tracker",
    description: defaultDescription,
    images: [
      "https://res.cloudinary.com/dgh4grnch/image/upload/v1782558715/1_lv5wkc.png",
    ],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
