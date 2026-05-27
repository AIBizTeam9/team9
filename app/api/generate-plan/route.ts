import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import type { Answers, Persona, Plan, PlanMonth, PlanResource } from "@/lib/types";
import { checkBodySize, checkRateLimit } from "@/lib/rate-limit";
import {
  libraryCatalogForPrompt,
  resolvePicks,
} from "@/lib/nextstep/resource-library";

// 가장 비싼 라우트 (병렬 5개 Claude 호출). 가장 엄격하게 제한.
const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 10 * 60 * 1000; // 10분

// Claude 호출 전에 input 사이즈 가드. 모델별 max_tokens는 prompt에서 처리.
const MAX_ANSWER_KEYS = 60;        // 퀴즈는 15문항 + follow-ups. 60이면 충분히 여유.
const MAX_ANSWER_VALUE_LEN = 2000; // 한 답변 본문 상한.
const MAX_PERSONA_FIELD_LEN = 800; // 페르소나 필드 한 줄 상한.

// 5개 병렬 Claude 호출로 분할 — 한 번의 거대 호출이 60초를 넘기는 문제를 회피.
// 각 호출은 output 1500~2000 토큰으로 작아 8~12초에 끝남.
// 모두 병렬이므로 wall time = 가장 느린 호출 ≈ ~12초.
export const maxDuration = 60;

const COMMON_RULES = `Hard rules:
- Use the user's exact words back when relevant — quote their phrases (stuck, desiredChange, feelsAlive).
- If user selected "Prefer not to say" for income, never reference income.
- Match the language of the user's free-text answers (Korean/English).
- Avoid generic advice. Every action must have a concrete next step.
- Some answers may have a clarifying follow-up under \`<key>_followup\`. Treat both as one richer answer; quote from the follow-up too.
- Output ONLY the JSON object specified. No prose, no markdown fences.`;

const FRAMING_PROMPT = `You are a career and life coach. Given a user's quiz answers and two chosen future-self personas, produce a tight framing JSON.

${COMMON_RULES}

Writing rules:
- rationale: 2-3 sentences as if summarizing what Persona A and Persona B argued. Reference both by name. Substance from their coreBelief and strongestArgument.
- coreInsight: ONE truth both personas half-admitted but the user has not yet said out loud. Use the user's own phrasing.

Schema:
{
  "headline": "string — one-sentence summary of the 90-day plan",
  "rationale": "string",
  "coreInsight": "string",
  "firstStep": "string — the one specific thing to do today"
}`;

const MONTH_PROMPT = `You are a career and life coach. Given a user's quiz answers, two personas, and a target month number, produce one month's plan.

${COMMON_RULES}

Writing rules:
- theme: 4-8 words capturing this month's focus, distinct from other months.
- 3-5 actions. Each must fit the user's stated weekly hours budget.
- weeks: month 1 uses weeks 1-4, month 2 uses 5-8, month 3 uses 9-12.
- For EACH action, also produce three difficulty tiers — three concrete versions of the same underlying intent at different execution barriers:
  - high: high-commitment version. A real step that takes weekly hours and money. Example: "휴직 후 한 달 항공권 예매".
  - medium: moderate version. Doable in a normal week. Example: "금요일 반차 후 근교 1박 호캉스".
  - low: micro-action doable TODAY in 15 minutes. Example: "오늘 저녁 명상 클래스 한 곳 등록".
- The three tiers must all advance the SAME action title — not three different actions. They are difficulty variants of one move.
- Honesty rule: avoid over-definitive statistics or guarantees ("당신은 반드시 ~할 것입니다"). Phrase outcomes as plausible bets, not certainties.

Schema:
{
  "month": <number>,
  "theme": "string",
  "actions": [
    {
      "week": <number>,
      "title": "string",
      "why": "string (1-2 sentences)",
      "effort": "small" | "medium" | "large",
      "tiers": {
        "high": "string",
        "medium": "string",
        "low": "string"
      }
    }
  ]
}`;

