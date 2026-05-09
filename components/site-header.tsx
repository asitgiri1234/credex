import Link from "next/link";
import type { ReactElement } from "react";

const navItems = [
  { href: "/", label: "Spend audit" },
  { href: "/compare-ai-plans", label: "Compare plans" },
];

export function SiteHeader(): ReactElement {
  return (
    <header className="sticky top-0 z-50 border-b border-black/[0.06] bg-white/70 backdrop-blur-xl supports-[backdrop-filter]:bg-white/60">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5 sm:px-8">
        <Link
          href="/"
          className="text-[15px] font-semibold tracking-tight text-neutral-900"
        >
          Credex
        </Link>
        <nav className="flex items-center gap-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full px-3 py-1.5 text-[13px] font-medium text-neutral-600 transition hover:bg-neutral-100 hover:text-neutral-900"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
