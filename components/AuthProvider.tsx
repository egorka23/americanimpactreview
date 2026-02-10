"use client";

import { SessionProvider, useSession } from "next-auth/react";
import { createContext, useContext } from "react";

type AuthContextValue = {
  user: { id: string; name?: string | null; email?: string | null } | null;
  profile: null;
  loading: boolean;
  isAdmin: boolean;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function AuthInner({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const loading = status === "loading";
  const user = session?.user
    ? { id: session.user.id, name: session.user.name, email: session.user.email }
    : null;

  const value: AuthContextValue = {
    user,
    profile: null,
    loading,
    isAdmin: false,
    refreshProfile: async () => {},
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AuthInner>{children}</AuthInner>
    </SessionProvider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
