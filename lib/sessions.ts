/**
 * 세션 저장/조회 유틸
 *
 * 팀원 사용법:
 *   import { createSession, saveConversation, getSession, listSessions } from "@/lib/sessions";
 *
 *   // 새 세션 생성 (퀴즈 완료 시)
 *   const session = await createSession(quizAnswers, personaA, personaB, insight);
 *
 *   // 대화 저장
 *   await saveConversation(session.id, debateMessages);
 *
 *   // 세션 조회
 *   const data = await getSession(sessionId);
 *
 *   // 전체 세션 목록
 *   const all = await listSessions();
 */

import { supabase } from "./supabase";

export interface SessionData {
  id: string;
  created_at: string;
  quiz_answers: Record<string, unknown> | null;
  persona_a: Record<string, unknown> | null;
  persona_b: Record<string, unknown> | null;
  insight: Record<string, unknown> | null;
}

export interface ConversationMessage {
  speaker: string;
  content: string;
}

export async function createSession(
  quizAnswers: Record<string, unknown>,
  personaA: Record<string, unknown>,
  personaB: Record<string, unknown>,
  insight: Record<string, unknown>,
): Promise<SessionData> {
  const { data, error } = await supabase
    .from("sessions")
    .insert({
      quiz_answers: quizAnswers,
      persona_a: personaA,
      persona_b: personaB,
      insight: insight,
    })
    .select()
    .single();

  if (error) throw new Error(`세션 생성 실패: ${error.message}`);
  return data;
}

export async function saveConversation(
  sessionId: string,
  messages: ConversationMessage[],
): Promise<void> {
  const rows = messages.map((msg, i) => ({
    session_id: sessionId,
    speaker: msg.speaker,
    content: msg.content,
    turn_order: i,
  }));

  const { error } = await supabase.from("conversations").insert(rows);
  if (error) throw new Error(`대화 저장 실패: ${error.message}`);
}

export async function getSession(sessionId: string) {
  const { data: session, error: sessionError } = await supabase
    .from("sessions")
    .select("*")
    .eq("id", sessionId)
    .single();

  if (sessionError) throw new Error(`세션 조회 실패: ${sessionError.message}`);

  const { data: conversations, error: convError } = await supabase
    .from("conversations")
    .select("*")
    .eq("session_id", sessionId)
    .order("turn_order", { ascending: true });

  if (convError) throw new Error(`대화 조회 실패: ${convError.message}`);

  return { session, conversations };
}

export async function listSessions(limit = 20): Promise<SessionData[]> {
  const { data, error } = await supabase
    .from("sessions")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(`세션 목록 조회 실패: ${error.message}`);
  return data;
}
