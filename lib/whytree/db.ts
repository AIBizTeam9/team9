"use client";

import { getSupabase } from "@/lib/supabase";
import { newTree } from "./tree-ops";
import type { ChatMessage, WhyTree } from "./types";

export async function loadTreeDB(userId: string): Promise<WhyTree> {
  const supabase = getSupabase();
  if (!supabase) return newTree();
  const { data, error } = await supabase
    .from("whytree_trees")
    .select("tree")
    .eq("user_id", userId)
    .maybeSingle();
  if (error || !data) return newTree();
  const t = data.tree as WhyTree | null;
  if (!t || t.schemaVersion !== 1) return newTree();
  return t;
}

export async function saveTreeDB(userId: string, tree: WhyTree): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;
  await supabase
    .from("whytree_trees")
    .upsert(
      {
        user_id: userId,
        tree,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );
}

export async function loadMessagesDB(userId: string): Promise<ChatMessage[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("whytree_messages")
    .select("role, content, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });
  if (error || !data) return [];
  return (data as Array<{ role: string; content: string; created_at: string }>).map(
    (row) => ({
      role: row.role as "user" | "assistant",
      content: row.content,
      ts: row.created_at,
    }),
  );
}

export async function appendMessageDB(
  userId: string,
  msg: ChatMessage,
): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;
  await supabase.from("whytree_messages").insert({
    user_id: userId,
    role: msg.role,
    content: msg.content,
  });
}

export async function clearWhyTreeDB(userId: string): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;
  await supabase.from("whytree_messages").delete().eq("user_id", userId);
  await supabase.from("whytree_trees").delete().eq("user_id", userId);
}

// 요약 정보 — /account에서 카드 미리보기로 쓰기 위함.
export interface WhyTreeSummary {
  hasData: boolean;
  nodeCount: number;
  messageCount: number;
  lastMessageAt: string | null;
  experimentLabel: string | null;
  purpose: string | null;
}

export async function loadSummaryDB(userId: string): Promise<WhyTreeSummary> {
  const supabase = getSupabase();
  if (!supabase) {
    return {
      hasData: false,
      nodeCount: 0,
      messageCount: 0,
      lastMessageAt: null,
      experimentLabel: null,
      purpose: null,
    };
  }
  const [{ data: treeRow }, { data: lastMsg, count }] = await Promise.all([
    supabase.from("whytree_trees").select("tree").eq("user_id", userId).maybeSingle(),
    supabase
      .from("whytree_messages")
      .select("created_at", { count: "exact" })
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1),
  ]);
  const tree = (treeRow?.tree as WhyTree | undefined) ?? null;
  const messageCount = count ?? 0;
  const nodeCount = tree ? Object.keys(tree.nodes).length : 0;
  const experimentLabel =
    tree && tree.lastExperimentId && tree.nodes[tree.lastExperimentId]
      ? tree.nodes[tree.lastExperimentId].label
      : null;
  return {
    hasData: nodeCount > 0 || messageCount > 0,
    nodeCount,
    messageCount,
    lastMessageAt: lastMsg && lastMsg.length > 0 ? lastMsg[0].created_at : null,
    experimentLabel,
    purpose: tree?.purpose ?? null,
  };
}
