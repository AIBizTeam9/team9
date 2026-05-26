import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import type { Answers, DebateResponse, DebateTurn, Persona } from '@/lib/types';

const SYSTEM_PROMPT = `You are scripting an honest, intimate conversation between two future versions of the same person — Persona A and Persona B — about what the user should actually do next. The user has just picked these two as the futures they want to weigh against each other.

You will be given:
- The user's quiz answers (including any \`<key>_followup\` clarifications).
- Persona A (name, coreBelief, keyFear, strongestArgument, communicationStyle).
- Persona B (same shape).

Write a debate of EXACTLY 14 turns, strictly alternating: A, B, A, B, … Persona A speaks first.

Style:
- Each message is 1-3 sentences. Conversational, not essayistic. Some short ("Supposed to."), some longer.
- Use the user's own phrasing from their free-text answers when it lands naturally — quote them back.
- Each persona must speak in their own communicationStyle. Their coreBelief, keyFear, and strongestArgument should surface across their turns — not all in one.
- They start guarded, push at each other, then admit something honest near the end. The final two turns should converge toward a shared truth that neither said out loud at the start.
- Do NOT have either persona offer a 90-day plan, weeks, or a recommendation. That belongs to the plan step. They are arguing about the user's life, not assigning homework.
- Respond in the language the user used in their free-text quiz answers (English or Korean). Match their register.

Output exactly the following JSON, with NO prose before or after, NO markdown fences.

{
  "turns": [
    { "speaker": "<exact Persona A name>", "message": "..." },
    { "speaker": "<exact Persona B name>", "message": "..." },
    ...
  ]
}

The "speaker" field MUST be one of the two persona names, character-for-character. 14 turns total, strictly alternating.`;

