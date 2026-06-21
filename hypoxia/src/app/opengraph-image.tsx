import { ImageResponse } from "next/og";

// Branded social-share card. Generated at build/request time by next/og, so no
// static asset is needed and the og:image / twitter:image meta tags are wired
// automatically by Next's file convention.
export const alt =
  "HYPOXIA — L'Écho Numérique. Une installation d'art qui visualise l'impact environnemental de l'IA.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          backgroundColor: "#020617",
          // Toxic red glow bleeding in from the lower-right — the "wound".
          backgroundImage:
            "radial-gradient(900px 600px at 85% 110%, rgba(255,0,64,0.22), transparent 60%)",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: 8,
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.35)",
          }}
        >
          DevArt 2026 · Installation interactive
        </div>

        <div
          style={{
            display: "flex",
            marginTop: 24,
            fontSize: 150,
            fontWeight: 900,
            letterSpacing: 12,
            color: "#ff0040",
            lineHeight: 1,
          }}
        >
          HYPOXIA
        </div>

        <div
          style={{
            display: "flex",
            marginTop: 12,
            fontSize: 34,
            fontWeight: 600,
            letterSpacing: 6,
            color: "rgba(255,255,255,0.85)",
          }}
        >
          L&rsquo;Écho Numérique
        </div>

        <div
          style={{
            display: "flex",
            marginTop: 40,
            maxWidth: 760,
            fontSize: 26,
            lineHeight: 1.45,
            color: "rgba(255,255,255,0.55)",
          }}
        >
          Tapez un prompt, et regardez le monde étouffer. Le coût invisible de
          l&rsquo;IA, rendu visible.
        </div>
      </div>
    ),
    size,
  );
}
