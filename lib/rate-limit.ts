// 가벼운 in-memory rate limiter. Anthropic을 호출하는 공개 API에 abuse 가드.
//
// 한계: serverless 환경에선 인스턴스별로 state가 분리된다. 즉 "글로벌" 제한이
// 아니라 인스턴스마다 별도의 카운터를 가진다. 그래도 한 사람이 같은 인스턴스로
// 짧은 시간에 반복 호출하는 흔한 abuse 패턴은 막힌다.
//
// 글로벌 제한이 정말 필요해지면 Upstash Redis로 교체. 동일한 시그니처를
// 유지하도록 인터페이스를 좁게 잡아둠.

import type { NextRequest } from "next/server";

type Bucket = {
  // 윈도 시작 시각 (ms). resetAt = start + windowMs.
  start: number;
  count: number;
};

const buckets = new Map<string, Bucket>();

// 메모리 누수 방지: 호출 시점에 stale 키 청소. 1000개 넘으면 한 번에 청소.
function gcIfNeeded(now: number, windowMs: number) {
  if (buckets.size < 1000) return;
  for (const [key, b] of buckets) {
    if (now - b.start > windowMs) buckets.delete(key);
  }
}

// 클라이언트 IP 추정. Vercel 등 서비스가 다양한 헤더를 쓰므로 우선순위로 시도.
function getClientIp(req: NextRequest): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) {
    // 첫 hop만 신뢰 — 나머지는 proxy 체인.
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  const real = req.headers.get("x-real-ip");
  if (real) return real;
  return "unknown";
}

export type RateLimitResult =
  | { ok: true }
  | { ok: false; retryAfterSec: number };

/**
 * 슬라이딩-스타트 token bucket: 윈도가 시작된 시점부터 windowMs 동안
 * limit개까지 허용. 윈도가 지나면 카운터 리셋.
 *
 * @param req      현재 요청 (IP 추출용)
 * @param key      라우트 식별자 (예: "generate-plan")
 * @param limit    윈도 내 허용 횟수
 * @param windowMs 윈도 길이 (ms)
 */
export function checkRateLimit(
  req: NextRequest,
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const ip = getClientIp(req);
  const id = `${key}:${ip}`;
  const now = Date.now();
  gcIfNeeded(now, windowMs);

  const existing = buckets.get(id);
  if (!existing || now - existing.start >= windowMs) {
    buckets.set(id, { start: now, count: 1 });
    return { ok: true };
  }

  if (existing.count < limit) {
    existing.count += 1;
    return { ok: true };
  }

  const retryAfterSec = Math.max(
    1,
    Math.ceil((existing.start + windowMs - now) / 1000),
  );
  return { ok: false, retryAfterSec };
}

// 응답 헬퍼 — 호출부에서 사용. NextResponse는 caller가 처리.
export function rateLimitedResponse(retryAfterSec: number) {
  return {
    status: 429,
    body: { error: "rate_limited", retryAfterSec },
    headers: { "Retry-After": String(retryAfterSec) } as Record<string, string>,
  };
}

// 본문 사이즈 가드. 작은 abuse 차단용 (Claude 호출 전에 차단).
export const MAX_BODY_BYTES = 32 * 1024; // 32 KB

export function checkBodySize(req: NextRequest): RateLimitResult | null {
  const len = req.headers.get("content-length");
  if (!len) return null;
  const n = parseInt(len, 10);
  if (Number.isFinite(n) && n > MAX_BODY_BYTES) {
    return { ok: false, retryAfterSec: 1 }; // 사이즈 초과는 즉시 차단
  }
  return null;
}
