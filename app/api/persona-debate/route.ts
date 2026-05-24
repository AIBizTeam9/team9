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
}
