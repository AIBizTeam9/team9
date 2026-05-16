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
