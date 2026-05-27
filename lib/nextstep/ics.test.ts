import { describe, it, expect } from "vitest";
import { planToICS } from "./ics";
import type { Plan } from "../types";

// 합성 플랜 — 모든 테스트가 공유하는 fixture.
function makePlan(overrides: Partial<Plan> = {}): Plan {
  return {
    headline: "테스트 90일 플랜",
    rationale: "두 자아가 ;세미콜론, 콤마, \n줄바꿈을 포함한 결론에 도달했다.",
    coreInsight: "한국어 + special chars: ; , \\ 문자열",
    firstStep: "오늘 30분, 가장 가까운 사람에게 말하기.",
    months: [
      {
        month: 1,
        theme: "탐색",
        actions: [
          { week: 1, title: "주 1 — 시작", why: "기반.", effort: "medium" },
          { week: 4, title: "주 4 — 첫 프로토타입", why: "검증.", effort: "large" },
        ],
      },
      {
        month: 2,
        theme: "심화",
        actions: [
          { week: 5, title: "주 5 — 피드백 수집", why: "감.", effort: "small" },
        ],
      },
      {
        month: 3,
        theme: "수확",
        actions: [
          { week: 12, title: "주 12 — 회고", why: "다음 90일.", effort: "small" },
        ],
      },
    ],
    resources: [],
    ...overrides,
  };
}

const START = new Date(2026, 5, 1); // 2026-06-01 (월=0-indexed, 5 = June)

describe("planToICS — structure", () => {
  it("starts with VCALENDAR header and ends with VCALENDAR footer", () => {
    const ics = planToICS(makePlan(), START, { planId: "test" });
    expect(ics.startsWith("BEGIN:VCALENDAR\r\n")).toBe(true);
    expect(ics.trimEnd().endsWith("END:VCALENDAR")).toBe(true);
  });

  it("includes required calendar properties", () => {
    const ics = planToICS(makePlan(), START, { planId: "test" });
    expect(ics).toContain("VERSION:2.0");
    expect(ics).toContain("PRODID:-//Next Step in Life//KR");
    expect(ics).toContain("CALSCALE:GREGORIAN");
    expect(ics).toContain("METHOD:PUBLISH");
  });

  it("produces one VEVENT per action plus the kickoff", () => {
    const ics = planToICS(makePlan(), START, { planId: "test" });
    const begins = ics.match(/BEGIN:VEVENT/g) ?? [];
    const ends = ics.match(/END:VEVENT/g) ?? [];
    // 4 actions + 1 kickoff (firstStep)
    expect(begins.length).toBe(5);
    expect(ends.length).toBe(5);
  });

  it("respects includeFirstStep: false", () => {
    const ics = planToICS(makePlan(), START, { planId: "test", includeFirstStep: false });
    const count = (ics.match(/BEGIN:VEVENT/g) ?? []).length;
    expect(count).toBe(4); // no kickoff
    expect(ics).not.toContain("kickoff");
  });
});

describe("planToICS — date arithmetic", () => {
  it("week N event is on startDate + (N-1)*7 days", () => {
    const ics = planToICS(makePlan(), START, { planId: "test" });
    // startDate = 2026-06-01
    // week 1 → 2026-06-01 (offset 0)
    // week 4 → 2026-06-22 (+21d)
    // week 5 → 2026-06-29 (+28d)
    // week 12 → 2026-08-17 (+77d)
    expect(ics).toContain("DTSTART;VALUE=DATE:20260601"); // week 1 + kickoff
    expect(ics).toContain("DTSTART;VALUE=DATE:20260622"); // week 4
    expect(ics).toContain("DTSTART;VALUE=DATE:20260629"); // week 5
    expect(ics).toContain("DTSTART;VALUE=DATE:20260817"); // week 12
  });

  it("DTEND is the day after DTSTART (exclusive)", () => {
    const ics = planToICS(makePlan(), START, { planId: "test" });
    expect(ics).toContain("DTSTART;VALUE=DATE:20260601");
    expect(ics).toContain("DTEND;VALUE=DATE:20260602");
    expect(ics).toContain("DTSTART;VALUE=DATE:20260817");
    expect(ics).toContain("DTEND;VALUE=DATE:20260818");
  });

  it("uses YYYYMMDD basic date format (no separators, no time)", () => {
    const ics = planToICS(makePlan(), START, { planId: "test" });
    // All DTSTART lines should match \d{8} exactly
    const dtstarts = ics.match(/DTSTART;VALUE=DATE:\d+/g) ?? [];
    expect(dtstarts.length).toBeGreaterThan(0);
    for (const line of dtstarts) {
      expect(line).toMatch(/^DTSTART;VALUE=DATE:\d{8}$/);
    }
  });
});

