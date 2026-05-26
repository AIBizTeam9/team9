"use client";

import { getSupabase } from "@/lib/supabase";
import type { Answers, Persona, Plan } from "@/lib/types";

// 진행 상황: 각 action을 week 번호로 키잉. note는 사용자가 적은 회고.
export type PlanProgressEntry = {
  done: boolean;
  note: string;
  updatedAt: string;
};

// 일일 저널. PlanProgress 안의 reserved key 아래에 묶어서 같은 컬럼에 저장한다.
// __ 접두사로 action 키와 충돌 불가 (action 키는 `week_${n}` 형태).
export type JournalEntry = {
  body: string;
  mood?: number;        // 1-5
  createdAt: string;
  updatedAt?: string;
};
export type Journal = Record<string, JournalEntry>; // YYYY-MM-DD → entry
export const JOURNAL_KEY = "__journal";

// PlanProgress의 키는 action 진행("week_${n}")이 기본. __journal 같은 reserved
// 슬롯은 같은 컬럼에 같이 들어가지만 PlanProgressEntry가 아니다. 타입은 좁게
// 유지하고, db.ts 내부에서만 cast로 reserved 슬롯을 다룬다.
export type PlanProgress = Record<string, PlanProgressEntry>;

function actionEntries(progress: PlanProgress): PlanProgressEntry[] {
  // __ 접두사 키는 reserved (예: __journal). action 카운트에서 제외.
  return Object.entries(progress)
    .filter(([k]) => !k.startsWith("__"))
    .map(([, v]) => v);
}

export function getJournal(progress: PlanProgress | null | undefined): Journal {
  if (!progress) return {};
  const raw = (progress as Record<string, unknown>)[JOURNAL_KEY];
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  // raw가 Journal 형태인지 얕게 검증 (런타임에 들어온 데이터 신뢰 X)
  const out: Journal = {};
  for (const [date, entry] of Object.entries(raw as Record<string, unknown>)) {
    if (!entry || typeof entry !== "object") continue;
    const e = entry as Record<string, unknown>;
    if (typeof e.body !== "string") continue;
    out[date] = {
      body: e.body,
      mood: typeof e.mood === "number" ? e.mood : undefined,
      createdAt: typeof e.createdAt === "string" ? e.createdAt : new Date().toISOString(),
      updatedAt: typeof e.updatedAt === "string" ? e.updatedAt : undefined,
    };
  }
  return out;
}

// YYYY-MM-DD in the user's local time. Streak / journal key both use this.
export function localDateKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// pure — caller persists via updatePlanProgress.
export function upsertJournalEntry(
  progress: PlanProgress,
  dateISO: string,
  next: { body: string; mood?: number },
): PlanProgress {
  const journal = getJournal(progress);
  const prev = journal[dateISO];
  const now = new Date().toISOString();
  const entry: JournalEntry = {
    body: next.body,
    mood: next.mood,
    createdAt: prev?.createdAt ?? now,
    updatedAt: now,
  };
  return {
    ...progress,
    [JOURNAL_KEY]: { ...journal, [dateISO]: entry },
  } as unknown as PlanProgress;
}

export function removeJournalEntry(
  progress: PlanProgress,
  dateISO: string,
): PlanProgress {
  const journal = getJournal(progress);
  if (!(dateISO in journal)) return progress;
  const next = { ...journal };
  delete next[dateISO];
  return { ...progress, [JOURNAL_KEY]: next } as unknown as PlanProgress;
}

