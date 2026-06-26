"use client";

import Link, { type LinkProps } from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { type AnchorHTMLAttributes, type ReactNode, useEffect, useState } from "react";

type PendingNavigationLinkProps = LinkProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
    className?: string;
    pendingClassName?: string;
    children: ReactNode;
    pendingChildren?: ReactNode;
  };

export default function PendingNavigationLink({
  className,
  pendingClassName = "pointer-events-none opacity-60",
  children,
  pendingChildren,
  onClick,
  ...props
}: PendingNavigationLinkProps) {
  const [isPending, setIsPending] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    setIsPending(false);
  }, [pathname, searchParams]);

  return (
    <Link
      {...props}
      aria-disabled={isPending ? true : undefined}
      onClick={(event) => {
        onClick?.(event);
        if (event.defaultPrevented) return;

        if (
          event.button === 0 &&
          !event.metaKey &&
          !event.altKey &&
          !event.ctrlKey &&
          !event.shiftKey
        ) {
          setIsPending(true);
        }
      }}
      className={`${className ?? ""}${isPending ? ` ${pendingClassName}` : ""}`}
    >
      {isPending && pendingChildren ? pendingChildren : children}
    </Link>
  );
}