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
};

export type Plan = {
  headline: string;
  rationale: string;
  coreInsight: string;
  months: PlanMonth[];
  resources: PlanResource[];
  firstStep: string;
};
