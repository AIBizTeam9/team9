import Anthropic from '@anthropic-ai/sdk';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import type { PersonasResponse } from '../lib/types';

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
  struggles: "Saying no, perfectionism, losing myself in other people's priorities",
  childhoodDream: 'Photographer',
  feelsAlive: 'Early mornings with coffee and a notebook. My film camera.',
  feelsAlive_followup: "Specifically when no one else is awake yet — the silence is part of it. The film camera matters because it has no notifications.",
  mbti: 'INFJ',
  boldness: '3 — Balanced',
};

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
    max_tokens: 3000,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `Here are the user's answers (JSON):\n\n${JSON.stringify(SARAH_KIM, null, 2)}\n\nGenerate exactly 4 personas as JSON.`,
      },
    ],
  });

  const block = message.content[0];
  if (block.type !== 'text') {
    console.error('Unexpected response type:', block.type);
    process.exit(1);
  }

  const cleaned = block.text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();

  let result: PersonasResponse;
  try {
    result = JSON.parse(cleaned) as PersonasResponse;
  } catch {
    console.error('Failed to parse JSON. Raw response:\n', block.text);
    process.exit(1);
  }

  if (!Array.isArray(result.personas) || result.personas.length !== 4) {
    console.error(`Expected 4 personas, got ${result.personas?.length ?? 0}`);
    process.exit(1);
  }

  console.log(`✓ JSON parsed — ${result.personas.length} personas\n`);

  for (let i = 0; i < result.personas.length; i++) {
    const p = result.personas[i];
    console.log(`${'─'.repeat(60)}`);
    console.log(`Persona ${i + 1}: ${p.name}`);
    console.log(`  coreBelief:         ${p.coreBelief}`);
    console.log(`  keyFear:            ${p.keyFear}`);
    console.log(`  strongestArgument:  ${p.strongestArgument}`);
    console.log(`  communicationStyle: ${p.communicationStyle}`);
  }

  console.log(`\n${'─'.repeat(60)}`);
  console.log('✓ All 4 personas look good.');
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
