"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/theme-provider";

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <button
      type="button"
      onClick={toggle}
      className="flex h-10 w-10 items-center justify-center rounded-pill border border-[var(--border)] bg-[var(--bg-tertiary)] text-[var(--text-primary)] transition hover:bg-[var(--accent-primary-light)]"
      aria-label={theme === "light" ? "Тёмная тема" : "Светлая тема"}
    >
      {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
    </button>
  );
}
