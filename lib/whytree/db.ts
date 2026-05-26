"use client";

import { getSupabase } from "@/lib/supabase";
import { newTree } from "./tree-ops";
import type { ChatMessage, WhyTree } from "./types";

// 사용자 로컬 타임존 기준 YYYY-MM-DD.
export function todayDateString(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export interface DailyTreeRecord {
  id: string;
  date: string;
  tree: WhyTree;
}

// 해당 날짜의 트리 row. 없으면 null.
export async function getTreeForDate(
  userId: string,
  date: string,
): Promise<DailyTreeRecord | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("whytree_trees")
    .select("id, date, tree")
    .eq("user_id", userId)
    .eq("date", date)
    .maybeSingle();
  if (error || !data) return null;
  return {
    id: (data as { id: string }).id,
    date: (data as { date: string }).date,
    tree: (data as { tree: WhyTree }).tree,
  };
}

// 없으면 생성하고, 있으면 그대로 반환.
export async function ensureTreeForDate(
  userId: string,
  date: string,
): Promise<DailyTreeRecord> {
  const existing = await getTreeForDate(userId, date);
  if (existing) return existing;

  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase 미초기화");

  const empty = newTree(`${date} 트리`);
  const { data, error } = await supabase
    .from("whytree_trees")
    .insert({ user_id: userId, date, tree: empty })
    .select("id, date, tree")
    .single();
  if (error || !data) {
    // 동시성 — 다른 탭이 막 만들었을 수 있음. 다시 조회.
    const retry = await getTreeForDate(userId, date);
    if (retry) return retry;
    throw new Error(error?.message ?? "트리 생성 실패");
  }
  return {
    id: (data as { id: string }).id,
    date: (data as { date: string }).date,
    tree: (data as { tree: WhyTree }).tree,
  };
}

export async function saveTreeForDate(
  userId: string,
  date: string,
  tree: WhyTree,
): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;
  await supabase
    .from("whytree_trees")
    .update({ tree, updated_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("date", date);
}

export async function appendMessageDB(
  userId: string,
  treeId: string,
  msg: ChatMessage,
): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;
  await supabase.from("whytree_messages").insert({
    user_id: userId,
    tree_id: treeId,
    role: msg.role,
    content: msg.content,
  });
}

export async function loadMessagesForTree(
  treeId: string,
): Promise<ChatMessage[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("whytree_messages")
    .select("role, content, created_at")
    .eq("tree_id", treeId)
    .order("created_at", { ascending: true });
  if (error || !data) return [];
  return (
    data as Array<{ role: string; content: string; created_at: string }>
  ).map((row) => ({
    role: row.role as "user" | "assistant",
    content: row.content,
    ts: row.created_at,
  }));
}

// 오늘 트리 + 메시지 (없으면 생성하지 않고 빈 상태로 반환 — 첫 메시지 보낼 때 lazy 생성).
export async function loadTodayBundle(userId: string): Promise<{
  date: string;
  tree: WhyTree;
  treeId: string | null;
  messages: ChatMessage[];
}> {
  const date = todayDateString();
  const rec = await getTreeForDate(userId, date);
  if (!rec) {
    return {
      date,
      tree: newTree(`${date} 트리`),
      treeId: null,
      messages: [],
    };
  }
  const messages = await loadMessagesForTree(rec.id);
  return { date, tree: rec.tree, treeId: rec.id, messages };
}

export async function deleteTreeForDate(
  userId: string,
  date: string,
): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;
  await supabase
    .from("whytree_trees")
    .delete()
    .eq("user_id", userId)
    .eq("date", date);
}

// /account/whytree 목록용 — 일자별 요약.
export interface DailySummary {
  id: string;
  date: string;
  nodeCount: number;
  messageCount: number;
  experimentLabel: string | null;
  purpose: string | null;
  updatedAt: string;
}

export async function listDailySummaries(
  userId: string,
): Promise<DailySummary[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data: trees, error } = await supabase
    .from("whytree_trees")
    .select("id, date, tree, updated_at")
    .eq("user_id", userId)
    .order("date", { ascending: false });
  if (error || !trees) return [];

  const treeRows = trees as Array<{
    id: string;
    date: string;
    tree: WhyTree;
    updated_at: string;
  }>;
  const treeIds = treeRows.map((t) => t.id);
  const msgCounts = new Map<string, number>();
  if (treeIds.length > 0) {
    const { data: msgs } = await supabase
      .from("whytree_messages")
      .select("tree_id")
      .in("tree_id", treeIds);
    if (msgs) {
      for (const m of msgs as Array<{ tree_id: string }>) {
        msgCounts.set(m.tree_id, (msgCounts.get(m.tree_id) ?? 0) + 1);
      }
    }
  }

  return treeRows.map((t) => {
    const tree = t.tree;
    const expId = tree.lastExperimentId;
    const expLabel =
      expId && tree.nodes[expId] ? tree.nodes[expId].label : null;
    return {
      id: t.id,
      date: t.date,
      nodeCount: Object.keys(tree.nodes).length,
      messageCount: msgCounts.get(t.id) ?? 0,
      experimentLabel: expLabel,
      purpose: tree.purpose,
      updatedAt: t.updated_at,
    };
  });
}

export async function loadDailyDetail(
  userId: string,
  date: string,
): Promise<{ tree: WhyTree; messages: ChatMessage[] } | null> {
  const rec = await getTreeForDate(userId, date);
  if (!rec) return null;
  const messages = await loadMessagesForTree(rec.id);
  return { tree: rec.tree, messages };
}

// /account 카드용 — 모든 트리 합산 통계.
export interface OverallSummary {
  hasData: boolean;
  totalSessions: number;
  totalMessages: number;
  totalNodes: number;
  lastDate: string | null;
  lastUpdatedAt: string | null;
  latestExperiment: string | null;
  latestPurpose: string | null;
}

export async function loadOverallSummary(
  userId: string,
): Promise<OverallSummary> {
  const summaries = await listDailySummaries(userId);
  if (summaries.length === 0) {
    return {
      hasData: false,
      totalSessions: 0,
      totalMessages: 0,
      totalNodes: 0,
      lastDate: null,
      lastUpdatedAt: null,
      latestExperiment: null,
      latestPurpose: null,
    };
  }
  const totalMessages = summaries.reduce((s, x) => s + x.messageCount, 0);
  const totalNodes = summaries.reduce((s, x) => s + x.nodeCount, 0);
  const latest = summaries[0];
  return {
    hasData: totalMessages > 0 || totalNodes > 0,
    totalSessions: summaries.length,
    totalMessages,
    totalNodes,
    lastDate: latest.date,
    lastUpdatedAt: latest.updatedAt,
    latestExperiment: latest.experimentLabel,
    latestPurpose: latest.purpose,
  };
}
