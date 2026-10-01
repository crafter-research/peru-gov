import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";

export const ogSize = { width: 1200, height: 630 };
const asset = (f: string) =>
  readFile(path.join(process.cwd(), "src", "assets", f));

/** Shared 1200×630 card: Machu Picchu, the wordmark and an optional question/answer pair. */
export async function brandImage({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow?: string;
  title?: string;
  subtitle?: string;
}) {
  const [bg, serif, serifItalic, sans, sansMedium] = await Promise.all([
    asset("og-bg.jpg"),
    asset("fraunces-latin-400-normal.ttf"),
    asset("fraunces-latin-300-italic.ttf"),
    asset("inter-latin-400-normal.ttf"),
    asset("inter-latin-500-normal.ttf"),
  ]);
  const src = `data:image/jpeg;base64,${bg.toString("base64")}`;
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        position: "relative",
        fontFamily: "Inter",
        color: "#f4f1ea",
      }}
    >
      {/* biome-ignore lint/performance/noImgElement: satori renders plain img only */}
      <img
        src={src}
        alt=""
        width={1200}
        height={630}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: 1200,
          height: 630,
          objectFit: "cover",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: 1200,
          height: 630,
          display: "flex",
          backgroundImage:
            "linear-gradient(180deg, rgba(10,14,11,0.45) 0%, rgba(10,14,11,0.35) 35%, rgba(10,14,11,0.85) 70%, rgba(10,14,11,0.96) 100%)",
        }}
      />
      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          width: "100%",
          padding: "56px 64px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            fontSize: 26,
            fontWeight: 500,
          }}
        >
          <div
            style={{
              display: "flex",
              width: 40,
              height: 40,
              borderRadius: 12,
              background: "rgba(255,255,255,0.12)",
              border: "1px solid rgba(255,255,255,0.22)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M5 16.5 9.5 9l3 4.5L14.5 10 19 16.5Z" fill="#9fdba8" />
            </svg>
          </div>
          peru-gov
          <span
            style={{
              marginLeft: 12,
              fontSize: 18,
              color: "rgba(244,241,234,0.6)",
              fontWeight: 400,
            }}
          >
            No oficial · Crafter Research
          </span>
        </div>
        {title ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {eyebrow ? (
              <div
                style={{
                  display: "flex",
                  fontSize: 22,
                  color: "#9fdba8",
                  letterSpacing: 2,
                  textTransform: "uppercase",
                }}
              >
                {eyebrow}
              </div>
            ) : null}
            <div
              style={{
                display: "flex",
                fontFamily: "Fraunces",
                fontSize: title.length > 60 ? 54 : 66,
                lineHeight: 1.08,
                maxWidth: 1040,
              }}
            >
              {title}
            </div>
            {subtitle ? (
              <div
                style={{
                  display: "flex",
                  fontSize: 26,
                  color: "rgba(244,241,234,0.78)",
                  maxWidth: 980,
                  lineHeight: 1.35,
                }}
              >
                {subtitle}
              </div>
            ) : null}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div
              style={{
                display: "flex",
                fontFamily: "Fraunces",
                fontSize: 118,
                lineHeight: 1,
                letterSpacing: -2,
              }}
            >
              Hola,&nbsp;
              <span style={{ fontFamily: "Fraunces Italic" }}>Perú</span>
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 30,
                color: "rgba(244,241,234,0.82)",
              }}
            >
              Cuéntale tu situación y te lleva al trámite correcto de gob.pe.
            </div>
          </div>
        )}
      </div>
    </div>,
    {
      ...ogSize,
      fonts: [
        { name: "Fraunces", data: serif, weight: 400, style: "normal" },
        {
          name: "Fraunces Italic",
          data: serifItalic,
          weight: 300,
          style: "italic",
        },
        { name: "Inter", data: sans, weight: 400, style: "normal" },
        { name: "Inter", data: sansMedium, weight: 500, style: "normal" },
      ],
    },
  );
}
