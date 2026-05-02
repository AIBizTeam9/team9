import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

interface VoiceChatRequest {
  systemPrompt: string;
  messages: { role: "assistant" | "user"; content: string }[];
}

const DEMO_REPLIES = [
  "재미있는 질문이네. 내가 그 시기에 가장 후회했던 건 행동을 미룬 거였어. 작은 거라도 오늘 시작해봐.",
  "그건 두 가지로 갈라져. 하나는 안전한 길, 하나는 네가 진짜 원하는 길. 어느 쪽이 더 무서운지 봐봐. 보통 무서운 쪽이 답이야.",
  "지금 너의 자원을 정확히 알고 있어? 시간, 사람, 돈, 평판. 그 네 가지로 다음 한 수를 짜야 해.",
  "내가 너였을 때, 누군가에게 도움을 청하는 게 가장 어려웠어. 근데 그게 가장 빠른 길이었어.",
];

function sseEncode(obj: unknown): Uint8Array {
  return new TextEncoder().encode(`data: ${JSON.stringify(obj)}\n\n`);
}
function sseDone(): Uint8Array {
  return new TextEncoder().encode(`data: [DONE]\n\n`);
}

function demoStream(): ReadableStream<Uint8Array> {
  const reply = DEMO_REPLIES[Math.floor(Math.random() * DEMO_REPLIES.length)];
  // 어절 단위로 끊어서 60ms 간격으로 흘려보냄 — 진짜 스트리밍처럼.
  const tokens = reply.match(/\S+\s*/g) ?? [reply];

  return new ReadableStream({
    async start(controller) {
      try {
        for (const token of tokens) {
          controller.enqueue(sseEncode({ delta: token }));
          await new Promise((r) => setTimeout(r, 60));
        }
        controller.enqueue(sseDone());
      } finally {
        controller.close();
      }
    },
  });
}

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
    const baseHeaders = {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-store, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no", // proxy buffering 차단
    } as const;

    if (!apiKey) {
      return new Response(demoStream(), { headers: baseHeaders });
    }

    const client = new Anthropic({ apiKey });

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          const msgStream = client.messages.stream({
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

          for await (const event of msgStream) {
            if (
              event.type === "content_block_delta" &&
              event.delta.type === "text_delta"
            ) {
              controller.enqueue(sseEncode({ delta: event.delta.text }));
            }
          }
          controller.enqueue(sseDone());
        } catch (err) {
          const msg = err instanceof Error ? err.message : "stream error";
          controller.enqueue(sseEncode({ error: msg }));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, { headers: baseHeaders });
  } catch (error) {
    console.error("voice-chat API error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "서버 오류가 발생했습니다.",
      },
      { status: 500 },
    );
  }
}
