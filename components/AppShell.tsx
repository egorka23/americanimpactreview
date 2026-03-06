"use client";

import { useEffect } from "react";
import { SlimShell } from "@/components/SlimShell";
import { captureFirstTouch } from "@/lib/attribution";

export function AppShell({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const savedTheme = localStorage.getItem("tim_theme") || "light";
    document.documentElement.classList.toggle("theme-dark", savedTheme === "dark");
    captureFirstTouch();
  }, []);

  return (
    <SlimShell>{children}</SlimShell>
  );
}
