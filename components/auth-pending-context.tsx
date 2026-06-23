"use client";

import { createContext, useContext, useMemo, useState } from "react";

type PendingSource = "google" | "credentials" | null;

type AuthPendingContextValue = {
  pendingSource: PendingSource;
  setPendingSource: (source: PendingSource) => void;
};

const AuthPendingContext = createContext<AuthPendingContextValue | null>(null);

export function AuthPendingProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [pendingSource, setPendingSource] = useState<PendingSource>(null);

  const value = useMemo(
    () => ({ pendingSource, setPendingSource }),
    [pendingSource],
  );

  return (
    <AuthPendingContext.Provider value={value}>
      {children}
    </AuthPendingContext.Provider>
  );
}

export function useAuthPending() {
  const context = useContext(AuthPendingContext);

  if (!context) {
    throw new Error("useAuthPending must be used within AuthPendingProvider");
  }

  return context;
}