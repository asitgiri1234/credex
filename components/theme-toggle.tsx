"use client";

import { Moon, Sun } from "lucide-react";
import type { ReactElement } from "react";
import { useTheme } from "@/components/theme-provider";

export function ThemeToggle(): ReactElement {
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggle}
      className="inline-flex size-9 items-center justify-center rounded-full border border-border bg-background text-foreground transition hover:bg-muted"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDark ? <Sun className="size-4" aria-hidden /> : <Moon className="size-4" aria-hidden />}
    </button>
  );
}
