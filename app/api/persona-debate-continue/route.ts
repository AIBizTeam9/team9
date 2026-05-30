import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import type { Persona, Answers } from '@/lib/types';
import { checkBodySize, checkRateLimit } from '@/lib/rate-limit';

// 사용자가 토론에 끼어들 때 호출 — 마지막 N턴만 재생성해서 사용자 발언에
// 실제로 응답하는 짧은 분기를 만든다. 전체 16턴 재생성 회피.

export const maxDuration = 30;

const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 10 * 60 * 1000;
const MAX_PERSONA_FIELD_LEN = 800;
const MAX_CONTEXT_KEYS = 60;
const MAX_CONTEXT_VALUE_LEN = 2000;
const MAX_TURNS_SO_FAR = 30;
const MAX_TURN_CONTENT_LEN = 500;
const MAX_TURN_SPEAKER_LEN = 80;
const MAX_CONTINUE_LENGTH = 8;

const SYSTEM_PROMPT = `You are continuing a debate between two future-self personas of the same user. The user just injected a turn as one of the personas. Generate exactly continueLength more turns that pick up the conversation and respond directly to what the user wrote.

Output ONLY a JSON object with this schema:
{ "turns": [ { "speaker": "<persona name>", "content": "<1-2 short sentences>" }, ... ] }

Hard rules:
- The user just spoke as Persona {userSpokeAs}. The very next turn MUST be from the OTHER persona, directly responding to what the user wrote — paraphrase or quote their phrasing so the response clearly engages with it.
- Generate exactly continueLength turns, strictly alternating speakers, starting with the persona who did NOT speak the last turn.
- Use the EXACT persona names from input (the "name" field). No nicknames, no abbreviations, no whitespace differences.
- Stay in character — draw from each persona's coreBelief, keyFear, strongestArgument and the existing turns.
- Match the language of the existing turns (Korean if Korean, English if English).
- Use casual Korean (반말) if Korean — these are inner voices, not formal third-person analysis.
- Each turn 1-2 short sentences, under ~100 characters total.
- Reference the user's situation (stuck, desiredChange) when natural. Quote the user's own words from the injected turn when possible.
- Do not repeat points already made in turnsSoFar. Push the debate forward.
- No markdown, no preamble, just the JSON.`;

type DebateTurnWire = { speaker: string; content: string };
type DebateResponse = { turns: DebateTurnWire[] };

function isPersona(p: unknown): p is Persona {
  if (!p || typeof p !== 'object') return false;
  const o = p as Record<string, unknown>;
  for (const k of ['name', 'coreBelief', 'keyFear', 'strongestArgument', 'communicationStyle'] as const) {
    const v = o[k];
    if (typeof v !== 'string' || v.trim() === '') return false;
    if (v.length > MAX_PERSONA_FIELD_LEN) return false;
  }
  return true;
}

function isTurnWire(t: unknown): t is DebateTurnWire {
  if (!t || typeof t !== 'object') return false;
  const o = t as Record<string, unknown>;
  return (
    typeof o.speaker === 'string' &&
    typeof o.content === 'string' &&
    o.speaker.length > 0 &&
    o.speaker.length <= MAX_TURN_SPEAKER_LEN &&
    o.content.length <= MAX_TURN_CONTENT_LEN
  );
}

