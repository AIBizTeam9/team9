import { describe, it, expect } from "vitest";
import { gatePublicPlan, getPublicPlan, type PublicPlanQueryClient } from "./db";

// Minimal fake Supabase client. Matches the exact chain getPublicPlan uses:
// from(table).select(cols).eq(col, val).maybeSingle() → { data, error }.
// The /share/[id] page calls the SAME getPublicPlan function, so these tests
// exercise the page's data path end-to-end (everything except the React render).
function fakeClient(
  response: { data: unknown; error?: unknown },
): PublicPlanQueryClient {
  return {
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({ data: response.data, error: response.error ?? null }),
        }),
      }),
    }),
  };
}

// gatePublicPlan은 순수 — Supabase 없이 row 객체만으로 검증한다.
// 핵심 invariant: row.is_public !== true 이면 절대 plan을 반환하지 않는다.

function row(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: "plan-123",
    user_id: "user-abc",
    created_at: "2026-05-01T00:00:00Z",
    answers: { q: "a" },
    personas: [{ name: "A" }, { name: "B" }],
    plan: { headline: "h", rationale: "r", coreInsight: "c", firstStep: "f", months: [], resources: [] },
    progress: {},
    is_public: true,
    ...overrides,
  };
}

describe("gatePublicPlan() — only public plans pass through", () => {
  it("returns the plan when row.is_public === true", () => {
    const out = gatePublicPlan(row());
    expect(out).not.toBeNull();
    expect(out?.id).toBe("plan-123");
    expect(out?.is_public).toBe(true);
    expect(out?.plan.headline).toBe("h");
  });

  it("returns null when row.is_public === false (NEVER expose a private plan)", () => {
    expect(gatePublicPlan(row({ is_public: false }))).toBeNull();
  });

  it("returns null when is_public is omitted (legacy row, no migration yet)", () => {
    const r = row();
    delete r.is_public;
    expect(gatePublicPlan(r)).toBeNull();
  });

  it("returns null when is_public is truthy but not strictly === true", () => {
    // Defense against coerced values from the wire: 1, 'true', 'yes', etc.
    expect(gatePublicPlan(row({ is_public: 1 }))).toBeNull();
    expect(gatePublicPlan(row({ is_public: "true" }))).toBeNull();
    expect(gatePublicPlan(row({ is_public: {} }))).toBeNull();
  });

  it("returns null for null / undefined / non-object input", () => {
    expect(gatePublicPlan(null)).toBeNull();
    expect(gatePublicPlan(undefined)).toBeNull();
    expect(gatePublicPlan("not an object")).toBeNull();
    expect(gatePublicPlan(42)).toBeNull();
  });

  it("returns null for rows missing required fields", () => {
    expect(gatePublicPlan(row({ id: undefined }))).toBeNull();
    expect(gatePublicPlan(row({ id: "" }))).toBeNull();
    expect(gatePublicPlan(row({ user_id: undefined }))).toBeNull();
    expect(gatePublicPlan(row({ plan: undefined }))).toBeNull();
    expect(gatePublicPlan(row({ plan: null }))).toBeNull();
  });

  it("defaults progress to {} when missing", () => {
    const r = row();
    delete r.progress;
    const out = gatePublicPlan(r);
    expect(out?.progress).toEqual({});
  });

  it("forces is_public on the output to true (mirrors invariant — the only way to reach this output is via the gate)", () => {
    // Even if a future caller passes a weird mix, the returned object should
    // have is_public:true so downstream code can rely on it.
    const out = gatePublicPlan(row({ is_public: true }));
    expect(out?.is_public).toBe(true);
  });
});

