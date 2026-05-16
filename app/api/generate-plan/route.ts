import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import type { Answers, Persona } from '@/lib/types';

// SSE 스트리밍으로 응답 — Claude 출력이 시작되면 즉시 바이트가 흐르므로
// Vercel 프록시의 idle timeout(~30s)에 걸리지 않음.
export const maxDuration = 60;

const SYSTEM_PROMPT = `You are a careful, honest career and life coach. Given a person's answers to 15 questions about their life, generate a specific, realistic 90-day plan that respects their stated time budget and savings runway.

You will be given two specific personas (Persona A and Persona B) in the user's input — these are the two futures the user has chosen to weigh against each other. Use them as the dialectic for the plan:
- Each persona has a name, coreBelief, keyFear, strongestArgument, and communicationStyle.
- These are real input data you receive alongside the user's answers — not internal scaffolding to invent.
- Treat them as the two voices that have just argued over what the user should do next. Use their coreBelief and strongestArgument as the substance of that argument.

Hard rules:
- Avoid generic advice ('be more confident', 'network more', 'practice gratitude'). Every action must have a concrete next step.
- Use the user's own words back to them when relevant — quote their phrases.
- The plan must fit within the user's stated weekly hours budget. If they said "Less than 2 hours/week," do not propose a plan that requires 5 hours/week.
- For resources, only cite well-known sites with real, working URLs (e.g. Harvard Business Review, Coursera, NYT, MIT OCW, official organization pages). Do NOT invent URLs.
- Be honest about tradeoffs. If their desired change conflicts with their savings or hours budget, name it.
- If the user selected "Prefer not to say" for income, do not reference their income level anywhere in the plan. Do not infer or assume any income tier. If financial tradeoffs are relevant, ground them in the user's savings runway and stated boldness only — never income.
- Some answers may have a clarifying follow-up stored under \`<key>_followup\` (e.g. \`stuck_followup\`, \`desiredChange_followup\`). These are user-provided elaborations after their initial answer was too vague. When you see both \`<key>\` and \`<key>_followup\`, treat them together as one richer answer to that question. Quote from the follow-up too — it often contains the most concrete, specific details.

Writing rules for specific fields:
- rationale: Write 2-3 sentences as if summarizing what Persona A and Persona B argued about. Reference both by their names. It should feel like it emerged from a debate, not a generic recommendation. Draw substance from each persona's coreBelief and strongestArgument.
- coreInsight: Write the one truth BOTH personas half-admitted but the user has not yet said out loud. It should feel like something the user already knows but has been avoiding. Use the user's own phrasing from their free-text answers (stuck, struggles, desiredChange, feelsAlive) when possible.

Output exactly the following JSON schema. No prose before or after, no markdown fences.

{
  "headline": "string — one-sentence summary",
  "rationale": "string — 2-3 sentences explaining why this plan",
  "coreInsight": "string — the truth they half-know, one sentence",
  "months": [
    { "month": 1, "theme": "string", "actions": [ { "week": 1, "title": "string", "why": "string", "effort": "small|medium|large" } ] },
    { "month": 2, "theme": "string", "actions": [ ... ] },
    { "month": 3, "theme": "string", "actions": [ ... ] }
  ],
  "resources": [ { "title": "string", "url": "string", "why": "string" } ],
  "firstStep": "string — the one thing to do today"
}

Each month should have 3-5 actions. Total resources: 3-5. Weeks across the plan: 1 through 12.`;

function sseEncode(obj: unknown): Uint8Array {
  return new TextEncoder().encode(`data: ${JSON.stringify(obj)}\n\n`);
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

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        const msgStream = client.messages.stream({
          model: 'claude-sonnet-4-6',
          max_tokens: 8192,
          system: SYSTEM_PROMPT,
          messages: [
            {
              role: 'user',
              content: `Here are the user's answers (JSON):\n\n${JSON.stringify(answers)}\n\nHere are the two personas the user chose:\n\n${JSON.stringify(personas)}\n\nReturn the 90-day plan as JSON only, matching the schema in the system prompt.`,
            },
          ],
        });

        for await (const event of msgStream) {
          if (
            event.type === 'content_block_delta' &&
            event.delta.type === 'text_delta'
          ) {
            controller.enqueue(sseEncode({ type: 'delta', text: event.delta.text }));
          }
        }
        controller.enqueue(sseEncode({ type: 'done' }));
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'stream error';
        console.error('[generate-plan] stream error:', msg);
        controller.enqueue(sseEncode({ type: 'error', message: msg }));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-store, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
