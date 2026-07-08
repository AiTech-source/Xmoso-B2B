"use client";

export default function LocaleError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div style={{
      paddingTop: "64px", minHeight: "80vh", backgroundColor: "#0A0A0F",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "16px",
    }}>
      <p style={{ color: "#999", fontSize: "14px" }}>Something went wrong loading this page.</p>
      <button onClick={() => reset()} style={{
        padding: "8px 24px", borderRadius: "8px", border: "1px solid rgba(192,192,192,0.2)",
        background: "transparent", color: "#CCC", cursor: "pointer", fontSize: "13px",
      }}>Try again</button>
    </div>
  );
}
