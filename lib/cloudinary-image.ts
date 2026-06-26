type CloudinaryOptions = {
  width: number;
  height?: number;
  crop?: "fill" | "fit" | "limit";
};

function isCloudinaryUrl(src: string): boolean {
  try {
    const url = new URL(src);
    return url.hostname === "res.cloudinary.com";
  } catch {
    return false;
  }
}

export function getCloudinaryImageUrl(
  src: string,
  { width, height, crop = "fill" }: CloudinaryOptions,
): string {
  if (!src || !isCloudinaryUrl(src)) return src;

  const transforms = [
    "f_auto",
    "q_auto",
    "dpr_auto",
    `w_${Math.max(1, Math.round(width))}`,
  ];

  if (height) {
    transforms.push(`h_${Math.max(1, Math.round(height))}`);
    transforms.push(`c_${crop}`);
  } else {
    transforms.push("c_limit");
  }

  const transformChunk = transforms.join(",");
  return src.replace("/upload/", `/upload/${transformChunk}/`);
}
