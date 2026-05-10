import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Audit results",
  description: "Credex spend audit — savings breakdown, recommendations, and Credex integration paths.",
};

export default function AuditSectionLayout({ children }: { children: ReactNode }): ReactNode {
  return children;
}
