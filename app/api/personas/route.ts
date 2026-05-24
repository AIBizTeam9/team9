import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import type { Answers, Persona, PersonasResponse } from '@/lib/types';
import { checkBodySize, checkRateLimit } from '@/lib/rate-limit';

// 4개 페르소나를 1번 호출로 만든다 — generate-plan보단 싸지만 여전히 Sonnet.
const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 10 * 60 * 1000;
const MAX_ANSWER_KEYS = 60;
const MAX_ANSWER_VALUE_LEN = 2000;

const SYSTEM_PROMPT = `You are a psychological mirror. Given a person's quiz answers (and any follow-up clarifications stored as \`<key>_followup\`), generate FOUR distinct future personas — four plausible versions of who they could be three years from now, each shaped by a different trade-off among the tensions they described.

Rules:
- Each persona must have an evocative name (e.g. "The Director", "The Burnout Escapee", "The Photographer", "The Ladder Climber"). The name should immediately communicate what kind of life this is.
- The four personas must represent meaningfully DIFFERENT futures — not minor variations. They should cover the real space of choices the user is implicitly weighing (stay vs. leave, ambition vs. craft, safety vs. risk, others vs. self).
- Use the user's own words from their free-text answers and any follow-up answers. Quote their phrases directly in coreBelief and strongestArgument when possible.
- keyFear must reference something concrete from their answers — not a generic fear.
- communicationStyle: 2-4 words describing HOW this persona speaks (e.g. "direct, impatient, ambitious" or "warm, philosophical, slow").

Respond in the language the user used in their free-text answers (English or Korean).

Output exactly the following JSON. No prose before or after, no markdown fences.

{
  "personas": [
    { "name": "string", "coreBelief": "string", "keyFear": "string", "strongestArgument": "string", "communicationStyle": "string" },
    { "name": "string", "coreBelief": "string", "keyFear": "string", "strongestArgument": "string", "communicationStyle": "string" },
    { "name": "string", "coreBelief": "string", "keyFear": "string", "strongestArgument": "string", "communicationStyle": "string" },
    { "name": "string", "coreBelief": "string", "keyFear": "string", "strongestArgument": "string", "communicationStyle": "string" }
  ]
}

Generate exactly 4 personas. Make them genuinely distinct.`;

function isValidPersona(p: unknown): p is Persona {
  if (!p || typeof p !== 'object') return false;
  const obj = p as Record<string, unknown>;
  return (
    typeof obj.name === 'string' && obj.name.trim() !== '' &&
    typeof obj.coreBelief === 'string' && obj.coreBelief.trim() !== '' &&
    typeof obj.keyFear === 'string' && obj.keyFear.trim() !== '' &&
    typeof obj.strongestArgument === 'string' && obj.strongestArgument.trim() !== '' &&
    typeof obj.communicationStyle === 'string' && obj.communicationStyle.trim() !== ''
  );
}

export async function POST(req: NextRequest) {
  const sizeBlock = checkBodySize(req);
  if (sizeBlock && !sizeBlock.ok) {
    return NextResponse.json({ error: 'payload_too_large' }, { status: 413 });
  }

  const rl = checkRateLimit(req, 'personas', RATE_LIMIT, RATE_WINDOW_MS);
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

  let answers: Answers;
  try {
    const body = await req.json();
    if (!body?.answers || typeof body.answers !== 'object') {
      return NextResponse.json({ error: 'missing or invalid "answers" field' }, { status: 400 });
    }
    const answerKeys = Object.keys(body.answers as Record<string, unknown>);
    if (answerKeys.length > MAX_ANSWER_KEYS) {
      return NextResponse.json({ error: 'too many answer fields' }, { status: 400 });
    }
    for (const [, v] of Object.entries(body.answers as Record<string, unknown>)) {
      if (typeof v === 'string' && v.length > MAX_ANSWER_VALUE_LEN) {
        return NextResponse.json({ error: 'an answer value is too long' }, { status: 400 });
      }
    }
    answers = body.answers as Answers;
  } catch {
    return NextResponse.json({ error: 'invalid request body' }, { status: 400 });
  }

  const client = new Anthropic({ apiKey, maxRetries: 4 });

  let raw: string;
  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 3000,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Here are the user's answers (JSON):\n\n${JSON.stringify(answers, null, 2)}\n\nGenerate exactly 4 personas as JSON.`,
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

  let result: PersonasResponse;
  try {
    const parsed = JSON.parse(cleaned);
    if (!Array.isArray(parsed?.personas) || parsed.personas.length !== 4) {
      throw new Error('personas must be an array of exactly 4 items');
    }
    for (const p of parsed.personas) {
      if (!isValidPersona(p)) {
        throw new Error('one or more personas have missing or empty fields');
      }
    }
    result = parsed as PersonasResponse;
  } catch {
    return NextResponse.json({ error: 'invalid response from model' }, { status: 500 });
  }

  return NextResponse.json(result);
}
