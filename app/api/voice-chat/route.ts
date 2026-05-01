import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

interface VoiceChatRequest {
  systemPrompt: string;
  messages: { role: "assistant" | "user"; content: string }[];
}

const DEMO_REPLIES = [
  "재미있는 질문이네. 내가 그 시기에 가장 후회했던 건 행동을 미룬 거였어. 작은 거라도 오늘 시작해봐.",
  "그건 두 가지로 갈라져. 하나는 안전한 길, 하나는 네가 진짜 원하는 길. 어느 쪽이 더 무서운지 한번 봐봐 — 보통 무서운 쪽이 답이야.",
  "지금 너의 자원을 정확히 알고 있어? 시간, 사람, 돈, 평판. 그 네 가지로 다음 한 수를 짜야 해.",
  "내가 너였을 때, 누군가에게 도움을 청하는 게 가장 어려웠어. 근데 그게 가장 빠른 길이었어.",
];

export async function POST(request: NextRequest) {
  try {
    const { systemPrompt, messages } = (await request.json()) as VoiceChatRequest;

    if (!systemPrompt?.trim() || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "systemPrompt와 messages가 필요합니다." },
        { status: 400 },
      );
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;

    // 데모 모드: API 키 없으면 짧은 무작위 응답.
    if (!apiKey) {
      const reply = DEMO_REPLIES[Math.floor(Math.random() * DEMO_REPLIES.length)];
      return NextResponse.json({ reply });
    }

    const client = new Anthropic({ apiKey });

    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 400,
      system: `${systemPrompt}

응답 가이드라인:
- 한국어로 답변. 음성으로 읽힐 텍스트이므로 마크다운/이모지/괄호 주석 금지.
- 1~3문장으로 짧게. 사람처럼 자연스럽게.
- 사용자의 마지막 발화에만 직접 답하고, 다음 대화를 유도하는 짧은 질문이나 제안으로 마무리.`,
      messages: messages.map((m) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: m.content,
      })),
    });

    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return NextResponse.json(
        { error: "응답을 해석할 수 없습니다." },
        { status: 500 },
      );
    }

    return NextResponse.json({ reply: textBlock.text.trim() });
  } catch (error) {
    console.error("voice-chat API error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "서버 오류가 발생했습니다.",
      },
      { status: 500 },
    );
  }
}
