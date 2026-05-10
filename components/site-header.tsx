import Link from "next/link";
import type { ReactElement } from "react";
import { ThemeToggle } from "@/components/theme-toggle";

const navItems = [
  { href: "/#audit-form", label: "Your stack" },
  { href: "/compare-ai-plans", label: "Plan catalog" },
];

export function SiteHeader(): ReactElement {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-xl supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-5 sm:px-8">
        <Link href="/" className="text-[15px] font-semibold tracking-tight text-foreground">
          Credex
        </Link>
        <div className="flex items-center gap-1 sm:gap-2">
          <nav className="flex items-center gap-0.5 sm:gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-full px-2.5 py-1.5 text-[13px] font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground sm:px-3"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
