import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const title = searchParams.get("title") || "";
  const subtitle = searchParams.get("subtitle") || "";
  const type = searchParams.get("type") || "product";
  const brand = searchParams.get("brand") || "Xmoso";
  const imageUrl = searchParams.get("image");

  const isPage = type === "page" || type === "faq";
  const initial = brand.substring(0, 1).toUpperCase();

  // Use remote image URL directly in <img> tag — ImageResponse/Satori
  // can load images from URLs with proper CORS headers.
  const showProduct = imageUrl && type !== "page";

  return new ImageResponse(
    (
      <div
        style={{
          width: 1200, height: 630,
          background: "linear-gradient(135deg, #0A0A0F 0%, #1A1A2E 100%)",
          display: "flex", alignItems: "center",
          padding: "60px 80px", position: "relative", overflow: "hidden",
        }}
      >
        <div style={{ position: "absolute", top: -100, right: -100, width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(139,200,160,0.08) 0%, transparent 70%)" }} />
        <div style={{ position: "absolute", bottom: -50, left: -50, width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(126,200,227,0.06) 0%, transparent 70%)" }} />

        {showProduct ? (
          <>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 380, height: 380, borderRadius: 20, overflow: "hidden", background: "rgba(255,255,255,0.05)", flexShrink: 0, marginRight: 60 }}>
              <img src={imageUrl!} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: "#8BC8A0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 700, color: "#0A0A0F" }}>{initial}</div>
                <span style={{ fontSize: 22, color: "#8BC8A0", fontWeight: 300, letterSpacing: "0.1em" }}>{brand}</span>
              </div>
              <div style={{ fontSize: 44, color: "#ffffff", fontWeight: 300, lineHeight: 1.2 }}>{title}</div>
              {subtitle && <div style={{ fontSize: 20, color: "rgba(192,192,192,0.5)", fontWeight: 300, marginTop: 12, letterSpacing: "0.05em" }}>{subtitle}</div>}
            </div>
          </>
        ) : (
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: "#8BC8A0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 700, color: "#0A0A0F" }}>{initial}</div>
              <span style={{ fontSize: 28, color: "#8BC8A0", fontWeight: 300, letterSpacing: "0.1em" }}>{brand}</span>
            </div>
            <div style={{ fontSize: isPage ? 56 : 48, color: "#ffffff", fontWeight: 300, lineHeight: 1.2, maxWidth: 800 }}>{title}</div>
            {subtitle && <div style={{ fontSize: 24, color: "rgba(192,192,192,0.5)", fontWeight: 300, marginTop: 16, letterSpacing: "0.05em" }}>{subtitle}</div>}
          </div>
        )}

        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 4, background: "linear-gradient(90deg, #8BC8A0 0%, #7EC8E3 50%, #8BC8A0 100%)" }} />
        <div style={{ position: "absolute", top: 30, right: 40, display: "flex", gap: 6 }}>
          {[0,1,2,3,4].map(i => <div key={i} style={{ width: 4, height: 4, borderRadius: "50%", background: "rgba(139,200,160,0.15)" }} />)}
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
