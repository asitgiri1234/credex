import type { AuditInput, AuditResult } from "@/lib/audit-engine";

export interface SharePayload {
  auditId: string;
  input: AuditInput;
  result: AuditResult;
  narrative: string;
  createdAt: string;
}

declare global {
  // eslint-disable-next-line no-var
  var __credexShareStore: Map<string, SharePayload> | undefined;
}

const getStore = (): Map<string, SharePayload> => {
  if (!globalThis.__credexShareStore) {
    globalThis.__credexShareStore = new Map();
  }
  return globalThis.__credexShareStore;
};

export function saveSharePayload(shareId: string, payload: SharePayload): void {
  getStore().set(shareId, payload);
}

export function getSharePayload(shareId: string): SharePayload | undefined {
  return getStore().get(shareId);
}
