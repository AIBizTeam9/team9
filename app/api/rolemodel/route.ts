import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

interface RoleModelRequest {
  situation: string;
  goals: string;
  decision: string;
}

interface RoleModelResponse {
  roleModel: string;
  profession: string;
  situation: string;
  choice: string;
  reasoning: string;
  lessons: string[];
}

export async function POST(request: NextRequest) {
  try {
    const { situation, goals, decision } = (await request.json()) as RoleModelRequest;

    // Validate input
    if (!situation?.trim() || !goals?.trim() || !decision?.trim()) {
      return NextResponse.json(
        { error: "모든 필드를 입력해주세요." },
        { status: 400 }
      );
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;

    // Demo mode if no API key
    if (!apiKey) {
      return NextResponse.json({
        roleModel: "스티브 잡스",
        profession: "Apple 창업자 · 디자이너",
        situation:
          "기술과 인문학의 경계에서 혁신을 추구하고 싶었던 상황. 자신의 독창적인 비전을 세상에 구현할 것인지 판단하는 갈림길.",
        choice:
          "1976년 인텔 컴퓨터 열풍 속에서도 \"컴퓨터의 미래는 일반인을 위한 사용자 경험\"이라고 믿고 Apple을 창업했습니다.",
        reasoning:
          "기술만이 아닌 디자인과 인문학적 감각을 결합하면 세상을 바꿀 수 있다는 철학. 남들이 하지 않는 길을 갔지만, 깊은 신념과 고객 중심 사고가 확신을 줬습니다.",
        lessons: [
          "일관된 신념이 있으면 불확실한 미래도 나아갈 수 있다",
          "자신의 강점(디자인 감각)을 남들과 다른 분야(기술)에 적용하면 새로운 기회가 생긴다",
          "\"생각이 다르다\"는 것이 약점이 아니라 자산이 될 수 있다",
        ],
      });
    }

    const client = new Anthropic({
      apiKey,
    });

    const message = await client.messages.create({
      model: "claude-opus-4-1-20250805",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `당신은 역사 속 인물들의 선택과 교훈을 분석하는 전문가입니다.

사용자의 상황에 맞는 적절한 역사적 인물(또는 현대의 저명인)을 추천하고, 그 인물이 유사한 상황에서 어떤 선택을 했는지, 그리고 사용자가 배울 점을 설명해주세요.

사용자의 상황:
- 현재 생활 상황: ${situation}
- 목표 및 꿈: ${goals}
- 직면한 주요 결정: ${decision}

아래 JSON 형식으로 응답해주세요(한국어, 마크다운 포함 가능):
{
  "roleModel": "역사적 인물 이름 (한국식 이름으로)",
  "profession": "직업 및 주요 성과 (간단히)",
  "situation": "그 인물이 직면한 유사한 상황 (2-3문장)",
  "choice": "그 인물이 내린 선택 (구체적으로)",
  "reasoning": "왜 그런 선택을 했는지, 그 배경과 철학 (3-4문장)",
  "lessons": ["배울 점 1", "배울 점 2", "배울 점 3"]
}

응답은 JSON만 포함하고, 다른 텍스트는 포함하지 마세요.`,
        },
      ],
    });

    const textContent = message.content.find((block) => block.type === "text");
    if (!textContent || textContent.type !== "text") {
      return NextResponse.json(
        { error: "API 응답 처리 중 오류가 발생했습니다." },
        { status: 500 }
      );
    }

    let response: RoleModelResponse;
    try {
      response = JSON.parse(textContent.text) as RoleModelResponse;
    } catch {
      return NextResponse.json(
        { error: "API 응답 형식이 올바르지 않습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("Role model API error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "서버 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}
