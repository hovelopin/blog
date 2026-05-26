import { ImageResponse } from "next/og";
import { SITE_SHORT_NAME, SITE_URL } from "@/lib/site";

export const alt = "hovelopin — dev log";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// 커버가 없는 페이지(홈/블로그/다이어리/태그)의 기본 OG 이미지.
// 한글 폰트 임베딩 없이 동작하도록 라틴 텍스트만 사용한다.
export default function OpenGraphImage() {
  const host = SITE_URL.replace(/^https?:\/\//, "");
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          background: "#0a0a0a",
          color: "#ededed",
          padding: "80px",
          fontFamily: "monospace",
        }}
      >
        <div style={{ display: "flex", color: "#4ade80", fontSize: 30 }}>
          ~/hovelopin $ cat about.md
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 130,
            fontWeight: 700,
            letterSpacing: "-0.04em",
            marginTop: 24,
          }}
        >
          {SITE_SHORT_NAME}
        </div>
        <div style={{ display: "flex", fontSize: 44, color: "#a1a1aa" }}>
          dev log — build, break, learn
        </div>
        <div
          style={{
            display: "flex",
            marginTop: "auto",
            fontSize: 28,
            color: "#71717a",
          }}
        >
          {host}
        </div>
      </div>
    ),
    { ...size },
  );
}
