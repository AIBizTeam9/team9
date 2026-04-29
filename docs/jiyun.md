# docs/jiyun.md — Next Step in Life: 90-day Plan

> Spec for Jiyun's feature. Branch: `jiyun`. Stack: Next.js 16 (App Router) + Tailwind 4 + Anthropic SDK.

## Goal

Build the end-to-end **"Next Step in Life: 90-day plan"** menu. User answers 15 questions about their life → Claude generates a structured, actionable 90-day plan → renders beautifully. No database yet — pass state via sessionStorage.

## Routes

| Path | What it does |
| --- | --- |
| `app/next-step/page.tsx` | Landing for this menu — short intro + "Start" CTA |
| `app/next-step/quiz/page.tsx` | 15-question form, one question per screen, progress bar, sessionStorage on submit |
| `app/next-step/loading/page.tsx` | Calls `/api/generate-plan`, stores response, redirects to `/next-step/plan` |
| `app/next-step/plan/page.tsx` | Renders plan from sessionStorage |
| `app/api/generate-plan/route.ts` | `POST` endpoint: receives answers JSON, returns plan JSON |

## State management

- `sessionStorage['nextStep.answers']` — JSON-stringified answers, written by quiz, read by loading
- `sessionStorage['nextStep.plan']` — JSON-stringified plan, written by loading, read by plan page
- No DB. Simple.

## The 15 questions (use this exact array)

Save as `lib/questions.ts`:

```ts
export type Question = {
  k: string;
  type: 'number' | 'text' | 'textarea' | 'choice';
  t: string;            // question text
  h?: string;           // optional helper text below the question
  ph?: string;          // optional placeholder for input
  o?: string[];         // options for type='choice'
};

export const QUESTIONS: Question[] = [
  { k: 'age', type: 'number', t: 'How old are you?', h: 'Just the number — we use it to scale your plan timeline.', ph: 'e.g. 28' },
  { k: 'occupation', type: 'text', t: 'What do you do for work or school right now?', ph: "Marketing manager / Master's student" },
  { k: 'lifeSituation', type: 'choice', t: "What's your life situation?", o: ['Single', 'Dating, not serious', 'In a serious relationship', 'Married', 'Prefer not to say'] },
  { k: 'income', type: 'choice', t: 'Roughly, what do you earn a year?', o: ['Less than $30k / ₩40M', '$30k–60k / ₩40–80M', '$60k–100k / ₩80–130M', '$100k–150k / ₩130–200M', 'More than $150k / ₩200M+', 'No income right now'] },
  { k: 'savings', type: 'choice', t: 'How much have you saved?', h: 'Months of expenses (excluding retirement accounts).', o: ['Less than 3 months', '3–6 months', '6–12 months', '1–2 years', 'More than 2 years'] },
  { k: 'hoursPerWeek', type: 'choice', t: 'How many hours per week could you realistically spend on changing something?', h: 'Be honest — your plan is built around this.', o: ['Less than 2', '2–5', '5–10', '10–20', '20+'] },
  { k: 'stuck', type: 'textarea', t: "What's the one thing in your life that feels stuck right now?", h: 'Be specific. The plan is built from this.', ph: "I've been burnt out for a year but I'm scared of stepping off the ladder…" },
  { k: 'desiredChange', type: 'textarea', t: 'If you could change one specific thing in the next 90 days, what would it be?', ph: 'Get my film camera back into my hands every week' },
  { k: 'tried', type: 'textarea', t: "What have you already tried that didn't work?", h: "So we don't suggest things you've already done.", ph: 'I tried therapy, journaling, gym memberships…' },
  { k: 'strengths', type: 'textarea', t: 'What are you genuinely good at?', ph: 'Writing, seeing patterns, making teams feel calm' },
  { k: 'struggles', type: 'textarea', t: 'What do you struggle with?', ph: 'Saying no, sitting still, asking for help' },
  { k: 'childhoodDream', type: 'text', t: 'What did you want to be as a kid?', ph: 'Photographer / writer / astronaut' },
  { k: 'feelsAlive', type: 'textarea', t: 'What is a small thing that consistently makes you feel alive?', ph: 'Early mornings with coffee and a notebook' },
  { k: 'mbti', type: 'text', t: "What's your MBTI? (4 letters — guess if unsure)", ph: 'INFJ' },
  { k: 'boldness', type: 'choice', t: 'How bold do you want this plan to be?', h: '1 = small incremental changes; 5 = leap', o: ['1 — Incremental', '2 — Modest', '3 — Balanced', '4 — Bold', '5 — Leap'] }
];
```

## Plan output JSON shape

Save as `lib/types.ts`:

```ts
export type Answers = Record<string, string | number>;

export type PlanAction = {
  week: number;          // 1–12
  title: string;
  why: string;
  effort: 'small' | 'medium' | 'large';
};

export type PlanMonth = {
  month: 1 | 2 | 3;
  theme: string;         // e.g. "Reset", "Explore", "Commit"
  actions: PlanAction[];
};

export type PlanResource = {
  title: string;
  url: string;           // real, working URLs only — well-known sites
  why: string;
};

export type Plan = {
  headline: string;       // one-sentence summary of the recommendation
  rationale: string;      // 2–3 sentence "why this plan, given your answers"
  coreInsight: string;    // the truth-they-half-knew, one sentence
  months: PlanMonth[];    // exactly 3
  resources: PlanResource[];   // 3–5
  firstStep: string;      // the single thing to do TODAY
};
```

