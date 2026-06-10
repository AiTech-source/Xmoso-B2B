import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const title = searchParams.get("title") || "";
  const subtitle = searchParams.get("subtitle") || "";
  const type = searchParams.get("type") || "product";
  const brand = searchParams.get("brand") || "Xmoso";
  const url = searchParams.get("url") || "xmoso.com";
  const logo = searchParams.get("logo") || "";
  const image = searchParams.get("image") || "";

  const isPage = type === "page" || type === "faq";
  const hasImage = !!image;

  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          background: "linear-gradient(135deg, #0A0A0F 0%, #1A1A2E 100%)",
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          padding: "60px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Decorative background */}
        <div style={{ position: "absolute", top: -100, right: -100, width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(139,200,160,0.08) 0%, transparent 70%)" }} />
        <div style={{ position: "absolute", bottom: -50, left: -50, width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(126,200,227,0.06) 0%, transparent 70%)" }} />

        {/* Left: Text content */}
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", flex: hasImage ? 1 : 1, paddingRight: hasImage ? 40 : 0 }}>
          {/* Brand logo area */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            {logo ? (
              <img src={logo} alt="" style={{ height: 40, width: "auto", maxWidth: 160, objectFit: "contain" }} />
            ) : (
              <div style={{ width: 40, height: 40, borderRadius: 10, background: "#8BC8A0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 700, color: "#0A0A0F" }}>
                {brand.substring(0, 1).toUpperCase()}
              </div>
            )}
          </div>

          {/* Title */}
          <div style={{ fontSize: isPage ? 56 : 44, color: "#ffffff", fontWeight: 300, lineHeight: 1.2, maxWidth: 600, marginTop: 4 }}>
            {title}
          </div>

          {/* Subtitle (model number for products) */}
          {subtitle && (
            <div style={{ fontSize: 22, color: "rgba(192,192,192,0.5)", fontWeight: 300, marginTop: 14, letterSpacing: "0.05em", maxWidth: 600 }}>
              {subtitle}
            </div>
          )}
        </div>

        {/* Right: Product image */}
        {hasImage && (
          <div style={{ width: 380, height: 380, borderRadius: 20, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, background: "rgba(255,255,255,0.05)" }}>
            <img src={image} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
          </div>
        )}

        {/* Bottom accent bar */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 4, background: "linear-gradient(90deg, #8BC8A0 0%, #7EC8E3 50%, #8BC8A0 100%)" }} />

        {/* URL for non-product pages */}
        {isPage && (
          <div style={{ position: "absolute", bottom: 30, right: 60, fontSize: 16, color: "rgba(192,192,192,0.3)", letterSpacing: "0.05em" }}>
            {url}
          </div>
        )}
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
