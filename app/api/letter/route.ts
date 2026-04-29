import { NextResponse } from "next/server";

/**
 * 미래의 나에게 편지 — API stub.
 *
 * 현재는 클라이언트 localStorage가 진실의 원천. 이 endpoint는 형식 검증 후
 * acknowledgement만 반환. 추후 Prisma/Supabase 저장 + 발송 스케줄러 연동 예정.
 */

type LetterPayload = {
  id?: unknown;
  title?: unknown;
  content?: unknown;
  deliveryWindow?: unknown;
  createdAt?: unknown;
  deliverAt?: unknown;
};

const ALLOWED_WINDOWS = new Set(["30d", "90d", "180d", "365d"]);

export async function POST(request: Request) {
  let body: LetterPayload = {};
  try {
    body = (await request.json()) as LetterPayload;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON" },
      { status: 400 },
    );
  }

  if (typeof body.content !== "string" || body.content.trim().length === 0) {
    return NextResponse.json(
      { ok: false, error: "content is required" },
      { status: 400 },
    );
  }

  if (
    typeof body.deliveryWindow !== "string" ||
    !ALLOWED_WINDOWS.has(body.deliveryWindow)
  ) {
    return NextResponse.json(
      {
        ok: false,
        error: `deliveryWindow must be one of ${Array.from(ALLOWED_WINDOWS).join(", ")}`,
      },
      { status: 400 },
    );
  }

  const id =
    typeof body.id === "string" && body.id.length > 0
      ? body.id
      : crypto.randomUUID();

  return NextResponse.json({
    ok: true,
    id,
    storedAt: new Date().toISOString(),
    note: "API stub — 실제 DB 저장 + 발송 스케줄링은 추후 구현 예정",
  });
}

export async function GET() {
  return NextResponse.json({
    letters: [],
    note: "API stub — 현재는 클라이언트 localStorage에서 표시. DB 연동 후 여기서 반환 예정.",
  });
}
