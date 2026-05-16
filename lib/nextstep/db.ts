"use client";

import { getSupabase } from "@/lib/supabase";
import type { Answers, Persona, Plan } from "@/lib/types";

// 진행 상황: 각 action을 week 번호로 키잉. note는 사용자가 적은 회고.
export type PlanProgressEntry = {
  done: boolean;
  note: string;
  updatedAt: string;
};
export type PlanProgress = Record<string, PlanProgressEntry>;

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
    const doneCount = Object.values(prog).filter((p) => p.done).length;
    const noteCount = Object.values(prog).filter(
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
  const doneCount = Object.values(progress).filter((p) => p.done).length;
  const noteCount = Object.values(progress).filter(
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
