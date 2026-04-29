import { NextResponse } from "next/server";

type Phase = {
  title: string;
  days: string;
  goal: string;
  actions: string[];
  resources: string[];
};

const DEMO_PHASES: Phase[] = [
  {
    title: "탐색 & 학습",
    days: "1~30일",
    goal: "새로운 분야의 기초를 다지고, 가능성을 검증할 자료를 모은다",
    actions: [
      "관련 분야 입문서 / 강의 1개 완주",
      "현직자 또는 전문가 5명 인터뷰",
      "매주 2시간 정리 노트 작성",
      "관심 키워드로 정보 채널 5개 구독",
    ],
    resources: [
      "Coursera — 분야별 입문 강의",
      "유튜브 — 현직자 인터뷰 채널",
      "관련 키워드 뉴스레터 구독",
    ],
  },
  {
    title: "실행 & 경험",
    days: "31~60일",
    goal: "작은 실험을 통해 시장과 본인의 적합성을 검증한다",
    actions: [
      "사이드 프로젝트 / 포트폴리오 1개 착수",
      "관련 커뮤니티 또는 모임 2곳 참여",
      "멘토 또는 동료 1명 확보",
      "첫 결과물 공개 (블로그 / SNS)",
    ],
    resources: [
      "원티드 / 링크드인 — 채용 공고로 시장 파악",
      "Disquiet / 디스콰이엇 — 사이드 프로젝트 커뮤니티",
      "Notion / GitHub — 결과물 정리",
    ],
  },
  {
    title: "도약 & 정착",
    days: "61~90일",
    goal: "본격적인 활동으로 전환하고, 다음 90일 계획을 세운다",
    actions: [
      "정기 발행 / 결과물 루틴 확립 (주 1회)",
      "이직 또는 부수입 옵션 검토",
      "네트워크 확장 — 새로운 사람 10명",
      "90일 회고 + 다음 90일 플랜 작성",
    ],
    resources: [
      "잡플래닛 / 크레딧잡 — 연봉/기업 정보",
      "Threads / X — 분야 트렌드 추적",
      "회고 템플릿 — 90일 단위 리뷰",
    ],
  },
];

type RequestBody = { insights?: unknown };

function extractInsights(body: RequestBody): string[] {
  if (!body || !Array.isArray(body.insights)) return [];
  return body.insights.filter((s): s is string => typeof s === "string");
}

function isValidPhases(value: unknown): value is Phase[] {
  if (!Array.isArray(value) || value.length !== 3) return false;
  return value.every((p) => {
    if (!p || typeof p !== "object") return false;
    const phase = p as Record<string, unknown>;
    return (
      typeof phase.title === "string" &&
      typeof phase.days === "string" &&
      typeof phase.goal === "string" &&
      Array.isArray(phase.actions) &&
      phase.actions.every((a) => typeof a === "string")
    );
  });
}

export async function POST(request: Request) {
  let insights: string[] = [];
  try {
    const body = (await request.json()) as RequestBody;
    insights = extractInsights(body);
  } catch {
    // body 없음/잘못된 JSON — 그냥 빈 인사이트로 진행
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ phases: DEMO_PHASES, demo: true });
  }

  const prompt = `사용자의 디베이트 인사이트를 바탕으로 90일 실행 플랜을 생성합니다.

# 인사이트
${
  insights.length > 0
    ? insights.map((s, i) => `${i + 1}. ${s}`).join("\n")
    : "(인사이트 없음 — 일반적인 커리어 전환/성장 시나리오 기준으로 작성)"
}

# 출력 형식 (반드시 JSON만)
{
  "phases": [
    { "title": "...", "days": "1~30일", "goal": "...", "actions": ["...", "..."], "resources": ["...", "..."] },
    { "title": "...", "days": "31~60일", "goal": "...", "actions": [...], "resources": [...] },
    { "title": "...", "days": "61~90일", "goal": "...", "actions": [...], "resources": [...] }
  ]
}

# 작성 가이드
- 1단계: "탐색 & 학습" — 기초 다지기, 정보 수집
- 2단계: "실행 & 경험" — 작은 실행, 검증
- 3단계: "도약 & 정착" — 본격 전환, 루틴화
- 각 단계 actions 4개 — 측정 가능하고 행동 가능한 항목
- 각 단계 resources 3개 — 한국 사용자가 접근 가능한 실제 강의/플랫폼/커뮤니티 이름
- 모든 텍스트는 한국어`;

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content:
              "당신은 한국어로 답하는 커리어 코치입니다. 사용자 인사이트를 받아 구체적이고 실행 가능한 90일 플랜을 지정된 JSON 형식으로만 출력합니다.",
          },
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("[plan] OpenAI API error:", res.status, errText);
      return NextResponse.json(
        { phases: DEMO_PHASES, demo: true, error: "OpenAI 호출 실패" },
        { status: 200 },
      );
    }

    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      return NextResponse.json({ phases: DEMO_PHASES, demo: true });
    }

    const parsedRaw: unknown = JSON.parse(content);
    if (
      typeof parsedRaw !== "object" ||
      parsedRaw === null ||
      !("phases" in parsedRaw)
    ) {
      return NextResponse.json({ phases: DEMO_PHASES, demo: true });
    }
    const phases = (parsedRaw as { phases: unknown }).phases;
    if (!isValidPhases(phases)) {
      return NextResponse.json({ phases: DEMO_PHASES, demo: true });
    }

    return NextResponse.json({ phases });
  } catch (err) {
    console.error("[plan] Generation error:", err);
    return NextResponse.json({ phases: DEMO_PHASES, demo: true });
  }
}
