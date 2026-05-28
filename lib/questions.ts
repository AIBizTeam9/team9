export type Question = {
  k: string;
  type: "number" | "text" | "textarea" | "choice";
  t: string;
  h?: string;
  ph?: string;
  o?: string[];
  // 객관식 빠른 선택지 (text/textarea에서만 사용)
  // - textarea: 토글 방식 (여러 개 선택 가능, ", "로 join). 자유 텍스트도 가능.
  // - text: 단일 선택 (클릭 시 값 교체). 자유 텍스트도 가능.
  quickPicks?: string[];
};

// 한국어 15문항 — main 카피.
export const QUESTIONS_KO: Question[] = [
  { k: "age", type: "number", t: "몇 살인가요?", h: "숫자만 — 플랜 타임라인의 호흡을 맞추는 데 쓰여요.", ph: "예: 28" },
  { k: "occupation", type: "text", t: "지금 무슨 일을 하거나 공부하고 있나요?", ph: "예: 마케팅 매니저 / 대학원생" },
  { k: "lifeSituation", type: "choice", t: "지금 어떤 관계 상태인가요?", o: ["싱글", "가볍게 만나는 중", "진지하게 만나는 중", "결혼", "말하고 싶지 않음"] },
  { k: "income", type: "choice", t: "연 소득은 대략 어느 정도인가요?", o: ["₩40M 미만 / <$30k", "₩40–80M / $30–60k", "₩80–130M / $60–100k", "₩130–200M / $100–150k", "₩200M+ / $150k+", "지금은 소득 없음", "말하고 싶지 않음"] },
  { k: "savings", type: "choice", t: "저축은 얼마나 모았나요?", h: "월 생활비 기준 (퇴직연금 등은 제외).", o: ["3개월 미만", "3–6개월", "6–12개월", "1–2년", "2년 이상"] },
  { k: "hoursPerWeek", type: "choice", t: "뭔가를 바꾸는 데 매주 현실적으로 쓸 수 있는 시간은?", h: "솔직하게 — 플랜이 이 시간 안에 들어가도록 설계됩니다.", o: ["2시간 미만", "2–5시간", "5–10시간", "10–20시간", "20시간 이상"] },
  {
    k: "stuck",
    type: "textarea",
    t: "지금 인생에서 한 가지 막혀 있다고 느끼는 게 뭔가요?",
    h: "구체적으로요. 플랜은 이 답변에서 출발합니다. 해당하는 항목을 빠르게 골라도 되고, 직접 풀어 써도 됩니다.",
    ph: "예: 회사에서 매일 비슷한 일을 반복하며 의미를 잘 못 느껴요…",
    quickPicks: ["커리어 방향이 막막함", "일과 삶의 균형", "의미·목적이 없음", "건강·체력", "관계·가족 문제", "돈·경제적 불안", "자신감·자존감", "새 시작이 두려움"],
  },
  {
    k: "desiredChange",
    type: "textarea",
    t: "앞으로 90일 동안 한 가지를 바꿀 수 있다면 뭘 바꾸고 싶나요?",
    h: "항목을 골라도 되고, 본인 표현으로 풀어 써도 됩니다.",
    ph: "예: 매주 한 번 영어 모임에 나가는 습관 만들기",
    quickPicks: ["새로운 일·역할 시도", "사이드 프로젝트 시작", "건강·운동 루틴", "한 가지 스킬 익히기", "관계·인맥 정리/확장", "재정적으로 한 걸음", "매일의 루틴 재설계", "큰 결정 내리기"],
  },
  {
    k: "tried",
    type: "textarea",
    t: "이미 시도해봤지만 잘 안 된 게 있나요?",
    h: "이미 시도했지만 잘 안 된 것 — 같은 걸 또 권하지 않으려고요.",
    ph: "예: 6개월 동안 60군데 이직 지원해봤지만 결과가 없었어요…",
    quickPicks: ["이직 시도", "강의·자격증", "자기계발서 읽기", "멘토·코칭", "사이드 프로젝트", "운동·다이어트", "명상·저널링", "새 사람 만나기"],
  },
  {
    k: "strengths",
    type: "textarea",
    t: "자기가 진짜 잘하는 건 뭔가요?",
    h: "강점 — 가장 자신 있는 것을 골라보세요.",
    ph: "예: 복잡한 자료를 누구나 이해할 만큼 쉽게 풀어주는 거…",
    quickPicks: ["분석·논리", "사람 다루기", "가르치기·설명", "글쓰기", "디자인·시각화", "끈기·집요함", "빠른 학습", "공감·경청"],
  },
  {
    k: "struggles",
    type: "textarea",
    t: "뭐가 자꾸 힘든가요?",
    h: "약점 — 거슬리거나 자꾸 막히는 부분.",
    ph: "예: 완벽하게 준비되지 않으면 시작을 못 해요…",
    quickPicks: ["거절을 못 함", "완벽주의", "미루기", "발표·말하기", "갈등 회피", "우선순위 정하기", "도움 청하기", "결정 못 내리기"],
  },
  {
    k: "childhoodDream",
    type: "text",
    t: "어릴 때는 뭐가 되고 싶었나요?",
    h: "한 가지만 골라도 되고, 직접 적어도 됩니다.",
    ph: "예: 디자이너",
    quickPicks: ["선생님", "의사", "과학자", "예술가", "운동선수", "사장님", "작가", "디자이너"],
  },
  {
    k: "feelsAlive",
    type: "textarea",
    t: "꾸준히 살아있다고 느끼게 해주는 작은 게 있나요?",
    h: "평소 자신을 살아있게 하는 작은 것.",
    ph: "예: 새벽에 커피 한 잔과 노트북 켜기",
    quickPicks: ["새로운 곳 가기", "누군가에게 도움 되기", "깊은 대화", "운동·자연", "만들기·창작", "음식·요리", "책·영화", "혼자만의 시간"],
  },
  {
    k: "mbti",
    type: "text",
    t: "MBTI는 뭔가요? (4글자 — 확실하지 않으면 짐작해도 OK)",
    ph: "INFJ",
    quickPicks: ["ISTJ", "ISFJ", "INFJ", "INTJ", "ISTP", "ISFP", "INFP", "INTP", "ESTP", "ESFP", "ENFP", "ENTP", "ESTJ", "ESFJ", "ENFJ", "ENTJ"],
  },
  { k: "boldness", type: "choice", t: "플랜이 얼마나 과감했으면 좋겠나요?", h: "1 = 작은 점진적 변화 / 5 = 도약", o: ["1 — 점진적", "2 — 적당히", "3 — 균형", "4 — 과감하게", "5 — 도약"] },
];

