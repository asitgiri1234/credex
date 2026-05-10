import type { AuditInput, AuditResult } from "@/lib/audit-engine";

/** Remove sequences that look like emails from shared copy (defense in depth). */
export function redactEmails(text: string): string {
  return text.replace(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi, "[redacted]");
}

export interface ShareableAuditPayload {
  auditId: string;
  input: AuditInput;
  result: AuditResult;
  narrative: string;
  createdAt: string;
}

/** Snapshot safe to persist or paste into OG descriptions — no lead PII. */
export function buildShareablePayload(
  auditId: string,
  input: AuditInput,
  result: AuditResult,
  narrative: string,
  createdAt: string,
): ShareableAuditPayload {
  return {
    auditId,
    input,
    result,
    narrative: redactEmails(narrative),
    createdAt,
  };
}
