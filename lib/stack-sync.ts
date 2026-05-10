import type { UseCase } from "@/lib/audit-engine";
import { SUBSCRIPTION_PLANS } from "@/lib/subscription-plans";

export const STACK_STORAGE_KEY = "credex-stack-v2";
/** @deprecated Legacy keys — migrated into v2 */
const LEGACY_SUBS_KEY = "credex-subscriptions";
const LEGACY_AUDIT_FORM_KEY = "credex-audit-form";

export type CompareUsageMode = "coding" | "writing" | "mixed";

export interface StackRow {
  toolName: string;
  plan: string;
  seats: number;
}

export interface CredexStackV2 {
  v: 2;
  teamSize: string;
  useCase: UseCase;
  compareUsageMode: CompareUsageMode;
  rows: StackRow[];
}

const USE_CASES: UseCase[] = ["coding", "writing", "data", "research", "mixed"];

function clampSeats(n: number): number {
  if (!Number.isFinite(n) || n < 1) {
    return 1;
  }
  return Math.min(Math.floor(n), 10_000);
}

function clampTeamString(raw: string): string {
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 1) {
    return "1";
  }
  return String(Math.min(Math.floor(n), 50_000));
}

export function toCompareUsageMode(useCase: UseCase): CompareUsageMode {
  if (useCase === "writing") {
    return "writing";
  }
  if (useCase === "coding") {
    return "coding";
  }
  return "mixed";
}

export function compareModeToUseCase(mode: CompareUsageMode): UseCase {
  if (mode === "writing") {
    return "writing";
  }
  if (mode === "coding") {
    return "coding";
  }
  return "mixed";
}

function parseStack(raw: unknown): CredexStackV2 | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }
  const o = raw as Partial<CredexStackV2>;
  if (o.v !== 2 || typeof o.teamSize !== "string" || !Array.isArray(o.rows)) {
    return null;
  }
  const useCase = o.useCase && USE_CASES.includes(o.useCase as UseCase) ? (o.useCase as UseCase) : "mixed";
  const compareUsageMode: CompareUsageMode =
    o.compareUsageMode === "coding" || o.compareUsageMode === "writing" || o.compareUsageMode === "mixed"
      ? o.compareUsageMode
      : toCompareUsageMode(useCase);
  const rows = o.rows
    .map((r) => {
      if (!r || typeof r !== "object") {
        return null;
      }
      const row = r as Partial<StackRow>;
      if (typeof row.toolName !== "string" || typeof row.plan !== "string") {
        return null;
      }
      return {
        toolName: row.toolName,
        plan: row.plan,
        seats: clampSeats(typeof row.seats === "number" ? row.seats : 1),
      };
    })
    .filter((r): r is StackRow => r !== null);
  return {
    v: 2,
    teamSize: clampTeamString(o.teamSize),
    useCase,
    compareUsageMode,
    rows,
  };
}

function migrateFromLegacy(): CredexStackV2 | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const rowsRaw = localStorage.getItem(LEGACY_SUBS_KEY);
    const formRaw = localStorage.getItem(LEGACY_AUDIT_FORM_KEY);
    if (!rowsRaw) {
      return null;
    }
    const parsedRows = JSON.parse(rowsRaw) as Array<{ tool?: string; plan?: string; seats?: number }>;
    if (!Array.isArray(parsedRows)) {
      return null;
    }
    let useCase: UseCase = "coding";
    let teamSize = "5";
    if (formRaw) {
      const form = JSON.parse(formRaw) as { teamSize?: string; useCase?: string };
      if (form.teamSize) {
        teamSize = clampTeamString(String(form.teamSize));
      }
      if (form.useCase && USE_CASES.includes(form.useCase as UseCase)) {
        useCase = form.useCase as UseCase;
      }
    }
    const rows: StackRow[] = parsedRows
      .map((entry) => {
        if (typeof entry.tool !== "string" || typeof entry.plan !== "string") {
          return null;
        }
        return {
          toolName: entry.tool,
          plan: entry.plan,
          seats: clampSeats(entry.seats ?? 1),
        };
      })
      .filter((r): r is StackRow => r !== null);
    return {
      v: 2,
      teamSize,
      useCase,
      compareUsageMode: toCompareUsageMode(useCase),
      rows,
    };
  } catch {
    return null;
  }
}

export function loadCredexStack(): CredexStackV2 | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const raw = localStorage.getItem(STACK_STORAGE_KEY);
    if (raw) {
      const parsed = parseStack(JSON.parse(raw) as unknown);
      if (parsed) {
        return parsed;
      }
    }
    const migrated = migrateFromLegacy();
    if (migrated) {
      saveCredexStack(migrated);
    }
    return migrated;
  } catch {
    return null;
  }
}

export function saveCredexStack(stack: CredexStackV2): void {
  if (typeof window === "undefined") {
    return;
  }
  const normalized: CredexStackV2 = {
    ...stack,
    teamSize: clampTeamString(stack.teamSize),
    rows: stack.rows.map((r) => ({
      ...r,
      seats: clampSeats(r.seats),
    })),
  };
  localStorage.setItem(STACK_STORAGE_KEY, JSON.stringify(normalized));
  const legacyPayload = normalized.rows.map((r) => ({
    tool: r.toolName,
    plan: r.plan,
    monthlySpend: 0,
    seats: r.seats,
  }));
  localStorage.setItem(LEGACY_SUBS_KEY, JSON.stringify(legacyPayload));
  localStorage.setItem(LEGACY_AUDIT_FORM_KEY, JSON.stringify({ teamSize: normalized.teamSize, useCase: normalized.useCase }));
}

/** Resolve display name → catalog slug for compare page / plans.json */
export function toolDisplayNameToSlug(displayName: string): string | undefined {
  return SUBSCRIPTION_PLANS.find((t) => t.name === displayName)?.slug;
}

export function toolSlugToDisplayName(slug: string): string | undefined {
  return SUBSCRIPTION_PLANS.find((t) => t.slug === slug)?.name;
}

/** Preserve seat counts from a previous stack when syncing calculator rows (calculator UI is 1 seat / line). */
export function mergeCalculatorWithPreviousSeats(
  calculatorRows: Array<{ toolSlug: string; planName: string }>,
  previous: StackRow[] | undefined,
): StackRow[] {
  return calculatorRows.map((row) => {
    const toolName = toolSlugToDisplayName(row.toolSlug) ?? row.toolSlug;
    const prev = previous?.find((p) => p.toolName === toolName && p.plan === row.planName);
    return {
      toolName,
      plan: row.planName,
      seats: prev?.seats ?? 1,
    };
  });
}