// 오늘(또는 어제) 끝나는 연속 일수. 어제까지 쓰고 오늘 안 쓴 경우에도 streak 살아 있음.
// 둘 다 비어 있으면 0.
export function computeStreak(journal: Journal, todayISO: string = localDateKey()): number {
  if (Object.keys(journal).length === 0) return 0;
  const today = new Date(`${todayISO}T00:00:00`);
  const hasToday = !!journal[todayISO];
  let cursor = new Date(today);
  if (!hasToday) cursor.setDate(cursor.getDate() - 1); // 오늘 안 썼으면 어제부터 카운트
  let count = 0;
  while (true) {
    const key = localDateKey(cursor);
    if (journal[key]) {
      count += 1;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }
  return count;
}

// 마지막 저널 작성일로부터 며칠 지났는지. 비어있으면 null.
export function daysSinceLastEntry(
  journal: Journal,
  todayISO: string = localDateKey(),
): number | null {
  const keys = Object.keys(journal).sort();
  if (keys.length === 0) return null;
  const last = keys[keys.length - 1];
  const lastDate = new Date(`${last}T00:00:00`);
  const today = new Date(`${todayISO}T00:00:00`);
  const ms = today.getTime() - lastDate.getTime();
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
}

export interface SavedPlan {
  id: string;
  user_id: string;
  created_at: string;
  answers: Answers;
  personas: Persona[];
  plan: Plan;
  progress: PlanProgress;
}

export interface PlanSummary {
  id: string;
  created_at: string;
  headline: string;
  coreInsight: string;
  firstStep: string;
  monthsCount: number;
  personaNames: string[];
  totalActions: number;
  doneCount: number;
  noteCount: number;
}

export type SaveResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

export async function savePlan(
  userId: string,
  data: { answers: Answers; personas: Persona[]; plan: Plan },
): Promise<SaveResult> {
  const supabase = getSupabase();
  if (!supabase) return { ok: false, error: "Supabase 클라이언트 미초기화" };
  const { data: row, error } = await supabase
    .from("nextstep_plans")
    .insert({
      user_id: userId,
      answers: data.answers,
      personas: data.personas,
      plan: data.plan,
    })
    .select("id")
    .single();
  if (error) {
    console.error("[savePlan] insert failed:", error);
    return {
      ok: false,
      error: error.message || error.details || "insert failed",
    };
  }
  if (!row) return { ok: false, error: "no row returned" };
  return { ok: true, id: (row as { id: string }).id };
}

export async function listPlans(userId: string): Promise<PlanSummary[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  // select("*")로 가져와 progress 컬럼이 아직 없는 환경(마이그레이션 미적용)에서도 동작.
  // 명시적으로 'progress'를 select하면 컬럼이 없을 때 쿼리 자체가 실패해 빈 배열이 됨.
  const { data, error } = await supabase
    .from("nextstep_plans")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) {
    console.error("[listPlans] failed:", error);
    return [];
  }
  if (!data) return [];
  return (
    data as Array<{
      id: string;
      created_at: string;
      plan: Plan;
      personas: Persona[];
      progress?: PlanProgress | null;
    }>
  ).map((row) => {
    const totalActions = (row.plan.months ?? []).reduce(
      (s, m) => s + (m.actions?.length ?? 0),
      0,
    );
    const prog: PlanProgress = row.progress ?? {};
    const actions = actionEntries(prog);
    const doneCount = actions.filter((p) => p.done).length;
    const noteCount = actions.filter(
      (p) => p.note && p.note.trim().length > 0,
    ).length;
    return {
      id: row.id,
      created_at: row.created_at,
      headline: row.plan.headline,
      coreInsight: row.plan.coreInsight,
      firstStep: row.plan.firstStep,
      monthsCount: row.plan.months?.length ?? 0,
      personaNames: (row.personas ?? []).map((p) => p.name),
      totalActions,
      doneCount,
      noteCount,
    };
  });
}

export async function getPlan(
  userId: string,
  id: string,
): Promise<SavedPlan | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("nextstep_plans")
    .select("*")
    .eq("user_id", userId)
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  const row = data as SavedPlan;
  return { ...row, progress: row.progress ?? {} };
}

export async function updatePlanProgress(
  userId: string,
  id: string,
  progress: PlanProgress,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = getSupabase();
  if (!supabase) return { ok: false, error: "Supabase 클라이언트 미초기화" };
  const { error } = await supabase
    .from("nextstep_plans")
    .update({ progress })
    .eq("user_id", userId)
    .eq("id", id);
  if (error) {
    console.error("[updatePlanProgress] failed:", error);
    return { ok: false, error: error.message || "update failed" };
  }
  return { ok: true };
}

export function progressStats(progress: PlanProgress, totalActions: number) {
  const actions = actionEntries(progress);
  const doneCount = actions.filter((p) => p.done).length;
  const noteCount = actions.filter(
    (p) => p.note && p.note.trim().length > 0,
  ).length;
  const pct = totalActions === 0 ? 0 : Math.round((doneCount / totalActions) * 100);
  return { doneCount, noteCount, pct, totalActions };
}

export async function deletePlan(userId: string, id: string): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;
  await supabase
    .from("nextstep_plans")
    .delete()
    .eq("user_id", userId)
    .eq("id", id);
}

export async function countPlans(userId: string): Promise<number> {
  const supabase = getSupabase();
  if (!supabase) return 0;
  const { count } = await supabase
    .from("nextstep_plans")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);
  return count ?? 0;
}

export interface PlansOverview {
  total: number;
  latest: PlanSummary | null;
}

export async function loadPlansOverview(
  userId: string,
): Promise<PlansOverview> {
  const list = await listPlans(userId);
  return {
    total: list.length,
    latest: list[0] ?? null,
  };
}