// 환각된 URL을 차단하기 위해 모델은 카탈로그에서 id를 "선택"만 한다.
// URL은 서버가 라이브러리에서 직접 가져온다 — 모델은 url 필드를 만들지 않는다.
const RESOURCES_PROMPT = `You are a career and life coach. Given a user's quiz answers, two personas, and a CATALOG of verified resources, pick the 3-5 MOST relevant items for this specific user.

${COMMON_RULES}

Hard rules for resources:
- You may ONLY return ids that appear in the catalog below — character-for-character.
- Do NOT invent ids, urls, or titles. Do not paraphrase ids.
- Each "why" must be 1-2 sentences specific to THIS user (reference their stuck/desiredChange/feelsAlive, or one of the personas by name). Generic reasons ("good for learning") are rejected.
- Pick a mix across categories when relevant (jobs / courses / books / communities / trends), not 5 books.

Schema:
{
  "picks": [
    { "id": "string — must match a catalog id exactly", "why": "string (1-2 sentences, personalized)" }
  ]
}

CATALOG (id · category · title — description):
${libraryCatalogForPrompt()}`;

const SSE_ENCODER = new TextEncoder();
function sseEncode(obj: unknown): Uint8Array {
  return SSE_ENCODER.encode(`data: ${JSON.stringify(obj)}\n\n`);
}
function ssePing(): Uint8Array {
  return SSE_ENCODER.encode(`: ping ${Date.now()}\n\n`);
}

function stripFences(s: string): string {
  return s.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
}

async function callSection<T>(
  client: Anthropic,
  systemPrompt: string,
  userPayload: unknown,
  maxTokens: number,
  label: string,
): Promise<T> {
  const t0 = Date.now();
  const message = await client.messages.create({
    // Sonnet 4.6 — 출력이 작으니 한 호출당 8~12초로 안정적.
    model: "claude-sonnet-4-6",
    max_tokens: maxTokens,
    system: systemPrompt,
    messages: [{ role: "user", content: JSON.stringify(userPayload) }],
  });
  const block = message.content[0];
  if (block.type !== "text") {
    throw new Error(`[${label}] non-text response`);
  }
  const parsed = JSON.parse(stripFences(block.text)) as T;
  console.log(`[generate-plan] ${label} done in ${Date.now() - t0}ms`);
  return parsed;
}

