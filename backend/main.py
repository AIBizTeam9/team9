"""Next Step in Life — Backend API Server"""

import os
import logging
from typing import Optional
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="Next Step in Life API")
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
    return {"status": "ok", "service": "next-step-in-life"}


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


# ===== 외부 데이터 허브 (Resources) =====

class ResourceItem(BaseModel):
    id: str
    category: str
    title: str
    description: str
    url: str
    source: str
    tags: list[str]
    icon: str

class ResourcesResponse(BaseModel):
    resources: list[ResourceItem]
    total: int

RESOURCE_DATA: list[dict] = [
    # ── 채용 정보 ──
    {"id": "job-01", "category": "jobs", "title": "사람인 채용 검색", "description": "국내 최대 취업 플랫폼. 직무별 채용공고 검색 및 기업 리뷰 제공.", "url": "https://www.saramin.co.kr", "source": "사람인", "tags": ["취업", "채용공고", "기업리뷰"], "icon": "💼"},
    {"id": "job-02", "category": "jobs", "title": "잡코리아 채용 검색", "description": "직무·지역·연봉별 맞춤 채용공고 탐색. 이력서 관리 및 공채 알림.", "url": "https://www.jobkorea.co.kr", "source": "잡코리아", "tags": ["취업", "공채", "이력서"], "icon": "📋"},
    {"id": "job-03", "category": "jobs", "title": "원티드 커리어", "description": "IT/스타트업 채용 특화. 합격 시 추천 보상금 제도 운영.", "url": "https://www.wanted.co.kr", "source": "원티드", "tags": ["IT", "스타트업", "추천채용"], "icon": "🚀"},
    {"id": "job-04", "category": "jobs", "title": "LinkedIn Jobs (한국)", "description": "글로벌 채용 네트워크. 외국계 기업 및 글로벌 포지션 탐색.", "url": "https://www.linkedin.com/jobs/search/?location=South%20Korea", "source": "LinkedIn", "tags": ["글로벌", "외국계", "네트워킹"], "icon": "🌐"},
    {"id": "job-05", "category": "jobs", "title": "로켓펀치 채용", "description": "스타트업·벤처 채용 전문. 기업 문화와 팀 정보 함께 제공.", "url": "https://www.rocketpunch.com/jobs", "source": "로켓펀치", "tags": ["스타트업", "벤처", "기업문화"], "icon": "🎯"},
    {"id": "job-06", "category": "jobs", "title": "프로그래머스 채용", "description": "개발자 채용 + 코딩 테스트 플랫폼. 기술 역량 기반 매칭.", "url": "https://programmers.co.kr/job", "source": "프로그래머스", "tags": ["개발자", "코딩테스트", "기술면접"], "icon": "💻"},

    # ── 강의/교육 ──
    {"id": "edu-01", "category": "courses", "title": "인프런", "description": "국내 최대 온라인 강의 플랫폼. 개발, 데이터, 디자인, 비즈니스 강의.", "url": "https://www.inflearn.com", "source": "인프런", "tags": ["온라인강의", "개발", "데이터"], "icon": "🎓"},
    {"id": "edu-02", "category": "courses", "title": "Coursera", "description": "세계 유수 대학 강의 무료 수강. 수료증·학위 과정 제공.", "url": "https://www.coursera.org", "source": "Coursera", "tags": ["글로벌", "대학강의", "수료증"], "icon": "🌍"},
    {"id": "edu-03", "category": "courses", "title": "Udemy", "description": "실무 중심 온라인 강의. 할인 이벤트가 잦아 가성비 좋음.", "url": "https://www.udemy.com", "source": "Udemy", "tags": ["실무", "가성비", "다양한분야"], "icon": "📺"},
    {"id": "edu-04", "category": "courses", "title": "노마드코더", "description": "프로젝트 기반 개발 교육. 무료 챌린지로 시작 가능.", "url": "https://nomadcoders.co", "source": "노마드코더", "tags": ["프로젝트", "개발", "무료챌린지"], "icon": "🏝️"},
    {"id": "edu-05", "category": "courses", "title": "패스트캠퍼스", "description": "실무 역량 부트캠프. 데이터·AI·개발·비즈니스 집중 교육.", "url": "https://fastcampus.co.kr", "source": "패스트캠퍼스", "tags": ["부트캠프", "AI", "실무역량"], "icon": "⚡"},
    {"id": "edu-06", "category": "courses", "title": "K-MOOC", "description": "한국형 무크. 국내 대학 강의 무료 수강. 학점 인정 과정 일부 포함.", "url": "https://www.kmooc.kr", "source": "K-MOOC", "tags": ["무료", "대학강의", "학점인정"], "icon": "🇰🇷"},

    # ── 추천 도서 ──
    {"id": "book-01", "category": "books", "title": "나는 4시간만 일한다 (팀 페리스)", "description": "라이프스타일 디자인의 바이블. 시간과 장소에 구애받지 않는 일의 방식.", "url": "https://search.shopping.naver.com/book/catalog/32441636050", "source": "네이버 도서", "tags": ["라이프스타일", "생산성", "자유"], "icon": "⏰"},
    {"id": "book-02", "category": "books", "title": "린 스타트업 (에릭 리스)", "description": "빠른 실험과 검증으로 사업 아이디어를 발전시키는 방법론.", "url": "https://search.shopping.naver.com/book/catalog/32436279050", "source": "네이버 도서", "tags": ["창업", "린방법론", "실험"], "icon": "🔄"},
    {"id": "book-03", "category": "books", "title": "디자인 유어 라이프 (빌 버넷)", "description": "스탠포드 인기 강의. 디자인 씽킹으로 인생 설계하기.", "url": "https://search.shopping.naver.com/book/catalog/32436038634", "source": "네이버 도서", "tags": ["인생설계", "디자인씽킹", "자기탐색"], "icon": "✏️"},
    {"id": "book-04", "category": "books", "title": "아주 작은 습관의 힘 (제임스 클리어)", "description": "1%의 변화가 만드는 극적 결과. 습관 형성의 과학적 접근.", "url": "https://search.shopping.naver.com/book/catalog/32441565785", "source": "네이버 도서", "tags": ["습관", "자기계발", "행동변화"], "icon": "🔬"},
    {"id": "book-05", "category": "books", "title": "일의 격 (신수정)", "description": "성과를 내는 프로페셔널의 일하는 방식과 커리어 전략.", "url": "https://search.shopping.naver.com/book/catalog/32466935849", "source": "네이버 도서", "tags": ["커리어", "프로페셔널", "성과"], "icon": "📐"},

    # ── 커뮤니티 ──
    {"id": "com-01", "category": "communities", "title": "디스콰이엇", "description": "사이드 프로젝트 & 스타트업 커뮤니티. 팀빌딩과 아이디어 공유.", "url": "https://disquiet.io", "source": "디스콰이엇", "tags": ["사이드프로젝트", "팀빌딩", "스타트업"], "icon": "💡"},
    {"id": "com-02", "category": "communities", "title": "OKKY", "description": "국내 최대 개발자 커뮤니티. 기술 Q&A, 커리어 상담, 채용 정보.", "url": "https://okky.kr", "source": "OKKY", "tags": ["개발자", "QnA", "커리어"], "icon": "🧑‍💻"},
    {"id": "com-03", "category": "communities", "title": "커리어리", "description": "직장인 커리어 성장 커뮤니티. 직무 인사이트와 네트워킹.", "url": "https://careerly.co.kr", "source": "커리어리", "tags": ["직장인", "인사이트", "네트워킹"], "icon": "📈"},
    {"id": "com-04", "category": "communities", "title": "블라인드", "description": "직장인 익명 커뮤니티. 기업 내부 정보와 연봉 공유.", "url": "https://www.teamblind.com/kr", "source": "블라인드", "tags": ["익명", "기업정보", "연봉"], "icon": "🕶️"},
    {"id": "com-05", "category": "communities", "title": "Meetup (한국)", "description": "오프라인 모임 플랫폼. 관심사 기반 네트워킹 이벤트.", "url": "https://www.meetup.com/ko-KR/find/?location=kr--Seoul", "source": "Meetup", "tags": ["오프라인", "모임", "네트워킹"], "icon": "🤝"},

    # ── 트렌드 ──
    {"id": "trend-01", "category": "trends", "title": "2025 한국 직업 전망 (한국고용정보원)", "description": "직종별 고용 전망과 유망 직업 분석 리포트.", "url": "https://www.keis.or.kr", "source": "한국고용정보원", "tags": ["고용전망", "유망직업", "통계"], "icon": "📊"},
    {"id": "trend-02", "category": "trends", "title": "State of AI Report", "description": "AI 산업 최신 동향 연례 리포트. 기술 트렌드와 투자 현황.", "url": "https://www.stateof.ai", "source": "State of AI", "tags": ["AI", "트렌드", "산업동향"], "icon": "🤖"},
    {"id": "trend-03", "category": "trends", "title": "잡플래닛 기업 리뷰", "description": "기업별 연봉, 복지, 워라밸, 승진 기회 평가 데이터.", "url": "https://www.jobplanet.co.kr", "source": "잡플래닛", "tags": ["기업리뷰", "연봉", "워라밸"], "icon": "⭐"},
    {"id": "trend-04", "category": "trends", "title": "LinkedIn 2025 인사이트", "description": "글로벌 노동시장 트렌드. 수요 급증 스킬과 산업 변화.", "url": "https://www.linkedin.com/pulse/topics/home/", "source": "LinkedIn", "tags": ["글로벌트렌드", "스킬수요", "노동시장"], "icon": "🌐"},
    {"id": "trend-05", "category": "trends", "title": "사람인 HR 인사이트", "description": "채용 시장 분석, 연봉 트렌드, 직무별 취업 가이드.", "url": "https://www.saramin.co.kr/zf_user/help/live/category-main", "source": "사람인", "tags": ["채용시장", "연봉트렌드", "취업가이드"], "icon": "📰"},
]


@app.get("/api/resources", response_model=ResourcesResponse)
def get_resources(
    category: Optional[str] = Query(None, description="카테고리 필터: jobs, courses, books, communities, trends"),
    keyword: Optional[str] = Query(None, description="키워드 검색"),
):
    """외부 연동 데이터를 카테고리/키워드로 필터링해서 반환"""
    results = RESOURCE_DATA

    if category:
        results = [r for r in results if r["category"] == category]

    if keyword:
        kw = keyword.lower()
        results = [
            r for r in results
            if kw in r["title"].lower()
            or kw in r["description"].lower()
            or any(kw in t.lower() for t in r["tags"])
        ]

    return ResourcesResponse(
        resources=[ResourceItem(**r) for r in results],
        total=len(results),
    )