// English 15 questions — t/h/ph는 a184f6c^ (Korean migration 이전) 기준,
// o/quickPicks는 한국어판에서 best-effort 번역.
export const QUESTIONS_EN: Question[] = [
  { k: "age", type: "number", t: "How old are you?", h: "Just the number — we use it to scale your plan timeline.", ph: "e.g. 28" },
  { k: "occupation", type: "text", t: "What do you do for work or school right now?", ph: "Marketing manager / Master's student" },
  { k: "lifeSituation", type: "choice", t: "What's your life situation?", o: ["Single", "Dating, not serious", "In a serious relationship", "Married", "Prefer not to say"] },
  { k: "income", type: "choice", t: "Roughly, what do you earn a year?", o: ["Less than $30k / <₩40M", "$30k–60k / ₩40–80M", "$60k–100k / ₩80–130M", "$100k–150k / ₩130–200M", "More than $150k / ₩200M+", "No income right now", "Prefer not to say"] },
  { k: "savings", type: "choice", t: "How much have you saved?", h: "Months of expenses (excluding retirement accounts).", o: ["Less than 3 months", "3–6 months", "6–12 months", "1–2 years", "More than 2 years"] },
  { k: "hoursPerWeek", type: "choice", t: "How many hours per week could you realistically spend on changing something?", h: "Be honest — your plan is built around this.", o: ["Less than 2", "2–5", "5–10", "10–20", "20+"] },
  {
    k: "stuck",
    type: "textarea",
    t: "What's the one thing in your life that feels stuck right now?",
    h: "Be specific. The plan is built from this. Tap a chip below or write your own.",
    ph: "e.g. I keep doing the same work each day and can't feel any meaning in it…",
    quickPicks: ["Stuck on career direction", "Work-life balance", "Lacking meaning / purpose", "Health / energy", "Relationships / family", "Money / financial anxiety", "Confidence / self-worth", "Fear of starting over"],
  },
  {
    k: "desiredChange",
    type: "textarea",
    t: "If you could change one specific thing in the next 90 days, what would it be?",
    h: "Tap a chip or describe it in your own words.",
    ph: "e.g. Build a habit of going to a weekly English meetup",
    quickPicks: ["Try a new job / role", "Start a side project", "Build a health / fitness routine", "Learn one skill", "Reshape relationships / network", "Take a financial step", "Redesign daily routine", "Make a big decision"],
  },
  {
    k: "tried",
    type: "textarea",
    t: "What have you already tried that didn't quite work?",
    h: "So we don't recommend the same thing twice.",
    ph: "e.g. I sent 60 job applications in 6 months and got nowhere…",
    quickPicks: ["Job-switch attempts", "Courses / certifications", "Self-help books", "Mentor / coaching", "Side project", "Exercise / diet", "Meditation / journaling", "Meeting new people"],
  },
  {
    k: "strengths",
    type: "textarea",
    t: "What are you actually good at?",
    h: "Strengths — pick what you feel most confident about.",
    ph: "e.g. Breaking down complex material so anyone can follow it…",
    quickPicks: ["Analysis / logic", "Working with people", "Teaching / explaining", "Writing", "Design / visualization", "Persistence / grit", "Fast learner", "Empathy / listening"],
  },
  {
    k: "struggles",
    type: "textarea",
    t: "What keeps tripping you up?",
    h: "Weak spots — the things that nag or stall you.",
    ph: "e.g. I can't start until everything feels perfect…",
    quickPicks: ["Trouble saying no", "Perfectionism", "Procrastination", "Public speaking", "Conflict avoidance", "Setting priorities", "Asking for help", "Indecisiveness"],
  },
  {
    k: "childhoodDream",
    type: "text",
    t: "What did you want to be when you grew up?",
    h: "Pick one or write your own.",
    ph: "e.g. Designer",
    quickPicks: ["Teacher", "Doctor", "Scientist", "Artist", "Athlete", "Entrepreneur", "Writer", "Designer"],
  },
  {
    k: "feelsAlive",
    type: "textarea",
    t: "What's a small thing that consistently makes you feel alive?",
    h: "The little thing that keeps you feeling alive day to day.",
    ph: "e.g. A quiet coffee and laptop in the early morning",
    quickPicks: ["Going somewhere new", "Helping someone", "Deep conversations", "Exercise / nature", "Making / creating", "Food / cooking", "Books / films", "Time alone"],
  },
  {
    k: "mbti",
    type: "text",
    t: "What's your MBTI? (4 letters — best guess is fine)",
    ph: "INFJ",
    quickPicks: ["ISTJ", "ISFJ", "INFJ", "INTJ", "ISTP", "ISFP", "INFP", "INTP", "ESTP", "ESFP", "ENFP", "ENTP", "ESTJ", "ESFJ", "ENFJ", "ENTJ"],
  },
  { k: "boldness", type: "choice", t: "How bold should your plan be?", h: "1 = small incremental change / 5 = a leap", o: ["1 — Incremental", "2 — Moderate", "3 — Balanced", "4 — Bold", "5 — Leap"] },
];

// Hard invariant — 두 사전이 같은 key 순서·길이를 가져야 한다.
// 위반 시 runtime 호출자(quiz/page.tsx)가 잘못된 question을 보낼 수 있음.
if (process.env.NODE_ENV !== "production") {
  if (QUESTIONS_KO.length !== QUESTIONS_EN.length) {
    throw new Error("QUESTIONS_KO and QUESTIONS_EN length mismatch");
  }
  for (let i = 0; i < QUESTIONS_KO.length; i++) {
    if (QUESTIONS_KO[i].k !== QUESTIONS_EN[i].k) {
      throw new Error(
        `QUESTIONS key mismatch at index ${i}: ${QUESTIONS_KO[i].k} vs ${QUESTIONS_EN[i].k}`,
      );
    }
  }
}

export function getQuestions(locale: "ko" | "en"): Question[] {
  return locale === "en" ? QUESTIONS_EN : QUESTIONS_KO;
}

// Legacy export — 다른 모듈이 import QUESTIONS 하는 경우 호환.
// 새 코드는 getQuestions(locale)을 써야 한다.
export const QUESTIONS: Question[] = QUESTIONS_KO;
