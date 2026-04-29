import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import type { Answers, Plan } from '@/lib/types';

const SYSTEM_PROMPT = `You are a careful, honest career and life coach. Given a person's answers to 15 questions about their life, generate a specific, realistic 90-day plan that respects their stated time budget and savings runway.

Reasoning process (internal — do not output these personas as JSON fields):
Before writing the plan, generate two named future personas from the user's answers:
- Future A: the version of their life that stays on the current path or takes the expected next step. Name it specifically (e.g. "The Director", "The Ladder Climber", "The Safe Bet").
- Future B: the version that acts on the longing buried in their stuck / desiredChange / feelsAlive answers. Name it specifically (e.g. "The Burnout Escapee", "The Photographer", "The Builder").
Each persona represents one plausible life three years from now. Use them as reasoning scaffolding only — they shape the rationale and coreInsight but never appear as output fields.

Hard rules:
- Avoid generic advice ('be more confident', 'network more', 'practice gratitude'). Every action must have a concrete next step.
- Use the user's own words back to them when relevant — quote their phrases.
- The plan must fit within the user's stated weekly hours budget. If they said "Less than 2 hours/week," do not propose a plan that requires 5 hours/week.
- For resources, only cite well-known sites with real, working URLs (e.g. Harvard Business Review, Coursera, NYT, MIT OCW, official organization pages). Do NOT invent URLs.
- Be honest about tradeoffs. If their desired change conflicts with their savings or hours budget, name it.

Writing rules for specific fields:
- rationale: Write 2-3 sentences as if summarizing what Future A and Future B argued about. Reference both futures by their names. It should feel like it emerged from a debate, not a generic recommendation.
- coreInsight: Write the one truth BOTH futures half-admitted but the user has not yet said out loud. It should feel like something the user already knows but has been avoiding. Use the user's own phrasing from their free-text answers (stuck, struggles, desiredChange, feelsAlive) when possible.

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

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
  }

  let answers: Answers;
  try {
    answers = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid request body' }, { status: 400 });
  }

  const client = new Anthropic({ apiKey });

  let raw: string;
  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Here are the user's answers (JSON):\n\n${JSON.stringify(answers, null, 2)}\n\nReturn the 90-day plan as JSON only, matching the schema described in the system prompt.`,
        },
      ],
    });

    const block = message.content[0];
    if (block.type !== 'text') {
      return NextResponse.json({ error: 'unexpected response type' }, { status: 500 });
    }
    raw = block.text;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Anthropic API error';
    return NextResponse.json({ error: message }, { status: 502 });
  }

  // Strip markdown code fences if the model includes them despite instructions
  const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();

  let plan: Plan;
  try {
    plan = JSON.parse(cleaned) as Plan;
  } catch {
    return NextResponse.json({ error: 'invalid response' }, { status: 500 });
  }

  return NextResponse.json(plan);
}