export async function POST(req: NextRequest) {
  // Body size 가드 (Claude 호출 전, 가장 싼 가드부터).
  const sizeBlock = checkBodySize(req);
  if (sizeBlock && !sizeBlock.ok) {
    return NextResponse.json(
      { error: "payload_too_large" },
      { status: 413 },
    );
  }

  // Rate limit: 가장 비싼 라우트라 가장 엄격.
  const rl = checkRateLimit(req, "generate-plan", RATE_LIMIT, RATE_WINDOW_MS);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "rate_limited", retryAfterSec: rl.retryAfterSec },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } },
    );
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "API key not configured" }, { status: 500 });
  }

  let answers: Answers;
  let personas: Persona[];
  try {
    const body = await req.json();
    if (!body?.answers || typeof body.answers !== "object") {
      return NextResponse.json(
        { error: 'missing or invalid "answers" field' },
        { status: 400 },
      );
    }
    // answers 크기/내용 가드 — Claude 호출 비용을 한 번에 폭증시키지 않도록.
    const answerKeys = Object.keys(body.answers as Record<string, unknown>);
    if (answerKeys.length > MAX_ANSWER_KEYS) {
      return NextResponse.json(
        { error: "too many answer fields" },
        { status: 400 },
      );
    }
    for (const [, v] of Object.entries(body.answers as Record<string, unknown>)) {
      if (typeof v === "string" && v.length > MAX_ANSWER_VALUE_LEN) {
        return NextResponse.json(
          { error: "an answer value is too long" },
          { status: 400 },
        );
      }
    }
    if (!Array.isArray(body.personas) || body.personas.length !== 2) {
      return NextResponse.json(
        { error: '"personas" must be an array of exactly 2' },
        { status: 400 },
      );
    }
    for (const p of body.personas) {
      if (
        !p?.name?.trim() ||
        !p?.coreBelief?.trim() ||
        !p?.keyFear?.trim() ||
        !p?.strongestArgument?.trim() ||
        !p?.communicationStyle?.trim()
      ) {
        return NextResponse.json(
          { error: "each persona must have all 5 non-empty fields" },
          { status: 400 },
        );
      }
      // 각 필드 길이 가드.
      for (const k of ["name", "coreBelief", "keyFear", "strongestArgument", "communicationStyle"] as const) {
        if ((p[k] as string).length > MAX_PERSONA_FIELD_LEN) {
          return NextResponse.json(
            { error: `persona.${k} too long` },
            { status: 400 },
          );
        }
      }
    }
    answers = body.answers as Answers;
    personas = body.personas as Persona[];
  } catch {
    return NextResponse.json({ error: "invalid request body" }, { status: 400 });
  }

  // 429/5xx는 SDK가 지수 백오프로 자동 재시도.
  const client = new Anthropic({ apiKey, maxRetries: 4 });

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const startedAt = Date.now();
      let closed = false;

      try {
        controller.enqueue(ssePing());
      } catch {
        /* ignore */
      }
      const heartbeat = setInterval(() => {
        if (closed) return;
        try {
          controller.enqueue(ssePing());
        } catch {
          /* ignore */
        }
      }, 5000);

      const emit = (obj: unknown) => {
        if (closed) return;
        try {
          controller.enqueue(sseEncode(obj));
        } catch {
          /* ignore — already closed */
        }
      };

      try {
        const baseInput = { answers, personas };

        emit({ type: "progress", section: "framing", phase: "start" });
        emit({ type: "progress", section: "month1", phase: "start" });
        emit({ type: "progress", section: "month2", phase: "start" });
        emit({ type: "progress", section: "month3", phase: "start" });
        emit({ type: "progress", section: "resources", phase: "start" });

        // 5개 호출을 동시에 시작. 각각 끝나는 대로 progress 이벤트 발사.
        const framingP = callSection<{
          headline: string;
          rationale: string;
          coreInsight: string;
          firstStep: string;
        }>(client, FRAMING_PROMPT, baseInput, 800, "framing").then((r) => {
          emit({ type: "progress", section: "framing", phase: "done" });
          return r;
        });

        const monthP = (m: 1 | 2 | 3) =>
          callSection<PlanMonth>(
            client,
            MONTH_PROMPT,
            { ...baseInput, month: m },
            1500,
            `month${m}`,
          ).then((r) => {
            emit({ type: "progress", section: `month${m}`, phase: "done" });
            return { ...r, month: m } as PlanMonth;
          });

        const resourcesP = callSection<{ picks: { id: string; why: string }[] }>(
          client,
          RESOURCES_PROMPT,
          baseInput,
          1200,
          "resources",
        ).then((r) => {
          // id → 검증된 라이브러리 항목으로 매핑. unknown id / 중복 / empty는
          // resolvePicks가 drop. 모델이 만든 url은 응답에 들어가지 않는다.
          const resolved: PlanResource[] = resolvePicks(r?.picks);
          emit({ type: "progress", section: "resources", phase: "done" });
          return { resources: resolved };
        });

        const [framing, m1, m2, m3, resourcesObj] = await Promise.all([
          framingP,
          monthP(1),
          monthP(2),
          monthP(3),
          resourcesP,
        ]);

        const plan: Plan = {
          headline: framing.headline,
          rationale: framing.rationale,
          coreInsight: framing.coreInsight,
          firstStep: framing.firstStep,
          months: [m1, m2, m3].sort(
            (a, b) => a.month - b.month,
          ) as Plan["months"],
          resources: resourcesObj.resources ?? [],
        };

        const elapsed = Date.now() - startedAt;
        console.log(`[generate-plan] all 5 sections done in ${elapsed}ms`);
        emit({ type: "plan", plan });
        emit({ type: "done" });
      } catch (err) {
        const msg = err instanceof Error ? err.message : "stream error";
        console.error("[generate-plan] failed:", msg);
        emit({ type: "error", message: msg });
      } finally {
        closed = true;
        clearInterval(heartbeat);
        try {
          controller.close();
        } catch {
          /* ignore */
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-store, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
