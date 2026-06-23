"use client";

import { useFormStatus } from "react-dom";
import type { ReactNode } from "react";

type PendingActionButtonProps = {
  className: string;
  children: ReactNode;
  pendingChildren?: ReactNode;
};

export default function PendingActionButton({
  className,
  children,
  pendingChildren,
}: PendingActionButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      aria-disabled={pending}
      className={`${className} disabled:cursor-not-allowed disabled:opacity-70`}
    >
      {pending ? pendingChildren ?? children : children}
    </button>
  );
}
