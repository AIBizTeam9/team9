// current-week 단위테스트. 시간/DST 경계와 90일 플랜 윈도우의 양 끝을 다 친다.

import { describe, it, expect } from "vitest";
import { currentWeek, isWithinPlan } from "./current-week";

const D = (s: string) => new Date(s);

describe("currentWeek — 90일 플랜에서 오늘이 몇 주차인지", () => {
  it("시작일 당일은 week 1", () => {
    expect(currentWeek(D("2026-01-01"), D("2026-01-01"))).toBe(1);
  });

  it("시작일 + 6일 (week 1 마지막 날)도 week 1", () => {
    expect(currentWeek(D("2026-01-01"), D("2026-01-07"))).toBe(1);
  });

  it("시작일 + 7일은 week 2", () => {
    expect(currentWeek(D("2026-01-01"), D("2026-01-08"))).toBe(2);
  });

  it("시작일 + 77일은 week 12 (90일 플랜 마지막 주 시작)", () => {
    expect(currentWeek(D("2026-01-01"), D("2026-03-19"))).toBe(12);
  });

  it("시작일 + 83일은 week 12 (90일 플랜 마지막 주 끝)", () => {
    expect(currentWeek(D("2026-01-01"), D("2026-03-25"))).toBe(12);
  });

  it("시작일 + 84일은 week 13 (플랜 윈도우 밖)", () => {
    expect(currentWeek(D("2026-01-01"), D("2026-03-26"))).toBe(13);
  });

  it("시작일보다 이전이면 0", () => {
    expect(currentWeek(D("2026-01-10"), D("2026-01-01"))).toBe(0);
  });

  it("같은 날 다른 시각도 동일한 week — 타임존/시간 영향 X", () => {
    const start = new Date("2026-01-01T23:00:00+09:00");
    const today = new Date("2026-01-08T00:30:00+09:00");
    // 한국시간 1/8 자정 직후 = UTC 1/7 — 두 정오 묶음 diff = 7일 → week 2
    expect(currentWeek(start, today)).toBe(2);
  });

  it("DST 전환 구간 (US 봄 spring-forward) 가로질러도 정확", () => {
    // 2026-03-08 02:00 → 03:00 (DST start in US). 7일 차이 → 정확히 week 2.
    const start = new Date("2026-03-07T08:00:00Z");
    const today = new Date("2026-03-14T08:00:00Z");
    expect(currentWeek(start, today)).toBe(2);
  });
});

describe("isWithinPlan — UI 하이라이트 가드", () => {
  it("1~12는 모두 in-range", () => {
    for (let w = 1; w <= 12; w++) expect(isWithinPlan(w)).toBe(true);
  });

  it("0은 out-of-range (아직 시작 전)", () => {
    expect(isWithinPlan(0)).toBe(false);
  });

  it("13+는 out-of-range (플랜 종료 후)", () => {
    expect(isWithinPlan(13)).toBe(false);
    expect(isWithinPlan(100)).toBe(false);
  });

  it("totalWeeks 인자로 다른 길이 플랜도 지원", () => {
    expect(isWithinPlan(13, 24)).toBe(true);
    expect(isWithinPlan(25, 24)).toBe(false);
  });
});
