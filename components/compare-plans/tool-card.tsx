import { Button } from "@/components/ui/button";
import type { ReactElement } from "react";
import type { ToolPlanCatalog } from "@/lib/subscription-plans";

interface ToolCardProps {
  tool: ToolPlanCatalog;
  onViewPlans: (toolSlug: ToolPlanCatalog["slug"]) => void;
}

export function ToolCard({ tool, onViewPlans }: ToolCardProps): ReactElement {
  return (
    <article className="rounded-2xl border border-white/10 bg-slate-900/70 p-5 shadow-lg">
      <div className="mb-3 flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-indigo-500/20 text-2xl">{tool.icon}</div>
        <div>
          <h3 className="text-lg font-semibold text-white">{tool.name}</h3>
          <p className="text-xs text-slate-400">{tool.isApiTool ? "API-based tool" : "Subscription tool"}</p>
        </div>
      </div>
      <p className="mb-4 text-sm text-slate-300">{tool.description}</p>
      <Button onClick={() => onViewPlans(tool.slug)} className="w-full">
        View Plans
      </Button>
    </article>
  );
}
