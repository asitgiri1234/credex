import Link from "next/link";
import type { ReactElement } from "react";

const navItems = [
  { href: "/", label: "Audit Dashboard" },
  { href: "/compare-ai-plans", label: "Compare AI Plans" },
];

export function SiteHeader(): ReactElement {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/85 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="text-sm font-semibold tracking-wide text-slate-100">
          Credex Subscription Optimizer
        </Link>
        <nav className="flex items-center gap-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg px-3 py-2 text-sm text-slate-200 transition hover:bg-slate-800 hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
