// IP 기반 in-memory rate limiter + body size guard 의 단위테스트.
// PR #31 (feat/rate-limit-guard)에서 추가된 공개 API abuse 가드. 외부 호출 없이
// req mock만으로 검증 — Anthropic·Vercel 환경 의존성 없음.

import { describe, it, expect, beforeEach, vi } from "vitest";
import type { NextRequest } from "next/server";
import {
  checkRateLimit,
  checkBodySize,
  rateLimitedResponse,
  MAX_BODY_BYTES,
} from "./rate-limit";

// rate-limit.ts는 NextRequest.headers.get(name) 만 사용. 그러므로 최소 mock.
function mockReq(headers: Record<string, string | undefined> = {}): NextRequest {
  return {
    headers: {
      get: (name: string) => headers[name.toLowerCase()] ?? null,
    },
  } as unknown as NextRequest;
}

describe("checkRateLimit", () => {
  // buckets는 module-level Map이라 테스트 간 누수 방지를 위해 각 테스트마다
  // unique한 key + IP 조합을 쓴다.
  let testCounter = 0;
  beforeEach(() => {
    testCounter += 1;
  });

  it("첫 호출은 ok: true 를 반환한다", () => {
    const req = mockReq({ "x-forwarded-for": `1.1.1.${testCounter}` });
    const result = checkRateLimit(req, `k-${testCounter}`, 5, 60_000);
    expect(result).toEqual({ ok: true });
  });

  it("limit 미만이면 같은 IP·key 반복 호출이 모두 통과한다", () => {
    const ip = `2.2.2.${testCounter}`;
    const key = `k-${testCounter}`;
    const req = mockReq({ "x-forwarded-for": ip });

    for (let i = 0; i < 4; i++) {
      expect(checkRateLimit(req, key, 5, 60_000)).toEqual({ ok: true });
    }
  });

  it("limit 도달 시 다음 호출은 ok: false 와 retryAfterSec 을 돌려준다", () => {
    const ip = `3.3.3.${testCounter}`;
    const key = `k-${testCounter}`;
    const req = mockReq({ "x-forwarded-for": ip });

    // limit=3 → 3번까지 OK, 4번째에서 차단.
    expect(checkRateLimit(req, key, 3, 60_000)).toEqual({ ok: true });
    expect(checkRateLimit(req, key, 3, 60_000)).toEqual({ ok: true });
    expect(checkRateLimit(req, key, 3, 60_000)).toEqual({ ok: true });

    const blocked = checkRateLimit(req, key, 3, 60_000);
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) {
      expect(blocked.retryAfterSec).toBeGreaterThan(0);
      expect(blocked.retryAfterSec).toBeLessThanOrEqual(60);
    }
  });

  it("다른 IP는 별도 버킷을 갖는다 (한 IP의 차단이 다른 IP에 전이 안 됨)", () => {
    const key = `k-${testCounter}`;
    const ipA = `4.4.4.${testCounter}`;
    const ipB = `5.5.5.${testCounter}`;

    // IP A를 limit까지 소진.
    const reqA = mockReq({ "x-forwarded-for": ipA });
    expect(checkRateLimit(reqA, key, 1, 60_000)).toEqual({ ok: true });
    expect(checkRateLimit(reqA, key, 1, 60_000).ok).toBe(false);

    // IP B는 영향 없어야 함.
    const reqB = mockReq({ "x-forwarded-for": ipB });
    expect(checkRateLimit(reqB, key, 1, 60_000)).toEqual({ ok: true });
  });

  it("다른 key는 같은 IP라도 별도 버킷을 갖는다", () => {
    const ip = `6.6.6.${testCounter}`;
    const req = mockReq({ "x-forwarded-for": ip });

    // key A를 limit까지.
    expect(checkRateLimit(req, `keyA-${testCounter}`, 1, 60_000)).toEqual({ ok: true });
    expect(checkRateLimit(req, `keyA-${testCounter}`, 1, 60_000).ok).toBe(false);

    // 같은 IP라도 key B는 독립.
    expect(checkRateLimit(req, `keyB-${testCounter}`, 1, 60_000)).toEqual({ ok: true });
  });

  it("windowMs 가 지나면 카운터가 리셋된다", () => {
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));

      const req = mockReq({ "x-forwarded-for": `7.7.7.${testCounter}` });
      const key = `window-${testCounter}`;

      // limit=2를 소진.
      expect(checkRateLimit(req, key, 2, 10_000)).toEqual({ ok: true });
      expect(checkRateLimit(req, key, 2, 10_000)).toEqual({ ok: true });
      expect(checkRateLimit(req, key, 2, 10_000).ok).toBe(false);

      // 윈도 다 지나면 첫 호출로 리셋.
      vi.advanceTimersByTime(11_000);
      expect(checkRateLimit(req, key, 2, 10_000)).toEqual({ ok: true });
    } finally {
      vi.useRealTimers();
    }
  });

  it("x-forwarded-for 의 첫 hop 을 IP 로 신뢰한다 (proxy 체인 무시)", () => {
    const key = `xff-${testCounter}`;
    // 동일한 첫 IP, 다른 proxy 체인 → 같은 버킷으로 묶여야 함.
    const reqA = mockReq({ "x-forwarded-for": `8.8.8.${testCounter}, 10.0.0.1` });
    const reqB = mockReq({ "x-forwarded-for": `8.8.8.${testCounter}, 192.168.1.1` });

    expect(checkRateLimit(reqA, key, 1, 60_000)).toEqual({ ok: true });
    // reqB 의 첫 hop 이 reqA 와 동일하므로 limit=1을 이미 소진한 상태.
    expect(checkRateLimit(reqB, key, 1, 60_000).ok).toBe(false);
  });

  it("x-forwarded-for 가 없으면 x-real-ip 를 IP 로 쓴다", () => {
    const key = `real-${testCounter}`;
    const ip = `9.9.9.${testCounter}`;
    const req1 = mockReq({ "x-real-ip": ip });
    const req2 = mockReq({ "x-real-ip": ip });

    expect(checkRateLimit(req1, key, 1, 60_000)).toEqual({ ok: true });
    expect(checkRateLimit(req2, key, 1, 60_000).ok).toBe(false);
  });

  it("어떤 IP 헤더도 없으면 'unknown' 으로 묶여 같은 버킷이 된다", () => {
    const key = `unknown-${testCounter}`;
    const req = mockReq({});

    expect(checkRateLimit(req, key, 1, 60_000)).toEqual({ ok: true });
    // 같은 'unknown' 으로 묶이므로 두 번째 호출은 차단.
    expect(checkRateLimit(req, key, 1, 60_000).ok).toBe(false);
  });
});

