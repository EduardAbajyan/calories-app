function getErrorDigest(error: unknown) {
  if (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof (error as { digest?: unknown }).digest === "string"
  ) {
    const errorWithDigest = error as { digest: string };
    return errorWithDigest.digest;
  }

  return undefined;
}

export function logMealsDashboardError(
  action: string,
  error: unknown,
  context: Record<string, unknown> = {},
) {
  if (error instanceof Error) {
    console.error(`[dashboard/@meals] ${action}`, {
      ...context,
      name: error.name,
      message: error.message,
      digest: getErrorDigest(error),
      stack: error.stack,
    });
    return;
  }

  console.error(`[dashboard/@meals] ${action}`, {
    ...context,
    error,
  });
}
