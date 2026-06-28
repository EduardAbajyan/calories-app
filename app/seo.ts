import type { Metadata } from "next";

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://calories-app.eduardabajyan.com";

const OG_IMAGE =
  "https://res.cloudinary.com/dgh4grnch/image/upload/v1782558715/1_lv5wkc.png";

type BuildMetadataOptions = {
  title: string;
  description: string;
  path: string;
  noIndex?: boolean;
};

export function buildMetadata({
  title,
  description,
  path,
  noIndex = false,
}: BuildMetadataOptions): Metadata {
  return {
    title,
    description,
    alternates: {
      canonical: path,
    },
    openGraph: {
      title,
      description,
      url: path,
      type: "website",
      images: [
        {
          url: OG_IMAGE,
          width: 1200,
          height: 630,
          alt: "CalorieCounter preview",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [OG_IMAGE],
    },
    robots: noIndex
      ? {
          index: false,
          follow: false,
        }
      : {
          index: true,
          follow: true,
        },
  };
}
