import { NextRequest, NextResponse } from "next/server";

// 타이밍 공격 방지: 문자열 길이가 달라도 동일한 시간에 비교
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    // 길이가 달라도 루프는 돌게 해서 타이밍 노출 방지
    let diff = 0;
    for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ (b.charCodeAt(i % b.length) || 0);
    return false;
  }
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export function middleware(req: NextRequest) {
  const expectedUser = process.env.SITE_USER;
  const expectedPassword = process.env.SITE_PASSWORD;

  // 환경변수 미설정 시 통과 (로컬 개발 편의)
  if (!expectedUser || !expectedPassword) return NextResponse.next();

  const auth = req.headers.get("authorization");
  let authorized = false;

  if (auth) {
    const [scheme, encoded] = auth.split(" ");
    if (scheme === "Basic" && encoded) {
      try {
        const decoded = Buffer.from(encoded, "base64").toString("utf-8");
        const colonIdx = decoded.indexOf(":");
        if (colonIdx > 0) {
          const inputUser = decoded.slice(0, colonIdx);
          const inputPassword = decoded.slice(colonIdx + 1);
          authorized =
            safeEqual(inputUser, expectedUser) &&
            safeEqual(inputPassword, expectedPassword);
        }
      } catch {
        // ignore malformed header
      }
    }
  }

  if (authorized) return NextResponse.next();

  return new NextResponse("Unauthorized", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Algamja Studio"',
    },
  });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|logo.svg).*)"],
};
