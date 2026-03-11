"use client";

import { SessionProvider, useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { createContext, useContext, useEffect } from "react";

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

  const pathname = usePathname();

  // Send User ID to GA4 + Clarity when logged in
  useEffect(() => {
    if (session?.user?.id) {
      const gaId = process.env.NEXT_PUBLIC_GA_ID;
      if (gaId) {
        window.gtag?.("config", gaId, { user_id: session.user.id });
      }
      window.gtag?.("set", "user_properties", { user_type: "registered" });
      // Link Clarity session to user ID
      window.clarity?.("identify", session.user.id);
    }
  }, [session?.user?.id]);

  // Microsoft Clarity custom tags
  useEffect(() => {
    const c = window.clarity;
    if (typeof c !== "function") return;

    // user_type
    c("set", "user_type", session?.user ? "logged_in" : "visitor");

    // page_category
    let cat = "info";
    if (pathname === "/") cat = "home";
    else if (pathname.startsWith("/article")) cat = "article";
    else if (pathname.startsWith("/explore")) cat = "explore";
    else if (pathname.startsWith("/submit")) cat = "submit";
    else if (pathname.startsWith("/signup") || pathname.startsWith("/login") || pathname.startsWith("/forgot-password")) cat = "auth";
    else if (pathname.startsWith("/manage") || pathname.startsWith("/admin")) cat = "admin";
    c("set", "page_category", cat);

    // referrer_type
    const ref = document.referrer;
    let refType = "direct";
    if (ref.includes("google") && (ref.includes("gclid") || document.location.search.includes("gclid"))) refType = "google_ads";
    else if (ref.includes("google") || ref.includes("bing") || ref.includes("yahoo") || ref.includes("duckduckgo")) refType = "organic";
    else if (ref.includes("chatgpt") || ref.includes("perplexity")) refType = "ai_referral";
    else if (ref.includes("facebook") || ref.includes("twitter") || ref.includes("linkedin") || ref.includes("instagram")) refType = "social";
    else if (ref && !ref.includes("americanimpactreview.com")) refType = "referral";
    c("set", "referrer_type", refType);
  }, [pathname, session?.user]);

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
