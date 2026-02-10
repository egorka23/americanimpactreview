"use client";

import { useEffect } from "react";
import { SlimShell } from "@/components/SlimShell";

export function AppShell({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const savedTheme = localStorage.getItem("tim_theme") || "light";
    document.documentElement.classList.toggle("theme-dark", savedTheme === "dark");
  }, []);

  return (
    <SlimShell>{children}</SlimShell>
  );
}
