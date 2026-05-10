import { ImageResponse } from "next/og";

export const runtime = "nodejs";

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get("title") || "Credex — AI spend audit";
  const subtitle = searchParams.get("subtitle") || "Modeled savings & defensible recommendations";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 64,
          background: "linear-gradient(135deg, #0a0a0f 0%, #12121a 45%, #0f172a 100%)",
          color: "#f4f4f5",
          fontSize: 56,
          fontWeight: 600,
          letterSpacing: -1.5,
        }}
      >
        <div style={{ fontSize: 28, fontWeight: 500, color: "#a1a1aa", marginBottom: 24 }}>Credex</div>
        <div style={{ lineHeight: 1.15, maxWidth: 900 }}>{title}</div>
        <div style={{ marginTop: 32, fontSize: 34, fontWeight: 500, color: "#34d399" }}>{subtitle}</div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