export async function POST(req: NextRequest) {
  const sizeBlock = checkBodySize(req);
  if (sizeBlock && !sizeBlock.ok) {
    return NextResponse.json({ error: 'payload_too_large' }, { status: 413 });
  }

  const rl = checkRateLimit(req, 'persona-debate-continue', RATE_LIMIT, RATE_WINDOW_MS);
  if (!rl.ok) {
    return NextResponse.json(
      { error: 'rate_limited', retryAfterSec: rl.retryAfterSec },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfterSec) } },
    );
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
  }

  let personaA: Persona;
  let personaB: Persona;
  let answers: Partial<Answers>;
  let turnsSoFar: DebateTurnWire[];
  let userSpokeAs: 'A' | 'B';
  let continueLength: number;
  try {
    const body = await req.json();
    if (!isPersona(body?.personaA)) {
      return NextResponse.json({ error: 'invalid personaA' }, { status: 400 });
    }
    if (!isPersona(body?.personaB)) {
      return NextResponse.json({ error: 'invalid personaB' }, { status: 400 });
    }
    if (body.userSpokeAs !== 'A' && body.userSpokeAs !== 'B') {
      return NextResponse.json({ error: 'userSpokeAs must be "A" or "B"' }, { status: 400 });
    }
    if (
      typeof body.continueLength !== 'number' ||
      !Number.isInteger(body.continueLength) ||
      body.continueLength < 1 ||
      body.continueLength > MAX_CONTINUE_LENGTH
    ) {
      return NextResponse.json(
        { error: `continueLength must be an integer in [1, ${MAX_CONTINUE_LENGTH}]` },
        { status: 400 },
      );
    }
    if (
      !Array.isArray(body.turnsSoFar) ||
      body.turnsSoFar.length < 1 ||
      body.turnsSoFar.length > MAX_TURNS_SO_FAR
    ) {
      return NextResponse.json(
        { error: `turnsSoFar must be a non-empty array of at most ${MAX_TURNS_SO_FAR} items` },
        { status: 400 },
      );
    }
    for (const t of body.turnsSoFar as unknown[]) {
      if (!isTurnWire(t)) {
        return NextResponse.json(
          { error: 'turnsSoFar contains an invalid turn' },
          { status: 400 },
        );
      }
    }
    const lastTurn = (body.turnsSoFar as DebateTurnWire[])[body.turnsSoFar.length - 1];
    if (lastTurn.content.trim() === '') {
      return NextResponse.json(
        { error: 'last turn content is empty' },
        { status: 400 },
      );
    }
    if (body.answers && typeof body.answers === 'object') {
      const ctxKeys = Object.keys(body.answers as Record<string, unknown>);
      if (ctxKeys.length > MAX_CONTEXT_KEYS) {
        return NextResponse.json({ error: 'too many answer fields' }, { status: 400 });
      }
      for (const [, v] of Object.entries(body.answers as Record<string, unknown>)) {
        if (typeof v === 'string' && v.length > MAX_CONTEXT_VALUE_LEN) {
          return NextResponse.json({ error: 'an answer value is too long' }, { status: 400 });
        }
      }
    }
    personaA = body.personaA as Persona;
    personaB = body.personaB as Persona;
    userSpokeAs = body.userSpokeAs;
    continueLength = body.continueLength;
    turnsSoFar = body.turnsSoFar as DebateTurnWire[];
    answers = (body.answers ?? {}) as Partial<Answers>;
  } catch {
    return NextResponse.json({ error: 'invalid request body' }, { status: 400 });
  }

  const client = new Anthropic({ apiKey, maxRetries: 4 });

  let raw: string;
  try {
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1500,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: JSON.stringify({
            personaA,
            personaB,
            userSpokeAs,
            continueLength,
            // 기존 /persona-debate와 동일하게 stuck/desiredChange만 모델에 넘김.
            userContext: {
              stuck: answers.stuck,
              desiredChange: answers.desiredChange,
            },
            turnsSoFar,
          }),
        },
      ],
    });
    const block = message.content[0];
    if (block.type !== 'text') {
      return NextResponse.json({ error: 'unexpected response type' }, { status: 502 });
    }
    raw = block.text;
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Anthropic API error';
    console.error('[persona-debate-continue] failed:', msg);
    return NextResponse.json({ error: msg }, { status: 502 });
  }

  const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();

  // Strict 응답 검증: turns 개수 일치 + 첫 발화자는 userSpokeAs의 OPPOSITE +
  // 이후 엄격한 교대. 위반 시 502 (부분/오발 응답을 통과시키지 않는다).
  let parsed: DebateResponse;
  try {
    const obj = JSON.parse(cleaned) as unknown;
    if (
      !obj ||
      typeof obj !== 'object' ||
      !Array.isArray((obj as { turns?: unknown }).turns)
    ) {
      throw new Error('turns missing or not an array');
    }
    const turns = (obj as { turns: unknown[] }).turns;
    if (turns.length !== continueLength) {
      throw new Error(`expected ${continueLength} turns, got ${turns.length}`);
    }
    const otherName = userSpokeAs === 'A' ? personaB.name : personaA.name;
    const sameName = userSpokeAs === 'A' ? personaA.name : personaB.name;
    const expectedAt = (i: number) => (i % 2 === 0 ? otherName : sameName);
    for (let i = 0; i < turns.length; i++) {
      const t = turns[i];
      if (!isTurnWire(t)) {
        throw new Error(`turn ${i} has wrong shape`);
      }
      const expected = expectedAt(i);
      if (t.speaker !== expected) {
        throw new Error(
          `turn ${i} speaker "${t.speaker}" but expected "${expected}"`,
        );
      }
      if (t.content.trim() === '') {
        throw new Error(`turn ${i} content is empty`);
      }
    }
    parsed = { turns: turns as DebateTurnWire[] };
  } catch (err) {
    const msg =
      err instanceof Error ? err.message : 'invalid response from model';
    console.error('[persona-debate-continue] response validation failed:', msg);
    return NextResponse.json({ error: msg }, { status: 502 });
  }

  return NextResponse.json(parsed);
}
