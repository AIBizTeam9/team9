import { NextRequest, NextResponse } from "next/server";

interface MarketDataItem {
  id: string;
  category: string;
  title: string;
  summary: string;
  source: string;
  sourceUrl: string;
  tags: string[];
  updatedAt: string;
  icon: string;
}

const MARKET_DATA: MarketDataItem[] = [
  // 기술 트렌드
  { id: "tech-01", category: "tech", title: "생성형 AI 시장 급성장", summary: "2025년 글로벌 생성형 AI 시장 규모가 전년 대비 2배 이상 성장. 기업 도입률 급증.", source: "McKinsey", sourceUrl: "https://www.mckinsey.com/capabilities/quantumblack/our-insights/the-state-of-ai", tags: ["AI", "생성형AI", "시장규모"], updatedAt: "2025-04", icon: "🤖" },
  { id: "tech-02", category: "tech", title: "클라우드 네이티브 전환 가속", summary: "기업 80% 이상이 클라우드 네이티브 아키텍처 도입 추진. 쿠버네티스 표준화.", source: "Gartner", sourceUrl: "https://www.gartner.com/en/information-technology/insights/cloud-strategy", tags: ["클라우드", "쿠버네티스", "인프라"], updatedAt: "2025-03", icon: "☁️" },
  { id: "tech-03", category: "tech", title: "사이버보안 인력 수요 폭증", summary: "글로벌 사이버보안 인력 부족 400만명 돌파. 제로 트러스트 아키텍처 수요 급증.", source: "ISC²", sourceUrl: "https://www.isc2.org/Research/Workforce-Study", tags: ["보안", "제로트러스트", "인력부족"], updatedAt: "2025-03", icon: "🔒" },
  { id: "tech-04", category: "tech", title: "로우코드/노코드 플랫폼 확산", summary: "비개발자의 앱 개발 참여 확대. 시민 개발자(Citizen Developer) 개념 보편화.", source: "Forrester", sourceUrl: "https://www.forrester.com/research/low-code-development-platforms/", tags: ["로우코드", "노코드", "시민개발자"], updatedAt: "2025-02", icon: "🧩" },

  // 산업 동향
  { id: "ind-01", category: "industry", title: "반도체 산업 재편", summary: "글로벌 반도체 공급망 재편. 한국 메모리 반도체 수출 30% 증가. AI 칩 수요 견인.", source: "한국무역협회", sourceUrl: "https://www.kita.net", tags: ["반도체", "수출", "공급망"], updatedAt: "2025-04", icon: "💾" },
  { id: "ind-02", category: "industry", title: "헬스케어 디지털 전환", summary: "원격진료 확대, AI 진단 보조 도입. 디지털 헬스케어 시장 연 25% 성장.", source: "한국보건산업진흥원", sourceUrl: "https://www.khidi.or.kr", tags: ["헬스케어", "원격진료", "디지털전환"], updatedAt: "2025-03", icon: "🏥" },
  { id: "ind-03", category: "industry", title: "핀테크 규제혁신", summary: "마이데이터 2.0 시행. 오픈뱅킹 확대로 핀테크 스타트업 성장 가속.", source: "금융위원회", sourceUrl: "https://www.fsc.go.kr", tags: ["핀테크", "마이데이터", "오픈뱅킹"], updatedAt: "2025-04", icon: "💳" },
  { id: "ind-04", category: "industry", title: "이커머스 라이브 커머스 성장", summary: "라이브 커머스 시장 규모 10조원 돌파. 숏폼 영상 기반 쇼핑 경험 확대.", source: "통계청", sourceUrl: "https://kostat.go.kr", tags: ["이커머스", "라이브커머스", "숏폼"], updatedAt: "2025-03", icon: "🛒" },

  // 연봉 정보
  { id: "sal-01", category: "salary", title: "소프트웨어 개발자 연봉 동향", summary: "신입 4,000~5,000만원, 경력 3년 5,500~7,000만원, 시니어 8,000만원+. AI/ML 직군 프리미엄.", source: "잡플래닛", sourceUrl: "https://www.jobplanet.co.kr", tags: ["개발자", "연봉", "IT"], updatedAt: "2025-04", icon: "💻" },
  { id: "sal-02", category: "salary", title: "데이터 직군 연봉 현황", summary: "데이터 엔지니어 평균 6,200만원, 데이터 사이언티스트 6,800만원. ML엔지니어 최고 1.2억.", source: "원티드", sourceUrl: "https://www.wanted.co.kr", tags: ["데이터", "ML", "연봉"], updatedAt: "2025-03", icon: "📊" },
  { id: "sal-03", category: "salary", title: "기획·마케팅 연봉 현황", summary: "PM/PO 경력 5년 6,000~8,000만원. 그로스 마케터 수요 증가로 연봉 상승세.", source: "사람인", sourceUrl: "https://www.saramin.co.kr", tags: ["기획", "마케팅", "PM"], updatedAt: "2025-03", icon: "📝" },
  { id: "sal-04", category: "salary", title: "대기업 vs 스타트업 보상 비교", summary: "대기업 안정적 기본급, 스타트업 스톡옵션 포함 시 역전 가능. 시리즈B+ 평균 120% 인상.", source: "블라인드", sourceUrl: "https://www.teamblind.com/kr", tags: ["대기업", "스타트업", "스톡옵션"], updatedAt: "2025-04", icon: "⚖️" },

  // 수요 스킬
  { id: "skill-01", category: "skills", title: "2025 가장 수요 높은 기술 스킬", summary: "Python, TypeScript, Kubernetes, Terraform, Prompt Engineering이 채용공고 키워드 TOP5.", source: "LinkedIn", sourceUrl: "https://www.linkedin.com/pulse/topics/home/", tags: ["Python", "TypeScript", "채용"], updatedAt: "2025-04", icon: "🛠️" },
  { id: "skill-02", category: "skills", title: "소프트 스킬 중요성 증가", summary: "AI 시대에 커뮤니케이션, 문제 해결, 비판적 사고력 등 소프트 스킬 가치 재조명.", source: "World Economic Forum", sourceUrl: "https://www.weforum.org/publications/the-future-of-jobs-report-2025/", tags: ["소프트스킬", "커뮤니케이션", "문제해결"], updatedAt: "2025-01", icon: "🤝" },
  { id: "skill-03", category: "skills", title: "AI 리터러시 필수화", summary: "비기술 직군에서도 AI 도구 활용 능력 필수. 프롬프트 엔지니어링 교육 수요 급증.", source: "한국고용정보원", sourceUrl: "https://www.keis.or.kr", tags: ["AI리터러시", "프롬프트", "교육"], updatedAt: "2025-03", icon: "🧠" },
  { id: "skill-04", category: "skills", title: "데이터 분석 역량 범용화", summary: "마케터, 기획자, HR 등 비개발 직군에서 SQL, 태블로 활용 요구 증가.", source: "잡코리아", sourceUrl: "https://www.jobkorea.co.kr", tags: ["데이터분석", "SQL", "태블로"], updatedAt: "2025-02", icon: "📈" },

  // 직업 전망
  { id: "out-01", category: "outlook", title: "AI/ML 엔지니어 수요 전망", summary: "향후 5년간 AI 관련 일자리 연 40% 성장 예상. 한국 AI 인력 수요 2027년까지 5만명 추가.", source: "한국고용정보원", sourceUrl: "https://www.keis.or.kr", tags: ["AI", "ML", "고용전망"], updatedAt: "2025-04", icon: "🤖" },
  { id: "out-02", category: "outlook", title: "친환경·ESG 관련 직종 확대", summary: "탄소중립 정책에 따라 ESG 컨설턴트, 탄소거래 전문가 등 신직종 부상.", source: "고용노동부", sourceUrl: "https://www.moel.go.kr", tags: ["ESG", "탄소중립", "신직종"], updatedAt: "2025-03", icon: "🌱" },
  { id: "out-03", category: "outlook", title: "고령화 사회 돌봄 직종 성장", summary: "시니어 케어, 재활 로봇, 원격 돌봄 서비스 분야 인력 수요 연 15% 증가 예상.", source: "보건복지부", sourceUrl: "https://www.mohw.go.kr", tags: ["고령화", "돌봄", "시니어케어"], updatedAt: "2025-02", icon: "🏠" },
  { id: "out-04", category: "outlook", title: "콘텐츠 크리에이터 직업화", summary: "1인 미디어 시장 확대로 영상 편집, 숏폼 제작, 메타버스 콘텐츠 크리에이터 수요 증가.", source: "한국콘텐츠진흥원", sourceUrl: "https://www.kocca.kr", tags: ["크리에이터", "콘텐츠", "메타버스"], updatedAt: "2025-03", icon: "🎬" },
];

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const category = searchParams.get("category");
  const keyword = searchParams.get("keyword");

  let results: MarketDataItem[] = MARKET_DATA;

  if (category) {
    results = results.filter((r) => r.category === category);
  }

  if (keyword) {
    const kw = keyword.toLowerCase();
    results = results.filter(
      (r) =>
        r.title.toLowerCase().includes(kw) ||
        r.summary.toLowerCase().includes(kw) ||
        r.tags.some((t) => t.toLowerCase().includes(kw)),
    );
  }

  return NextResponse.json({ items: results, total: results.length });
}
