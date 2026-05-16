"use client";

import { getSupabase } from "@/lib/supabase";
import type { Answers, Persona, Plan } from "@/lib/types";

export interface SavedPlan {
  id: string;
  user_id: string;
  created_at: string;
  answers: Answers;
  personas: Persona[];
  plan: Plan;
}

export interface PlanSummary {
  id: string;
  created_at: string;
  headline: string;
  coreInsight: string;
  firstStep: string;
  monthsCount: number;
  personaNames: string[];
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
  const { data, error } = await supabase
    .from("nextstep_plans")
    .select("id, created_at, plan, personas")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return (
    data as Array<{
      id: string;
      created_at: string;
      plan: Plan;
      personas: Persona[];
    }>
  ).map((row) => ({
    id: row.id,
    created_at: row.created_at,
    headline: row.plan.headline,
    coreInsight: row.plan.coreInsight,
    firstStep: row.plan.firstStep,
    monthsCount: row.plan.months?.length ?? 0,
    personaNames: (row.personas ?? []).map((p) => p.name),
  }));
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
  return data as SavedPlan;
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
