"""AI Career Explorer — 독립 백엔드 서버"""

import os
import logging
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="AI Career Explorer API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "")


@app.get("/api/health")
def health():
    return {"status": "ok", "service": "career-explorer"}


# ===== AI 커리어 탐색 (Career Explorer) =====

class CareerChatRequest(BaseModel):
    messages: list[dict]  # [{"role": "user"|"assistant", "content": "..."}]

class CareerChatResponse(BaseModel):
    reply: str
    phase: str  # exploring, analyzing, recommending

@app.post("/api/career/chat", response_model=CareerChatResponse)
def career_chat(req: CareerChatRequest):
    """대화형 AI 커리어 탐색 — 관심사/강점/목표를 분석하고 커리어 추천"""
    if not OPENAI_API_KEY:
        raise HTTPException(500, "OpenAI API 키가 설정되지 않았습니다. (OPENAI_API_KEY 환경변수)")

    try:
        from openai import OpenAI
        client = OpenAI(api_key=OPENAI_API_KEY)

        system_prompt = """당신은 전문 커리어 코치이자 AI 기반 커리어 탐색 어드바이저입니다.
사용자와 대화를 통해 관심사, 강점, 가치관, 목표를 탐색하고, 최적의 커리어 방향을 추천합니다.

## 대화 진행 방식

### Phase 1: 탐색 (exploring)
처음 3~4번의 대화에서는 사용자를 알아가는 데 집중하세요:
- 현재 상황 (학생/직장인/이직 고려 등)
- 관심 분야와 흥미로운 활동
- 강점과 잘하는 것
- 중요하게 생각하는 가치 (워라밸, 성장, 보상, 사회적 기여 등)
- 과거 경험에서 가장 보람 있었던 일
한 번에 너무 많은 질문을 하지 말고, 자연스럽게 1~2개씩 물어보세요.

### Phase 2: 분석 (analyzing)
충분한 정보가 모이면 (보통 4~5번째 대화 이후):
- 지금까지 파악한 사용자의 프로필을 요약
- 강점과 관심사의 교차점 분석
- 적합한 직무/산업 분야 3~5개 추천 (이유와 함께)

### Phase 3: 추천 (recommending)
구체적인 커리어 방향에 대해:
- 해당 직무의 구체적인 업무 내용, 필요 역량, 성장 경로
- **실제 채용 공고 검색 링크** 제공 (아래 형식 사용)
- 준비할 사항 (자격증, 포트폴리오, 스킬업 등)
- 구체적인 다음 단계 액션 아이템

## 채용 링크 형식
추천 직무마다 반드시 아래 형식으로 채용 링크를 포함하세요:
- 🔗 [사람인에서 '{직무명}' 검색](https://www.saramin.co.kr/zf_user/search?searchType=search&searchword={직무명 URL인코딩})
- 🔗 [잡코리아에서 '{직무명}' 검색](https://www.jobkorea.co.kr/Search/?stext={직무명 URL인코딩})
- 🔗 [LinkedIn에서 '{직무명}' 검색](https://www.linkedin.com/jobs/search/?keywords={직무명 URL인코딩}&location=South%20Korea)
- 🔗 [원티드에서 '{직무명}' 검색](https://www.wanted.co.kr/search?query={직무명 URL인코딩})

## 응답 규칙
- 한국어로 따뜻하고 전문적인 어투 사용
- 마크다운으로 구조화 (##, **, - 등)
- 공감과 격려를 포함하되 현실적인 조언 제공
- 각 메시지 끝에 다음 대화로 이어지는 질문 포함
- 첫 인사에서는 간단한 자기소개 후 편안하게 시작

## Phase 판단
- 사용자의 관심사/강점/목표 중 2개 이상 파악 전 → exploring
- 정보가 충분히 모였으나 아직 분석 전 → analyzing
- 구체적 직무 추천 및 링크 제공 중 → recommending"""

        # 대화 이력 구성
        api_messages = [{"role": "system", "content": system_prompt}]
        for msg in req.messages:
            api_messages.append({
                "role": msg.get("role", "user"),
                "content": msg.get("content", ""),
            })

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=api_messages,
            temperature=0.8,
            max_tokens=2000,
        )

        reply = response.choices[0].message.content or "죄송합니다, 응답을 생성하지 못했습니다."

        # Phase 판별
        msg_count = len([m for m in req.messages if m.get("role") == "user"])
        has_links = "saramin" in reply or "jobkorea" in reply or "linkedin" in reply or "wanted" in reply
        has_recommendation = "추천" in reply and ("직무" in reply or "직업" in reply or "분야" in reply)

        if has_links:
            phase = "recommending"
        elif msg_count >= 4 or has_recommendation:
            phase = "analyzing"
        else:
            phase = "exploring"

        return CareerChatResponse(reply=reply, phase=phase)

    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"커리어 챗 실패: {e}")
        raise HTTPException(500, f"AI 응답 생성 실패: {str(e)}")
