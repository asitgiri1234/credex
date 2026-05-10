import Link from "next/link";
import type { ReactElement } from "react";
import { Breadcrumbs } from "@/components/breadcrumbs";

export default function NotFound(): ReactElement {
  return (
    <main id="main" tabIndex={-1} className="flex min-h-[50vh] flex-col items-center justify-center gap-4 bg-background p-8">
      <div className="w-full max-w-md">
        <Breadcrumbs items={[{ href: "/", label: "Credex" }, { label: "Page not found" }]} />
      </div>
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">Page not found</h1>
      <p className="max-w-md text-center text-sm text-muted-foreground">The page you requested does not exist or was moved.</p>
      <Link href="/" className="text-sm font-medium text-foreground underline underline-offset-4 hover:text-muted-foreground">
        Back to home
      </Link>
    </main>
  );
}
