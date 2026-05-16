import Anthropic from '@anthropic-ai/sdk';
import { readFileSync } from 'fs';
import { resolve } from 'path';

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

type ClarifyCase = {
  label: string;
  expected: 'trigger' | 'no-trigger';
  questionKey: string;
  questionText: string;
  userAnswer: string;
};

const CASES: ClarifyCase[] = [
  {
    label: 'Case 1',
    expected: 'no-trigger',
    questionKey: 'stuck',
    questionText: "What's the one thing in your life that feels stuck right now?",
    userAnswer:
      "I've been burnt out for almost a year. I keep thinking about quitting but I also just got fast-tracked for a director promotion.",
  },
  {
    label: 'Case 2',
    expected: 'trigger',
    questionKey: 'stuck',
    questionText: "What's the one thing in your life that feels stuck right now?",
    userAnswer: 'burnt out',
  },
  {
    label: 'Case 3',
    expected: 'no-trigger',
    questionKey: 'strengths',
    questionText: 'What are you genuinely good at?',
    userAnswer: 'Writing, strategy, making teams feel calm, seeing the story in data',
  },
  {
    label: 'Case 4',
    expected: 'trigger',
    questionKey: 'desiredChange',
    questionText: 'If you could change one specific thing in the next 90 days, what would it be?',
    userAnswer: 'happier',
  },
];

async function main() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('ANTHROPIC_API_KEY not found in environment.');
    process.exit(1);
  }

  const client = new Anthropic({ apiKey });

  for (const c of CASES) {
    console.log(`\n${'─'.repeat(60)}`);
    console.log(`${c.label} — expected: ${c.expected}`);
    console.log(`question: "${c.questionText}"`);
    console.log(`answer:   "${c.userAnswer}"`);

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 500,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: JSON.stringify({
            questionKey: c.questionKey,
            questionText: c.questionText,
            userAnswer: c.userAnswer,
          }),
        },
      ],
    });

    const block = message.content[0];
    if (block.type !== 'text') {
      console.error('Unexpected response type:', block.type);
      continue;
    }

    const cleaned = block.text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();

    try {
      const result = JSON.parse(cleaned);
      const matched = result.needsFollowUp === (c.expected === 'trigger');
      console.log(`result:   ${matched ? '✓' : '✗ MISMATCH'}`);
      console.log(JSON.stringify(result, null, 2));
    } catch {
      console.error('Failed to parse JSON. Raw response:\n', block.text);
    }
  }

  console.log(`\n${'─'.repeat(60)}`);
  console.log('Done.');
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
