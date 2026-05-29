// 90일 플랜 시작일과 오늘 날짜로부터 현재 몇 주차인지 계산.
//
// Week 1 = 시작일 당일부터 6일 후까지 (7일 윈도우, 0-indexed 아님).
// 12주 플랜이지만 함수는 13+도 그대로 반환 — 호출자가 plan.months 범위 안에서
// 의미 있는지 판단한다.
//
// 시작일보다 이전이면 0 반환 (아직 시작 안 함).
//
// 시간/타임존 영향을 줄이려고 두 날짜를 YYYY-MM-DD로 묶고 UTC 정오 기준으로
// diff한다 — DST 전환·로컬 시차로 인한 ±1일 오차 방지.

function toUtcMidday(d: Date): number {
  return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 12);
}

export function currentWeek(startDate: Date, today: Date): number {
  const startMs = toUtcMidday(startDate);
  const todayMs = toUtcMidday(today);
  if (todayMs < startMs) return 0;
  const dayDiff = Math.floor((todayMs - startMs) / (24 * 60 * 60 * 1000));
  return Math.floor(dayDiff / 7) + 1;
}

// 90일 플랜 안에 들어있는 주 번호인지. UI는 1-12 범위에서만 하이라이트해야 함.
export function isWithinPlan(week: number, totalWeeks = 12): boolean {
  return week >= 1 && week <= totalWeeks;
}
