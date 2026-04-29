export type Question = {
  k: string;
  type: 'number' | 'text' | 'textarea' | 'choice';
  t: string;
  h?: string;
  ph?: string;
  o?: string[];
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
  { k: 'boldness', type: 'choice', t: 'How bold do you want this plan to be?', h: '1 = small incremental changes; 5 = leap', o: ['1 — Incremental', '2 — Modest', '3 — Balanced', '4 — Bold', '5 — Leap'] },
];
