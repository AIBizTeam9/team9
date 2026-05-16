import Anthropic from '@anthropic-ai/sdk';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import type { Plan, Persona } from '../lib/types';

// Load .env.local manually (tsx doesn't auto-load it)
const envPath = resolve(process.cwd(), '.env.local');
try {
  const lines = readFileSync(envPath, 'utf-8').split('\n');
  for (const line of lines) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) process.env[match[1].trim()] = match[2].trim();
  }
} catch {
  console.error('Could not read .env.local — make sure it exists at project root.');
  process.exit(1);
}

const SARAH_KIM = {
  age: 28,
  occupation: 'Marketing manager at a B2B SaaS',
  lifeSituation: 'Single',
  income: '$60k–100k / ₩80–130M',
  savings: '6–12 months',
  hoursPerWeek: '5–10',
  stuck: "I've been burnt out for almost a year. I keep thinking about quitting but I also just got fast-tracked for a director promotion. I don't know if I want it or just don't want to disappoint anyone.",
  desiredChange: "Get my film camera back into regular rotation; figure out if I want this director role or just don't want to disappoint anyone",
  tried: 'Therapy, weekend trips, gym',
  strengths: 'Writing, strategy, making teams feel calm, seeing the story in data',
  struggles: 'Saying no, perfectionism, losing myself in other people\'s priorities',
  childhoodDream: 'Photographer',
  feelsAlive: 'Early mornings with coffee and a notebook. My film camera.',
  feelsAlive_followup: "Specifically when no one else is awake yet — the silence is part of it. The film camera matters because it has no notifications.",
  mbti: 'INFJ',
  boldness: '3 — Balanced',
};

const TEST_PERSONAS: Persona[] = [
  {
    name: 'The Director',
    coreBelief: "The promotion is proof you've earned this. Burnout is about pace, not role — once you're in the seat with real authority, the chaos resolves.",
    keyFear: "Walking away from a year of credibility right when it's about to compound, and finding out the photography urge was just rest disguised as a calling.",
    strongestArgument: "You're not burnt out on leadership. You're burnt out on being a manager without director authority. The promotion is the cure.",
    communicationStyle: 'direct, ambitious, slightly impatient',
  },
  {
    name: 'The Photographer',
    coreBelief: "The film camera in your drawer is the only thing in your life that has no notifications. That's data. Your real work is the thing you keep abandoning for other people's deadlines.",
    keyFear: "Saying yes to the director role and looking up in three years to find another camera, another notebook, another version of yourself you left on the shelf.",
    strongestArgument: "You don't have to quit. You have to test. Two months of treating photography like a real practice, not a hobby, and you'll know.",
    communicationStyle: 'warm, philosophical, slow',
  },
];

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

async function main() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('ANTHROPIC_API_KEY not found in environment.');
    process.exit(1);
  }

  console.log('Calling claude-sonnet-4-6 with Sarah Kim test data…\n');

  const client = new Anthropic({ apiKey });
  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `Here are the user's answers (JSON):\n\n${JSON.stringify(SARAH_KIM)}\n\nHere are the two personas the user chose:\n\n${JSON.stringify(TEST_PERSONAS)}\n\nReturn the 90-day plan as JSON only, matching the schema in the system prompt.`,
      },
    ],
  });

  const block = message.content[0];
  if (block.type !== 'text') {
    console.error('Unexpected response type:', block.type);
    process.exit(1);
  }

  const cleaned = block.text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();

  let plan: Plan;
  try {
    plan = JSON.parse(cleaned) as Plan;
  } catch {
    console.error('Failed to parse JSON. Raw response:\n', block.text);
    process.exit(1);
  }

  console.log('✓ JSON parsed successfully\n');
  console.log('headline:    ', plan.headline);
  console.log('rationale:   ', plan.rationale);
  console.log('coreInsight: ', plan.coreInsight);
  console.log('firstStep:   ', plan.firstStep);
  console.log('\nmonths:');
  for (const m of plan.months) {
    console.log(`  Month ${m.month} — ${m.theme} (${m.actions.length} actions)`);
    for (const a of m.actions) {
      console.log(`    Week ${a.week} [${a.effort}]: ${a.title}`);
    }
  }
  console.log('\nresources:');
  for (const r of plan.resources) {
    console.log(`  ${r.title} — ${r.url}`);
  }
  console.log('\n✓ Full plan shape looks good.');
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
