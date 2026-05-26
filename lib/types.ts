export type Answers = Record<string, string | number>;

export type PlanAction = {
  week: number;
  title: string;
  why: string;
  effort: 'small' | 'medium' | 'large';
};

export type PlanMonth = {
  month: 1 | 2 | 3;
  theme: string;
  actions: PlanAction[];
};

export type PlanResource = {
  title: string;
  url: string;
  why: string;
  source?: string; // 검증된 라이브러리에서 가져왔을 때만 채워진다 ("출처: 인프런" 등)
};

export type Plan = {
  headline: string;
  rationale: string;
  coreInsight: string;
  months: PlanMonth[];
  resources: PlanResource[];
  firstStep: string;
};

export type Persona = {
  name: string;               // e.g. "The Director", "The Photographer"
  coreBelief: string;         // 1-2 sentences: what they believe about the user's situation
  keyFear: string;            // 1 sentence: what they're afraid of
  strongestArgument: string;  // 1-2 sentences: most persuasive thing they'd say (used by plan generation)
  communicationStyle: string; // 2-4 words: how they speak (used by plan generation)
};

export type PersonasResponse = {
  personas: Persona[]; // exactly 4
};

export type DebateTurn = {
  speaker: string;  // must equal one of the two persona names
  message: string;  // 1-3 sentences
};

export type DebateResponse = {
  turns: DebateTurn[]; // ~12-18 turns, alternating speakers
};
