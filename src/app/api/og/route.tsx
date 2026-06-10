import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const title = searchParams.get("title") || "";
  const model = searchParams.get("model") || "";
  const subtitle = searchParams.get("subtitle") || "";
  const type = searchParams.get("type") || "product";
  const brand = searchParams.get("brand") || "DeepCool";
  const url = searchParams.get("url") || "deepcool.com";

  const isPage = type === "page" || type === "faq";
  const initials = brand.substring(0, 1).toUpperCase();

  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          background: "linear-gradient(135deg, #0A0A0F 0%, #1A1A2E 100%)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "60px 80px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Decorative background */}
        <div style={{ position: "absolute", top: -100, right: -100, width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(139,200,160,0.08) 0%, transparent 70%)" }} />
        <div style={{ position: "absolute", bottom: -50, left: -50, width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(126,200,227,0.06) 0%, transparent 70%)" }} />

        {/* Brand */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: "#8BC8A0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 700, color: "#0A0A0F" }}>
            {initials}
          </div>
          <span style={{ fontSize: 28, color: "#8BC8A0", fontWeight: 300, letterSpacing: "0.1em" }}>{brand}</span>
        </div>

        {/* Title */}
        <div style={{ fontSize: isPage ? 56 : 48, color: "#ffffff", fontWeight: 300, lineHeight: 1.2, maxWidth: 800, marginTop: 8 }}>{title}</div>

        {/* Model / subtitle */}
        {model && <div style={{ fontSize: 28, color: "rgba(192,192,192,0.6)", fontWeight: 300, marginTop: 12, letterSpacing: "0.05em" }}>{model}</div>}
        {subtitle && !model && <div style={{ fontSize: 22, color: "rgba(192,192,192,0.5)", fontWeight: 300, marginTop: 12 }}>{subtitle}</div>}

        {/* Bottom accent bar */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 4, background: "linear-gradient(90deg, #8BC8A0 0%, #7EC8E3 50%, #8BC8A0 100%)" }} />

        {/* URL */}
        {isPage && <div style={{ position: "absolute", bottom: 30, right: 60, fontSize: 16, color: "rgba(192,192,192,0.3)", letterSpacing: "0.05em" }}>{url}</div>}
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