function isValidTurn(t: unknown, nameA: string, nameB: string): t is DebateTurn {
  if (!t || typeof t !== 'object') return false;
  const obj = t as Record<string, unknown>;
  if (typeof obj.speaker !== 'string' || typeof obj.message !== 'string') return false;
  if (obj.message.trim() === '') return false;
  return obj.speaker === nameA || obj.speaker === nameB;
import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import type { Persona, Answers } from "@/lib/types";

// 두 페르소나의 짧은 4턴 토론을 생성. Haiku 4.5로 빠르게 (~2~3초).
// 시연 임팩트용 — 90일 플랜 로딩 중에 사용자가 읽을 수 있게.

export const maxDuration = 30;

const SYSTEM_PROMPT = `You are simulating an urgent, deepening debate between two future-self personas of the same user. They argue over what the user should do next.

Output ONLY a JSON object with this schema:
{ "turns": [ { "speaker": "<persona name>", "content": "<1-2 short sentences>" }, ... ] }

Rules:
- Generate 16 turns, strictly alternating Persona A, Persona B, A, B, ... (use the exact names from input).
- Each turn 1-2 short sentences. Total under ~100 characters per turn.
- The debate should ESCALATE in depth, not flatten:
  - Turns 1-4: opening positions (each persona states why their path matters)
  - Turns 5-8: direct challenges (each names the other's blind spot)
  - Turns 9-12: vulnerabilities (admit the cost of their own path, but defend it)
  - Turns 13-16: the real stakes (what's actually at risk for the user) — leave tension UNRESOLVED
- Stay in character — draw from each persona's coreBelief, keyFear, strongestArgument.
- Use casual Korean (반말) like inner voices of the user, NOT formal third-person analysis.
- Reference the user's situation (stuck, desiredChange) when given. Quote their own words when possible.
- Do not repeat the same point twice. Each turn must add a new angle or push deeper.
- Match the language of the user's free-text answers (Korean if Korean, English if English).
- No markdown, no preamble, just the JSON.`;

type DebateTurn = { speaker: string; content: string };
type DebateResponse = { turns: DebateTurn[] };

function fallbackDebate(personas: Persona[]): DebateResponse {
  const [a, b] = personas;
  // 16턴 폴백 — API 실패해도 길이 유지.
  return {
    turns: [
      { speaker: a.name, content: a.coreBelief },
      { speaker: b.name, content: b.coreBelief },
      { speaker: a.name, content: a.strongestArgument },
      { speaker: b.name, content: b.strongestArgument },
      { speaker: a.name, content: "너 지금 이게 잘못된 걸 알면서도 미루고 있잖아." },
      { speaker: b.name, content: "안전이라는 단어로 두려움을 포장하지 마." },
      { speaker: a.name, content: "준비 안 된 채로 뛰어들면 더 큰 후회만 남아." },
      { speaker: b.name, content: "완벽한 준비는 없어. 시작이 준비를 만들어." },
      { speaker: a.name, content: a.keyFear + " 그게 진짜야." },
      { speaker: b.name, content: b.keyFear + " 그건 더 무서워." },
      { speaker: a.name, content: "오늘 한 발만 천천히, 그게 진짜 용기야." },
      { speaker: b.name, content: "한 발 한 발이 모여서 5년이 되는 거 알지?" },
      { speaker: a.name, content: "그 5년을 누리려고 지금 참는 거야." },
      { speaker: b.name, content: "그 5년 동안 진짜 너는 어디 있어?" },
      { speaker: a.name, content: "내가 진짜 잃을 게 뭔지 봐줘. 그게 사라지면 끝이야." },
      { speaker: b.name, content: "잃을 게 무서워서 한 번도 가져본 적 없는 거 아냐?" },
    ],
  };
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
  }

  let answers: Answers;
  let personas: Persona[];
  try {
    const body = await req.json();
    if (!body?.answers || typeof body.answers !== 'object') {
      return NextResponse.json({ error: 'missing or invalid "answers" field' }, { status: 400 });
    }
    if (!Array.isArray(body.personas) || body.personas.length !== 2) {
      return NextResponse.json({ error: '"personas" must be an array of exactly 2' }, { status: 400 });
    }
    for (const p of body.personas) {
      if (
        !p?.name?.trim() || !p?.coreBelief?.trim() || !p?.keyFear?.trim() ||
        !p?.strongestArgument?.trim() || !p?.communicationStyle?.trim()
      ) {
        return NextResponse.json({ error: 'each persona must have all 5 non-empty fields' }, { status: 400 });
      }
    }
    answers = body.answers as Answers;
    personas = body.personas as Persona[];
  } catch {
    return NextResponse.json({ error: 'invalid request body' }, { status: 400 });
  }

  const client = new Anthropic({ apiKey });
  const [a, b] = personas;

  let raw: string;
  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 3000,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `User's answers (JSON):\n\n${JSON.stringify(answers)}\n\nPersona A:\n${JSON.stringify(a)}\n\nPersona B:\n${JSON.stringify(b)}\n\nReturn the 14-turn debate as JSON only, matching the schema in the system prompt. Persona A speaks first.`,

  let personas: Persona[];
  let userContext: Partial<Answers>;
  try {
    const body = await req.json();
    if (!Array.isArray(body.personas) || body.personas.length !== 2) {
      return NextResponse.json(
        { error: '"personas" must be an array of exactly 2' },
        { status: 400 },
      );
    }
    personas = body.personas as Persona[];
    userContext = (body.userContext ?? {}) as Partial<Answers>;
  } catch {
    return NextResponse.json({ error: "invalid request body" }, { status: 400 });
  }

  // API 키 없으면 페르소나 데이터로 만든 폴백 토론.
  if (!apiKey) {
    return NextResponse.json(fallbackDebate(personas));
  }

  const client = new Anthropic({ apiKey, maxRetries: 4 });

  try {
    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      // 16턴 × ~100자 = ~1600자. 토큰 여유 잡아서 2500.
      max_tokens: 2500,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: JSON.stringify({
            personas,
            userContext: {
              stuck: userContext.stuck,
              desiredChange: userContext.desiredChange,
            },
          }),
        },
      ],
    });

    const block = message.content[0];
    if (block.type !== 'text') {
      return NextResponse.json({ error: 'unexpected response type' }, { status: 500 });
    }
    raw = block.text;
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Anthropic API error';
    return NextResponse.json({ error: msg }, { status: 502 });
  }

  const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();

  let result: DebateResponse;
  try {
    const parsed = JSON.parse(cleaned);
    if (!Array.isArray(parsed?.turns) || parsed.turns.length < 2) {
      throw new Error('turns must be a non-empty array');
    }
    for (const t of parsed.turns) {
      if (!isValidTurn(t, a.name, b.name)) {
        throw new Error('one or more turns are malformed or reference an unknown speaker');
      }
    }
    result = parsed as DebateResponse;
  } catch {
    return NextResponse.json({ error: 'invalid response from model' }, { status: 500 });
  }

  return NextResponse.json(result);
    if (block.type !== "text") {
      return NextResponse.json(fallbackDebate(personas));
    }
    const cleaned = block.text
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```\s*$/, "")
      .trim();
    const parsed = JSON.parse(cleaned) as DebateResponse;
    if (!Array.isArray(parsed.turns) || parsed.turns.length === 0) {
      return NextResponse.json(fallbackDebate(personas));
    }
    return NextResponse.json(parsed);
  } catch (err) {
    console.error(
      "[persona-debate] failed:",
      err instanceof Error ? err.message : err,
    );
    // 실패해도 플랜 흐름은 깨지 않게 폴백
    return NextResponse.json(fallbackDebate(personas));
  }
}
