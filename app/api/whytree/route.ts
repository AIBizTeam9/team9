import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import type { ChatMessage, WhyTree } from "@/lib/whytree/types";
import { applyTool, treeForLLM } from "@/lib/whytree/tree-ops";
import { WHYTREE_SYSTEM_PROMPT, WHYTREE_TOOLS } from "@/lib/whytree/prompt";

interface WhyTreeRequest {
  messages: ChatMessage[];
  tree: WhyTree;
}

const MAX_TOOL_ITERATIONS = 6;

function sseEncode(obj: unknown): Uint8Array {
  return new TextEncoder().encode(`data: ${JSON.stringify(obj)}\n\n`);
}
function sseDone(): Uint8Array {
  return new TextEncoder().encode(`data: [DONE]\n\n`);
}

// API 키 없을 때 데모 응답: 트리에 따라 살짝 다른 멘트.
function demoStream(tree: WhyTree): ReadableStream<Uint8Array> {
  const empty = Object.keys(tree.nodes).length === 0;
  const reply = empty
    ? "안녕하세요. 시작하기 전에 짧게 말씀드릴게요. 같이 할 일은 단순합니다 — 당신이 자꾸 떠올리는 것 하나를 단서로, 그게 왜 중요한지를 따라가면서 더 줄어들지 않는 뿌리에 닿아볼 거예요. 답은 바깥에 있지 않아요. 솔직하면 됩니다.\n\n첫 질문이에요. 마음이 자유로울 때 — 샤워할 때, 잠들기 전, 산책 중 — 자꾸 떠오르는 게 뭐예요? 할 일 목록 말고요."
    : "방금 들은 게 무게가 있네요. 잠깐 그 자리에 머물러도 괜찮아요.\n\n그게 당신에게 왜 중요한가요?";

  const tokens = reply.match(/\S+\s*|\n+/g) ?? [reply];
  return new ReadableStream({
    async start(controller) {
      try {
        for (const t of tokens) {
          controller.enqueue(sseEncode({ type: "text", delta: t }));
          await new Promise((r) => setTimeout(r, 50));
        }
        controller.enqueue(sseEncode({ type: "tree", tree }));
        controller.enqueue(sseEncode({ type: "done" }));
        controller.enqueue(sseDone());
      } finally {
        controller.close();
      }
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const { messages, tree } = (await request.json()) as WhyTreeRequest;

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "messages 필요" }, { status: 400 });
    }
    if (!tree) {
      return NextResponse.json({ error: "tree 필요" }, { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    const baseHeaders = {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-store, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    } as const;

    if (!apiKey) {
      return new Response(demoStream(tree), { headers: baseHeaders });
    }

    const client = new Anthropic({ apiKey, maxRetries: 4 });

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        let currentTree = tree;
        // 첫 user 턴에 트리 상태를 컨텍스트로 주입.
        // (system은 정적 — caching 친화)
        const lastUserIdx = messages.length - 1;
        const lastUserMsg = messages[lastUserIdx];
        const userWithContext: ChatMessage = {
          ...lastUserMsg,
          content: `<현재_트리>\n${treeForLLM(currentTree)}\n</현재_트리>\n\n${lastUserMsg.content}`,
        };
        const seedMessages = [
          ...messages.slice(0, lastUserIdx).map((m) => ({
            role: m.role,
            content: m.content,
          })),
          { role: userWithContext.role, content: userWithContext.content },
        ];

        type ContentBlock =
          | { type: "text"; text: string }
          | { type: "tool_use"; id: string; name: string; input: Record<string, unknown> }
          | { type: "tool_result"; tool_use_id: string; content: string };
        type AnthMsg = {
          role: "user" | "assistant";
          content: string | ContentBlock[];
        };

        let working: AnthMsg[] = seedMessages as unknown as AnthMsg[];

        try {
          for (let iter = 0; iter < MAX_TOOL_ITERATIONS; iter++) {
            const msgStream = client.messages.stream({
              model: "claude-sonnet-4-6",
              max_tokens: 1024,
              system: WHYTREE_SYSTEM_PROMPT,
              tools: WHYTREE_TOOLS,
              messages: working as Anthropic.Messages.MessageParam[],
            });

            for await (const event of msgStream) {
              if (
                event.type === "content_block_delta" &&
                event.delta.type === "text_delta"
              ) {
                controller.enqueue(
                  sseEncode({ type: "text", delta: event.delta.text }),
                );
              }
            }

            const finalMsg = await msgStream.finalMessage();
            const toolUses = finalMsg.content.filter(
              (b): b is Anthropic.Messages.ToolUseBlock => b.type === "tool_use",
            );

            if (toolUses.length === 0) {
              break;
            }

            // 도구 실행 → 결과 누적
            const toolResults: ContentBlock[] = [];
            for (const tu of toolUses) {
              const { tree: t, result } = applyTool(
                currentTree,
                tu.name,
                (tu.input ?? {}) as Record<string, unknown>,
              );
              currentTree = t;
              controller.enqueue(
                sseEncode({
                  type: "tool",
                  op: tu.name,
                  input: tu.input,
                  result,
                }),
              );
              toolResults.push({
                type: "tool_result",
                tool_use_id: tu.id,
                content: JSON.stringify(result),
              });
            }

            working = [
              ...working,
              {
                role: "assistant",
                content: finalMsg.content as unknown as ContentBlock[],
              },
              { role: "user", content: toolResults },
            ];
          }

          controller.enqueue(sseEncode({ type: "tree", tree: currentTree }));
          controller.enqueue(sseEncode({ type: "done" }));
        } catch (err) {
          const message = err instanceof Error ? err.message : "stream error";
          controller.enqueue(sseEncode({ type: "error", message }));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, { headers: baseHeaders });
  } catch (error) {
    console.error("whytree API error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "서버 오류",
      },
      { status: 500 },
    );
  }
}