## API route

`app/api/generate-plan/route.ts`:

- Read `ANTHROPIC_API_KEY` from `process.env`
- Use `@anthropic-ai/sdk` (already installed)
- Model: `claude-sonnet-4-6`
- `max_tokens`: 4096
- System prompt (see below)
- User prompt: "Here are the user's answers (JSON):\n\n{answers JSON}\n\nReturn the 90-day plan as JSON only, matching the schema described in the system prompt."
- Parse response text as JSON. On parse failure: return `{ error: 'invalid response' }`, status 500.

### System prompt (use this verbatim)

```
You are a careful, honest career and life coach. Given a person's answers to 15 questions about their life, generate a specific, realistic 90-day plan that respects their stated time budget and savings runway.

Hard rules:
- Avoid generic advice ('be more confident', 'network more', 'practice gratitude'). Every action must have a concrete next step.
- Use the user's own words back to them when relevant — quote their phrases.
- The plan must fit within the user's stated weekly hours budget. If they said "Less than 2 hours/week," do not propose a plan that requires 5 hours/week.
- For resources, only cite well-known sites with real, working URLs (e.g. Harvard Business Review, Coursera, NYT, MIT OCW, official organization pages). Do NOT invent URLs.
- Be honest about tradeoffs. If their desired change conflicts with their savings or hours budget, name it.

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

Each month should have 3-5 actions. Total resources: 3-5. Weeks across the plan: 1 through 12.
```

## Design language

Match the existing demo aesthetic (warm minimal):

- **Fonts:** Instrument Serif (headings) + Inter (body), via Google Fonts in `app/layout.tsx`
- **Colors:** background `#FAFAF7`, ink `#1A1A1A`, secondary ink `#666`, accent coral `#E07856`, hairline border `#E5E2DC`
- **Style:** Linear/Notion minimal. Lots of whitespace. Subtle borders. Smooth transitions (200ms). No drop shadows.
- **Typography:** large serif H1s (60–80px), comfortable line-height (1.6 body)
- **Quiz:** one question at a time, full-screen feel. Progress bar at top. Back/Next buttons.
- **Plan:** sectioned vertical layout — headline → core insight card → 3 month sections (each with theme + week actions) → resources → "first step today" callout

## Build order (do in this order, one at a time)

1. **Verify env:** `.env.local` has `ANTHROPIC_API_KEY`, `@anthropic-ai/sdk` is in `package.json`
2. Create `lib/questions.ts` and `lib/types.ts`
3. Build `app/api/generate-plan/route.ts` — wire to Anthropic SDK with the system prompt above
4. **Test the API in isolation** before any UI: write a quick test script `scripts/test-plan.ts` that calls the route with the Sarah Kim test answers below and prints the response. Verify the plan JSON parses and looks reasonable.
5. Build `app/next-step/page.tsx` (landing)
6. Build `app/next-step/quiz/page.tsx` (15-question form)
7. Build `app/next-step/loading/page.tsx` (calls API, redirects)
8. Build `app/next-step/plan/page.tsx` (renders plan)
9. Test end-to-end in dev server (`npm run dev`)
10. Commit and push to `jiyun` branch

## Test data — Sarah Kim

Use this for testing the API route before any UI exists:

```json
{
  "age": 28,
  "occupation": "Marketing manager at a B2B SaaS",
  "lifeSituation": "Single",
  "income": "$60k–100k / ₩80–130M",
  "savings": "6–12 months",
  "hoursPerWeek": "5–10",
  "stuck": "I've been burnt out for almost a year. I keep thinking about quitting but I also just got fast-tracked for a director promotion. I don't know if I want it or just don't want to disappoint anyone.",
  "desiredChange": "Get my film camera back into regular rotation; figure out if I want this director role or just don't want to disappoint anyone",
  "tried": "Therapy, weekend trips, gym",
  "strengths": "Writing, strategy, making teams feel calm, seeing the story in data",
  "struggles": "Saying no, perfectionism, losing myself in other people's priorities",
  "childhoodDream": "Photographer",
  "feelsAlive": "Early mornings with coffee and a notebook. My film camera.",
  "mbti": "INFJ",
  "boldness": "3 — Balanced"
}
```

## Don'ts

- Don't add Supabase yet — pass state via sessionStorage
- Don't hardcode `ANTHROPIC_API_KEY` anywhere — only read from `process.env`
- Don't make up URLs in resources — only well-known sites with real URLs
- Don't commit `.env.local` (already gitignored — verify with `git status`)
- Don't push to `main` — push to `jiyun` branch, open PR
- Don't try to build all 4 pages at once — build the API first, test it, then UI

## When done

```bash
git status                  # confirm .env.local is NOT in the list
git add .
git commit -m "feat: 90-day plan menu — quiz, API, plan rendering"
git push -u origin jiyun
gh pr create --web
```

In the PR description, include: a short summary, a screenshot of the rendered Sarah-Kim plan, and a note that this is for the "Next Step in Life: 90-day plan" menu.
