// 90일 플랜을 RFC 5545 .ics 문자열로 직렬화한다. 외부 라이브러리 X.
// 모든 이벤트는 all-day(DATE value). DTSTART는 해당 주의 시작일, DTEND는 다음 날(exclusive).
// 첫걸음(firstStep)은 startDate 당일에 별도의 kickoff 이벤트.

import type { Plan, PlanAction } from "@/lib/types";

const PRODID = "-//Next Step in Life//KR";
const CRLF = "\r\n";

// SUMMARY / DESCRIPTION 등 TEXT value를 위한 이스케이프. DATE / UID에는 쓰지 않는다.
function escapeText(input: string): string {
  return input
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

// YYYYMMDD (all-day DATE)
function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}

// YYYYMMDDTHHMMSSZ (UTC, DTSTAMP)
function formatStamp(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}` +
    `T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`
  );
}

function addDays(base: Date, days: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
}

// RFC 5545 line folding: 한 줄이 75 octets 넘으면 CRLF + 단일 공백(SP)으로 이어 붙인다.
// 한국어는 UTF-8에서 3바이트라 character count로 나누면 75옥텟 가드를 넘길 수 있어
// 명시적으로 byte length로 자른다. 멀티바이트 문자가 두 청크에 걸쳐 깨지지 않도록
// 코드포인트 단위로 누적한다.
function foldLine(line: string): string {
  const enc = new TextEncoder();
  const limit = 75; // 첫 줄 75옥텟, 이어지는 줄은 1옥텟이 SP라 74가 안전치
  let out = "";
  let bytes = 0;
  let chunkStart = 0;
  let firstChunk = true;
  // codepoint iteration
  let i = 0;
  while (i < line.length) {
    // 멀티바이트 surrogate pair 보호
    const cp = line.codePointAt(i)!;
    const char = String.fromCodePoint(cp);
    const charBytes = enc.encode(char).length;
    const cap = firstChunk ? limit : limit - 1; // 이어붙는 줄은 leading space 1옥텟
    if (bytes + charBytes > cap && bytes > 0) {
      const chunk = line.slice(chunkStart, i);
      out += (firstChunk ? "" : " ") + chunk + CRLF;
      firstChunk = false;
      chunkStart = i;
      bytes = 0;
    }
    bytes += charBytes;
    i += char.length;
  }
  const tail = line.slice(chunkStart);
  out += (firstChunk ? "" : " ") + tail;
  return out;
}

// 헤딩+코어인사이트 기반 deterministic 해시 (planId 없을 때 안정적인 UID 만들기 위함).
// 짧은 base36 해시면 충분 — 같은 plan에 대해 동일하게 나오기만 하면 된다.
function planHash(plan: Plan): string {
  const src = `${plan.headline}|${plan.coreInsight}`;
  let h = 0;
  for (let i = 0; i < src.length; i += 1) {
    h = (h * 31 + src.charCodeAt(i)) | 0;
  }
  return (h >>> 0).toString(36);
}

type ICSEventInput = {
  uid: string;
  start: Date;
  summary: string;
  description: string;
  stamp: Date;
};

function renderEvent(ev: ICSEventInput): string {
  const lines = [
    "BEGIN:VEVENT",
    `UID:${ev.uid}`,
    `DTSTAMP:${formatStamp(ev.stamp)}`,
    `DTSTART;VALUE=DATE:${formatDate(ev.start)}`,
    `DTEND;VALUE=DATE:${formatDate(addDays(ev.start, 1))}`,
    foldLine(`SUMMARY:${escapeText(ev.summary)}`),
    foldLine(`DESCRIPTION:${escapeText(ev.description)}`),
    "END:VEVENT",
  ];
  return lines.join(CRLF);
}

const EFFORT_HINT: Record<PlanAction["effort"], string> = {
  small: "~30분",
  medium: "~2시간",
  large: "~반나절",
};

export type PlanToICSOptions = {
  // UID 충돌 방지용. 보통 saved-plan view에서 plan.id를 넘긴다. 없으면 planHash로 fallback.
  planId?: string;
  // 첫걸음 이벤트 노출 여부. 기본 true.
  includeFirstStep?: boolean;
};

export function planToICS(
  plan: Plan,
  startDate: Date,
  opts: PlanToICSOptions = {},
): string {
  const stamp = new Date(); // DTSTAMP는 calendar app이 "마지막 수정 시각"으로 본다
  const idTag = opts.planId ?? planHash(plan);
  const includeFirstStep = opts.includeFirstStep ?? true;

  const events: string[] = [];

  if (includeFirstStep && plan.firstStep) {
    events.push(
      renderEvent({
        uid: `nextstep-${idTag}-kickoff@nextstepinlife`,
        start: startDate,
        summary: `첫 걸음: ${plan.firstStep}`,
        description: `${plan.headline}\n\n${plan.rationale ?? ""}`,
        stamp,
      }),
    );
  }

  for (const month of plan.months ?? []) {
    const actions = month.actions ?? [];
    actions.forEach((action, idx) => {
      const dayOffset = (action.week - 1) * 7;
      const start = addDays(startDate, dayOffset);
      const hint = EFFORT_HINT[action.effort] ?? "";
      const summary = hint
        ? `[${hint}] ${action.title}`
        : action.title;
      const description = [
        action.why,
        "",
        `Month ${month.month} · ${month.theme}`,
        plan.headline,
      ].join("\n");
      events.push(
        renderEvent({
          uid: `nextstep-${idTag}-w${action.week}-${idx}@nextstepinlife`,
          start,
          summary,
          description,
          stamp,
        }),
      );
    });
  }

  const head = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:${PRODID}`,
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    foldLine(`X-WR-CALNAME:${escapeText(`Next Step · ${plan.headline}`)}`),
  ].join(CRLF);

  const tail = "END:VCALENDAR";

  return [head, ...events, tail].join(CRLF) + CRLF;
}
