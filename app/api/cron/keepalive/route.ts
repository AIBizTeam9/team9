import { NextRequest, NextResponse } from "next/server";

// Vercel Cron이 매일 한 번 호출. Supabase에 가벼운 REST 쿼리를 날려서
// 무료 티어 비활성 정지(7일 무활동)를 막는다.
//
// Vercel은 cron 요청에 'Authorization: Bearer <CRON_SECRET>' 헤더를 자동으로 붙임.
// CRON_SECRET 환경변수가 Vercel 프로젝트에 설정돼 있어야 함.

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  // Vercel cron 호출 인증. 외부에서 임의로 호출되는 걸 막음.
  const auth = request.headers.get("authorization");
  const expected = `Bearer ${process.env.CRON_SECRET}`;
  if (process.env.CRON_SECRET && auth !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json(
      { error: "Supabase not configured" },
      { status: 500 },
    );
  }

  const startedAt = new Date().toISOString();

  try {
    // sessions 테이블은 public read 정책이 있어 anon 키로도 접근 가능 — 활동 핑으로 충분.
    const res = await fetch(
      `${supabaseUrl}/rest/v1/sessions?select=id&limit=1`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          Prefer: "count=none",
        },
        cache: "no-store",
      },
    );

    return NextResponse.json({
      ok: res.ok,
      status: res.status,
      pingedAt: startedAt,
      finishedAt: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "fetch error",
        pingedAt: startedAt,
      },
      { status: 502 },
    );
  }
}
