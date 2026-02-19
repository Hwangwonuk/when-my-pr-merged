import { ImageResponse } from "@vercel/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;

  const login = searchParams.get("login") ?? "user";
  const avatarUrl = searchParams.get("avatar") ?? "";
  const reviewCount = searchParams.get("reviews") ?? "0";
  const avgResponseTime = searchParams.get("responseTime") ?? "--";
  const mergedPRs = searchParams.get("mergedPRs") ?? "0";
  const rank = searchParams.get("rank") ?? "";
  const badges = (searchParams.get("badges") ?? "").split(",").filter(Boolean);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)",
          padding: "60px",
          fontFamily: "sans-serif",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginBottom: "40px",
          }}
        >
          <div
            style={{
              fontSize: "28px",
              color: "#818cf8",
              fontWeight: "bold",
            }}
          >
            내 PR 언제 머지돼?
          </div>
        </div>

        {/* Profile */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "24px",
            marginBottom: "40px",
          }}
        >
          {avatarUrl && (
            <img
              src={avatarUrl}
              width={80}
              height={80}
              style={{ borderRadius: "50%" }}
            />
          )}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                fontSize: "36px",
                fontWeight: "bold",
                color: "white",
              }}
            >
              @{login}
            </div>
            {rank && (
              <div style={{ fontSize: "20px", color: "#a5b4fc" }}>
                리뷰어 {rank}
              </div>
            )}
          </div>
          {badges.length > 0 && (
            <div
              style={{
                display: "flex",
                gap: "8px",
                marginLeft: "auto",
              }}
            >
              {badges.map((b, i) => (
                <span key={i} style={{ fontSize: "36px" }}>
                  {b}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div
          style={{
            display: "flex",
            gap: "24px",
            flex: 1,
          }}
        >
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              background: "rgba(255,255,255,0.05)",
              borderRadius: "16px",
              padding: "32px",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <div style={{ fontSize: "18px", color: "#9ca3af", marginBottom: "8px" }}>
              리뷰 건수
            </div>
            <div style={{ fontSize: "48px", fontWeight: "bold", color: "white" }}>
              {reviewCount}건
            </div>
          </div>
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              background: "rgba(255,255,255,0.05)",
              borderRadius: "16px",
              padding: "32px",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <div style={{ fontSize: "18px", color: "#9ca3af", marginBottom: "8px" }}>
              평균 응답 시간
            </div>
            <div style={{ fontSize: "48px", fontWeight: "bold", color: "#34d399" }}>
              {avgResponseTime}
            </div>
          </div>
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              background: "rgba(255,255,255,0.05)",
              borderRadius: "16px",
              padding: "32px",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <div style={{ fontSize: "18px", color: "#9ca3af", marginBottom: "8px" }}>
              머지된 PR
            </div>
            <div style={{ fontSize: "48px", fontWeight: "bold", color: "#fbbf24" }}>
              {mergedPRs}개
            </div>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
