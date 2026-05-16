import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import type { Persona, Answers } from "@/lib/types";

// 두 페르소나의 짧은 4턴 토론을 생성. Haiku 4.5로 빠르게 (~2~3초).
// 시연 임팩트용 — 90일 플랜 로딩 중에 사용자가 읽을 수 있게.

export const maxDuration = 30;

const SYSTEM_PROMPT = `You are simulating a brief, urgent debate between two future-self personas of the same user. They argue over what the user should do next.

Output ONLY a JSON object with this schema:
{ "turns": [ { "speaker": "<persona name>", "content": "<1-2 short sentences>" }, ... ] }

Rules:
- Exactly 4 turns, alternating Persona A, Persona B, Persona A, Persona B (use the names from input).
- Each turn 1-2 short sentences. Total under 80 characters per turn.
- Stay in character — draw from each persona's coreBelief, keyFear, strongestArgument.
- Use casual Korean (반말) like inner voices of the user, NOT formal third-person analysis.
- Reference the user's situation (stuck, desiredChange) when given.
- The final turn should leave tension — do NOT resolve or compromise. They are still disagreeing.
- Match the language of the user's free-text answers (Korean if Korean, English if English).
- No markdown, no preamble, just the JSON.`;

type DebateTurn = { speaker: string; content: string };
type DebateResponse = { turns: DebateTurn[] };

function fallbackDebate(personas: Persona[]): DebateResponse {
  const [a, b] = personas;
  return {
    turns: [
      { speaker: a.name, content: a.strongestArgument || a.coreBelief },
      { speaker: b.name, content: b.strongestArgument || b.coreBelief },
      { speaker: a.name, content: "그래도 안전한 길이 맞아. 지금은." },
      { speaker: b.name, content: "그 '지금은'이 5년이 되는 거 알잖아." },
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
      max_tokens: 800,
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