describe("planToICS — RFC 5545 line discipline", () => {
  it("uses CRLF throughout (no stray LF-only line)", () => {
    const ics = planToICS(makePlan(), START, { planId: "test" });
    const crlfCount = (ics.match(/\r\n/g) ?? []).length;
    const loneLF = (ics.match(/(?<!\r)\n/g) ?? []).length;
    expect(crlfCount).toBeGreaterThan(0);
    expect(loneLF).toBe(0);
  });

  it("no logical line exceeds 75 octets (byte-aware folding)", () => {
    // 일부러 한국어 긴 행을 만들어 folding 강제
    const longPlan = makePlan({
      headline: "한국어로 정말 길게 늘여 쓴 헤드라인 — 75옥텟을 명확히 넘는 멀티바이트 한국어 본문이 들어있다",
      months: [
        {
          month: 1,
          theme: "탐색",
          actions: [
            {
              week: 1,
              title: "주 1 — 한국어가 잔뜩 들어가서 75옥텟 한도를 넘기는 매우 긴 제목, 멀티바이트 문자가 경계에 걸칠 수 있음을 가정함",
              why: "테스트 케이스: 한국어 + 매우 긴 본문 + special chars: ; , \\",
              effort: "medium",
            },
          ],
        },
      ],
      resources: [],
    });
    const ics = planToICS(longPlan, START, { planId: "fold-test" });
    const enc = new TextEncoder();
    for (const line of ics.split("\r\n")) {
      // unfold: continuation lines start with single space; only the head line
      // is byte-bounded by 75. Continuations are bounded by 75 too (incl. SP).
      expect(enc.encode(line).length).toBeLessThanOrEqual(75);
    }
  });

  it("folds long lines with CRLF + single space continuation", () => {
    const longPlan = makePlan({
      headline: "긴 헤드라인 ".repeat(20),
    });
    const ics = planToICS(longPlan, START, { planId: "fold" });
    // continuation lines must start with a single space (RFC 5545)
    const lines = ics.split("\r\n");
    const continuations = lines.filter((l) => l.startsWith(" "));
    expect(continuations.length).toBeGreaterThan(0);
  });
});

describe("planToICS — text escaping (RFC 5545)", () => {
  it("escapes semicolons in SUMMARY/DESCRIPTION", () => {
    const plan = makePlan({
      firstStep: "오늘 ; 세미콜론 포함",
    });
    const ics = planToICS(plan, START, { planId: "esc" });
    // The escaped form is \; (backslash-semicolon)
    expect(ics).toContain("\\;");
  });

  it("escapes commas", () => {
    const plan = makePlan({
      firstStep: "오늘 , 콤마 포함",
    });
    const ics = planToICS(plan, START, { planId: "esc" });
    expect(ics).toContain("\\,");
  });

  it("escapes newlines as backslash-n", () => {
    const plan = makePlan({
      rationale: "줄1\n줄2",
    });
    const ics = planToICS(plan, START, { planId: "esc" });
    // The DESCRIPTION includes rationale; the newline should become literal \n
    expect(ics).toMatch(/줄1\\n줄2/);
  });
});

describe("planToICS — UIDs", () => {
  it("uses planId when provided", () => {
    const ics = planToICS(makePlan(), START, { planId: "my-plan-abc" });
    expect(ics).toContain("UID:nextstep-my-plan-abc-w1-0@nextstepinlife");
    expect(ics).toContain("UID:nextstep-my-plan-abc-w12-0@nextstepinlife");
    expect(ics).toContain("UID:nextstep-my-plan-abc-kickoff@nextstepinlife");
  });

  it("falls back to a deterministic hash when planId is omitted", () => {
    const a = planToICS(makePlan(), START);
    const b = planToICS(makePlan(), START);
    // Same plan → same UID
    const uidA = a.match(/UID:nextstep-([a-z0-9]+)-w1-0@nextstepinlife/)?.[1];
    const uidB = b.match(/UID:nextstep-([a-z0-9]+)-w1-0@nextstepinlife/)?.[1];
    expect(uidA).toBeDefined();
    expect(uidA).toBe(uidB);
  });

  it("different plans produce different fallback UIDs", () => {
    const a = planToICS(makePlan({ headline: "A" }), START);
    const b = planToICS(makePlan({ headline: "B" }), START);
    const uidA = a.match(/UID:nextstep-([a-z0-9]+)-w1-0/)?.[1];
    const uidB = b.match(/UID:nextstep-([a-z0-9]+)-w1-0/)?.[1];
    expect(uidA).not.toBe(uidB);
  });
});

describe("planToICS — Korean / UTF-8 preservation", () => {
  it("keeps Korean characters intact in SUMMARY/DESCRIPTION", () => {
    const plan = makePlan({
      firstStep: "오늘 30분, 한 사람에게 말하기.",
    });
    const ics = planToICS(plan, START, { planId: "ko" });
    // After RFC escaping the comma, "30분" should still be there
    expect(ics).toContain("30분");
    expect(ics).toContain("말하기");
    expect(ics).toContain("탐색"); // month theme
  });

  it("escapes special chars but preserves surrounding Korean", () => {
    const plan = makePlan({
      firstStep: "안녕; 반갑, 습니다",
    });
    const ics = planToICS(plan, START, { planId: "ko" });
    expect(ics).toMatch(/안녕\\;\s?반갑\\,\s?습니다/);
  });
});

describe("planToICS — edge cases", () => {
  it("handles empty months gracefully (kickoff only)", () => {
    const empty: Plan = {
      headline: "빈 플랜",
      rationale: "이유.",
      coreInsight: "통찰.",
      firstStep: "한 걸음.",
      months: [],
      resources: [],
    };
    const ics = planToICS(empty, START, { planId: "empty" });
    const count = (ics.match(/BEGIN:VEVENT/g) ?? []).length;
    expect(count).toBe(1); // kickoff only
  });

  it("week 1 kickoff and week 1 action share startDate (both on day 1)", () => {
    const ics = planToICS(makePlan(), START, { planId: "test" });
    // The first event (kickoff) and the week 1 action are both on 2026-06-01
    const w1 = ics.match(/DTSTART;VALUE=DATE:20260601/g) ?? [];
    expect(w1.length).toBeGreaterThanOrEqual(2);
  });
});
