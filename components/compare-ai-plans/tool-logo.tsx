import Image from "next/image";
import type { ReactElement } from "react";

/** Bundled SVGs in /public (reliable vs CDN). */
const LOCAL_LOGO_BY_SLUG: Record<string, string> = {
  "openai-api": "/ai-tool-logos/openai-api.svg",
  chatgpt: "/ai-tool-logos/chatgpt.svg",
};

/** Simple Icons slug → CDN SVG for remaining tools. */
const SIMPLE_ICON_BY_TOOL_SLUG: Record<string, string> = {
  cursor: "cursor",
  "claude-api": "anthropic",
  windsurf: "windsurf",
  "github-copilot": "githubcopilot",
  claude: "anthropic",
  gemini: "googlegemini",
};

export interface ToolLogoProps {
  slug: string;
  name: string;
  className?: string;
  /** Tighter mark for dense layouts (e.g. table headers). */
  compact?: boolean;
}

export function ToolLogo({ slug, name, className = "", compact = false }: ToolLogoProps): ReactElement {
  const localSrc = LOCAL_LOGO_BY_SLUG[slug];
  const iconSlug = SIMPLE_ICON_BY_TOOL_SLUG[slug];
  const src = localSrc ?? `https://cdn.simpleicons.org/${iconSlug ?? "anthropic"}/d4d4d8`;
  const box = compact ? "size-8 rounded-lg p-1" : "size-10 rounded-xl p-1.5";
  const imgClass = compact ? "size-5 object-contain" : "size-7 object-contain";
  const dims = compact ? { width: 20, height: 20 } : { width: 28, height: 28 };
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center border border-border bg-muted/50 ${box} ${className}`.trim()}
    >
      <Image
        src={src}
        alt={`${name} logo`}
        width={dims.width}
        height={dims.height}
        className={imgClass}
        unoptimized
      />
    </span>
  );
}
