import type { AuditInput, AuditResult } from "@/lib/audit-engine";

export interface AuditSessionPayload {
  auditId: string;
  input: AuditInput;
  result: AuditResult;
  narrative: string;
  narrativeSource?: string;
  warnings?: string[];
  createdAt: string;
}

const MAX_SESSIONS = 2_000;

declare global {
  // eslint-disable-next-line no-var
  var __credexAuditSessions: Map<string, AuditSessionPayload> | undefined;
}

function getStore(): Map<string, AuditSessionPayload> {
  if (!globalThis.__credexAuditSessions) {
    globalThis.__credexAuditSessions = new Map();
  }
  return globalThis.__credexAuditSessions;
}

/** FIFO eviction when cap is reached (single-instance MVP; use Redis/DB in production). */
export function saveAuditSession(payload: AuditSessionPayload): void {
  const map = getStore();
  while (map.size >= MAX_SESSIONS) {
    const oldest = map.keys().next().value;
    if (oldest === undefined) {
      break;
    }
    map.delete(oldest);
  }
  map.set(payload.auditId, payload);
}

export function getAuditSession(auditId: string): AuditSessionPayload | undefined {
  return getStore().get(auditId);
}
