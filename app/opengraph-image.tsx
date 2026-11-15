import { ImageResponse } from "next/og";

export const alt = "Hawaii Sky & Summit — permit drops + night sky";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OG() {
  const stars = Array.from({ length: 70 }, (_, i) => ({
    x: (i * 137.5) % 1200,
    y: (i * 89.3) % 380,
    r: (i % 3) + 1,
  }));
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          padding: 70,
          background: "linear-gradient(180deg, #050816 0%, #0f1a4a 55%, #3a2a6b 78%, #ff8a5b 100%)",
          color: "white",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        {stars.map((s, i) => (
          <div key={i} style={{ position: "absolute", left: s.x, top: s.y, width: s.r * 2, height: s.r * 2, borderRadius: 99, background: "white", opacity: 0.8 }} />
        ))}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: 170,
            background: "#070b1f",
            clipPath: "polygon(0 70%, 18% 45%, 34% 55%, 52% 12%, 66% 40%, 80% 30%, 100% 60%, 100% 100%, 0 100%)",
          }}
        />
        <div style={{ display: "flex", fontSize: 30, color: "#ffb86b", letterSpacing: 4, textTransform: "uppercase", marginBottom: 12 }}>Hawaii Sky &amp; Summit</div>
        <div style={{ display: "flex", fontSize: 72, fontWeight: 800, lineHeight: 1.05, maxWidth: 1000 }}>Permit drops + tonight&apos;s sky</div>
        <div style={{ display: "flex", fontSize: 30, marginTop: 18, color: "#dfe4ff", marginBottom: 120 }}>
          Haleakalā sunrise · Hanauma Bay · Hāʻena · meteor showers · star parties
        </div>
      </div>
    ),
    size,
  );
}
