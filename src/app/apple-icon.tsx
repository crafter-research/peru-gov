import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** Same mark as the header: a green Andean peak on a deep green tile. */
export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#14201a",
        borderRadius: 40,
      }}
    >
      <svg width="120" height="120" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M3.5 18 9 8.5l3.6 5.4L15 10.5 20.5 18Z" fill="#9fdba8" />
      </svg>
    </div>,
    size,
  );
}