describe("checkBodySize", () => {
  it("content-length 헤더가 없으면 null (건너뜀)", () => {
    expect(checkBodySize(mockReq({}))).toBeNull();
  });

  it("MAX_BODY_BYTES 이하면 null (통과)", () => {
    const req = mockReq({ "content-length": String(MAX_BODY_BYTES - 1) });
    expect(checkBodySize(req)).toBeNull();
  });

  it("MAX_BODY_BYTES 와 정확히 같으면 null (경계는 통과)", () => {
    const req = mockReq({ "content-length": String(MAX_BODY_BYTES) });
    expect(checkBodySize(req)).toBeNull();
  });

  it("MAX_BODY_BYTES 초과면 ok:false + retryAfterSec:1", () => {
    const req = mockReq({ "content-length": String(MAX_BODY_BYTES + 1) });
    expect(checkBodySize(req)).toEqual({ ok: false, retryAfterSec: 1 });
  });

  it("content-length 가 숫자로 파싱 안 되면 null", () => {
    const req = mockReq({ "content-length": "not-a-number" });
    expect(checkBodySize(req)).toBeNull();
  });
});

describe("rateLimitedResponse", () => {
  it("status 429 + body.retryAfterSec + Retry-After 헤더를 만든다", () => {
    const res = rateLimitedResponse(42);
    expect(res.status).toBe(429);
    expect(res.body).toEqual({ error: "rate_limited", retryAfterSec: 42 });
    expect(res.headers["Retry-After"]).toBe("42");
  });
});
