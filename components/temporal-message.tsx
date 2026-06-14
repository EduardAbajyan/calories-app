"use client";

import { useEffect, useMemo, useState } from "react";

export default function TemporalMessage({
  message,
  className,
  durationMs = 10000,
  clearQueryParams = ["success", "error"],
}: {
  message: string;
  className: string;
  durationMs?: number;
  clearQueryParams?: string[];
}) {
  const [isVisible, setIsVisible] = useState(true);
  const keysSignature = useMemo(
    () => clearQueryParams.join("|"),
    [clearQueryParams],
  );

  useEffect(() => {
    setIsVisible(true);

    const timer = window.setTimeout(() => {
      setIsVisible(false);

      if (!clearQueryParams.length) {
        return;
      }

      const url = new URL(window.location.href);
      let changed = false;

      for (const key of clearQueryParams) {
        if (url.searchParams.has(key)) {
          url.searchParams.delete(key);
          changed = true;
        }
      }

      if (changed) {
        const nextQuery = url.searchParams.toString();
        const nextUrl = `${url.pathname}${nextQuery ? `?${nextQuery}` : ""}${url.hash}`;
        window.history.replaceState(window.history.state, "", nextUrl);
      }
    }, durationMs);

    return () => {
      window.clearTimeout(timer);
    };
  }, [message, durationMs, keysSignature, clearQueryParams]);

  if (!isVisible) return null;

  return <p className={className}>{message}</p>;
}