describe("getPublicPlan() — DB caller", () => {
  it("returns null when id is empty or whitespace (no Supabase call needed)", async () => {
    expect(await getPublicPlan("")).toBeNull();
    expect(await getPublicPlan("   ")).toBeNull();
    // @ts-expect-error — runtime defense against non-string input
    expect(await getPublicPlan(null)).toBeNull();
    // @ts-expect-error — runtime defense against non-string input
    expect(await getPublicPlan(undefined)).toBeNull();
  });

  it("returns null when Supabase is unavailable (vitest node env → getSupabase returns null)", async () => {
    // In vitest's node environment, `typeof window === "undefined"`, so
    // getSupabase() returns null. getPublicPlan must short-circuit gracefully
    // rather than throw — this is what the /share/[id] server page relies on
    // for the missing-config case.
    const result = await getPublicPlan("some-valid-looking-id");
    expect(result).toBeNull();
  });
});

describe("getPublicPlan() with injected client — the /share/[id] page path", () => {
  it("RETURNS a real PUBLIC plan when supabase returns row with is_public=true", async () => {
    const publicPlanRow = {
      id: "real-public-plan",
      user_id: "owner-1",
      created_at: "2026-05-20T00:00:00Z",
      answers: { stuck: "지금 막막함" },
      personas: [{ name: "안정형" }, { name: "도전형" }],
      plan: { headline: "공유된 플랜", rationale: "r", coreInsight: "c", firstStep: "f", months: [], resources: [] },
      progress: {},
      is_public: true,
    };
    const result = await getPublicPlan("real-public-plan", fakeClient({ data: publicPlanRow }));
    expect(result).not.toBeNull();
    expect(result?.id).toBe("real-public-plan");
    expect(result?.plan.headline).toBe("공유된 플랜");
    expect(result?.is_public).toBe(true);
  });

  it("BLOCKS a real PRIVATE plan even though supabase returned the row (defense-in-depth past RLS)", async () => {
    // Suppose RLS misconfigured or the row crosses into the result set somehow.
    // gatePublicPlan inside getPublicPlan is the second layer that catches it.
    // The /share/[id] page renders 'not shared' when this returns null — verified
    // by the smoke test against the dev server.
    const privatePlanRow = {
      id: "real-private-plan",
      user_id: "owner-1",
      created_at: "2026-05-20T00:00:00Z",
      answers: { stuck: "내부 답변" },
      personas: [{ name: "비공개 페르소나" }],
      plan: { headline: "비밀 플랜", rationale: "r", coreInsight: "c", firstStep: "f", months: [], resources: [] },
      progress: {},
      is_public: false, // <-- the row exists, but is private
    };
    const result = await getPublicPlan("real-private-plan", fakeClient({ data: privatePlanRow }));
    expect(result).toBeNull();
    // Critical: NO secret field of the private plan leaks through
    expect(JSON.stringify(result)).not.toContain("비밀 플랜");
    expect(JSON.stringify(result)).not.toContain("비공개 페르소나");
  });

  it("returns null when supabase returns no row (missing id)", async () => {
    const result = await getPublicPlan("does-not-exist", fakeClient({ data: null }));
    expect(result).toBeNull();
  });

  it("returns null when supabase returns an error", async () => {
    const result = await getPublicPlan(
      "any-id",
      fakeClient({ data: null, error: { message: "permission denied" } }),
    );
    expect(result).toBeNull();
  });

  it("treats is_public missing or coerced (e.g. boolean-like 1/'true') as private", async () => {
    // Defense against legacy rows or wire-format drift. The page must not leak.
    const legacyRow = {
      id: "legacy", user_id: "u", created_at: "t",
      plan: { headline: "x", rationale: "", coreInsight: "", firstStep: "", months: [], resources: [] },
      // is_public missing entirely
    };
    expect(await getPublicPlan("legacy", fakeClient({ data: legacyRow }))).toBeNull();

    const coercedRow = { ...legacyRow, is_public: 1 };
    expect(await getPublicPlan("legacy", fakeClient({ data: coercedRow }))).toBeNull();

    const stringRow = { ...legacyRow, is_public: "true" };
    expect(await getPublicPlan("legacy", fakeClient({ data: stringRow }))).toBeNull();
  });
});
