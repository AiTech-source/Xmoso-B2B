import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const title = searchParams.get("title") || "";
  const subtitle = searchParams.get("subtitle") || "";
  const type = searchParams.get("type") || "product";
  const brand = searchParams.get("brand") || "Xmoso";
  const logo = searchParams.get("logo") || "";

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
        {/* Decorative elements */}
        <div style={{ position: "absolute", top: -100, right: -100, width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(139,200,160,0.08) 0%, transparent 70%)" }} />
        <div style={{ position: "absolute", bottom: -50, left: -50, width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(126,200,227,0.06) 0%, transparent 70%)" }} />

        {/* Brand — with logo image if available */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          {logo ? (
            <img src={logo} alt="" width={160} height={40} style={{ objectFit: "contain" }} />
          ) : (
            <div style={{ width: 44, height: 44, borderRadius: 10, background: "#8BC8A0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 700, color: "#0A0A0F" }}>
              {initials}
            </div>
          )}
        </div>

        {/* Title */}
        <div style={{ fontSize: isPage ? 56 : 48, color: "#ffffff", fontWeight: 300, lineHeight: 1.2, maxWidth: 800 }}>
          {title}
        </div>

        {/* Subtitle (model number for products) */}
        {subtitle && (
          <div style={{ fontSize: 24, color: "rgba(192,192,192,0.5)", fontWeight: 300, marginTop: 16, letterSpacing: "0.05em" }}>
            {subtitle}
          </div>
        )}

        {/* Bottom accent bar */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 4, background: "linear-gradient(90deg, #8BC8A0 0%, #7EC8E3 50%, #8BC8A0 100%)" }} />
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
