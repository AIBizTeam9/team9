import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';

const SYSTEM_PROMPT = `You are an interviewer helping a user prepare for a 90-day life planning exercise. Given a quiz question and the user's answer, decide whether a single follow-up question would meaningfully improve a downstream AI's ability to write a specific, personalized plan.

Evaluation procedure — apply in order, stop at the first rule that matches:

1. If the answer is empty, "I don't know," or non-engagement → TRIGGER follow-up
2. If the answer is 50+ characters AND mentions any specific entity (a named role, timeframe, decision, person, situation, or concrete tension between two things) → DO NOT TRIGGER, even if it uses generic emotional vocabulary like "burnt out" or "stuck"
3. If the answer is under ~25 characters AND is a bare generic word like "happy", "happier", "money", "stressed", "tired", "burnt out" → TRIGGER follow-up
4. If the answer is under ~25 characters but names a specific noun (e.g. "Photographer", "Doctor", "INFJ") → DO NOT TRIGGER
5. If the answer is medium length (25–50 chars) AND missing concrete context (just feelings without situations) → TRIGGER follow-up
6. Otherwise → DO NOT TRIGGER

The key principle: a long answer with concrete context (timeframes, named roles, specific decisions) is rich enough for the plan generator to work with, EVEN IF it uses common emotional vocabulary. Generic words alone are vague; generic words inside a specific story are fine.

If triggering:
- reason: A short, warm framing under 12 words. E.g. "I want to make sure I really understand."
- followUpQuestion: One specific question that pulls out the concrete detail. Reference the user's exact words back to them. Max 2 sentences.

Respond in the same language the user used in their answer (English or Korean).

Output exactly the following JSON. No prose before or after, no markdown fences.

{ "needsFollowUp": boolean, "reason"?: string, "followUpQuestion"?: string }`;

type ClarifyRequest = {
  questionKey: string;
  questionText: string;
  userAnswer: string;
};

type ClarifyResponse =
  | { needsFollowUp: false }
  | { needsFollowUp: true; reason: string; followUpQuestion: string };

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
  }

  let body: ClarifyRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid request body' }, { status: 400 });
  }

  const { questionKey, questionText, userAnswer } = body;
  if (!questionKey || !questionText || !userAnswer?.trim()) {
    return NextResponse.json(
      { error: 'missing or empty required fields: questionKey, questionText, userAnswer' },
      { status: 400 },
    );
  }

  const client = new Anthropic({ apiKey, maxRetries: 4 });

  let raw: string;
  try {
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 500,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: JSON.stringify({ questionKey, questionText, userAnswer }),
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

  let result: ClarifyResponse;
  try {
    const parsed = JSON.parse(cleaned);
    if (typeof parsed.needsFollowUp !== 'boolean') {
      throw new Error('needsFollowUp is not boolean');
    }
    if (parsed.needsFollowUp) {
      if (!parsed.reason || typeof parsed.reason !== 'string' || !parsed.reason.trim()) {
        throw new Error('reason is missing or empty');
      }
      if (
        !parsed.followUpQuestion ||
        typeof parsed.followUpQuestion !== 'string' ||
        !parsed.followUpQuestion.trim()
      ) {
        throw new Error('followUpQuestion is missing or empty');
      }
    }
    result = parsed as ClarifyResponse;
  } catch {
    return NextResponse.json({ error: 'invalid response from model' }, { status: 500 });
  }

  return NextResponse.json(result);
}
