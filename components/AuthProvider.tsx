"use client";

import { createContext, useContext, useMemo } from "react";

type AuthContextValue = {
  user: null;
  profile: null;
  loading: false;
  isAdmin: false;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const value = useMemo(
    () => ({
      user: null as null,
      profile: null as null,
      loading: false as const,
      isAdmin: false as const,
      refreshProfile: async () => {},
    }),
    []
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
