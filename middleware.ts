import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.next();
  }

  let supabaseResponse = NextResponse.next({ request });

  try {
    const supabase = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value),
            );
            supabaseResponse = NextResponse.next({ request });
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options),
            );
          },
        },
      },
    );

    await supabase.auth.getUser();
  } catch (err) {
    // 미들웨어가 throw하면 사이트 전체가 500이 되므로, 세션 갱신 실패는 조용히 통과시킴.
    console.error("[middleware] supabase session refresh failed:", err);
    // [DIAG] 환경변수가 어떻게 들어가 있는지 확인용 — 원인 잡히면 이 블록 제거.
    // 값 자체는 노출하지 않고 길이/타입/접두사만 찍어 어떤 글자가 깨졌는지 추적.
    const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const rawKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    console.error("[middleware][diag] env snapshot:", {
      urlType: typeof rawUrl,
      urlLen: rawUrl?.length,
      urlPrefix: rawUrl?.slice(0, 12),
      urlSuffix: rawUrl?.slice(-6),
      urlStartsHttps: rawUrl?.startsWith("https://"),
      urlEndsSlash: rawUrl?.endsWith("/"),
      urlHasQuote: rawUrl?.includes("\"") || rawUrl?.includes("'"),
      urlHasWhitespace: rawUrl ? /\s/.test(rawUrl) : undefined,
      urlCharCodesFirst3: rawUrl?.slice(0, 3).split("").map((c) => c.charCodeAt(0)),
      keyType: typeof rawKey,
      keyLen: rawKey?.length,
      keyStartsEy: rawKey?.startsWith("ey"),
    });
    return NextResponse.next({ request });
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
