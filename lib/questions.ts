export type Question = {
  k: string;
  type: 'number' | 'text' | 'textarea' | 'choice';
  t: string;
  h?: string;
  ph?: string;
  o?: string[];
  // 객관식 빠른 선택지 (text/textarea에서만 사용)
  // - textarea: 토글 방식 (여러 개 선택 가능, ", "로 join). 자유 텍스트도 가능.
  // - text: 단일 선택 (클릭 시 값 교체). 자유 텍스트도 가능.
  quickPicks?: string[];
};

export const QUESTIONS: Question[] = [
  { k: 'age', type: 'number', t: 'How old are you?', h: 'Just the number — we use it to scale your plan timeline.', ph: 'e.g. 28' },
  { k: 'occupation', type: 'text', t: 'What do you do for work or school right now?', ph: "Marketing manager / Master's student" },
  { k: 'lifeSituation', type: 'choice', t: "What's your life situation?", o: ['Single', 'Dating, not serious', 'In a serious relationship', 'Married', 'Prefer not to say'] },
  { k: 'income', type: 'choice', t: 'Roughly, what do you earn a year?', o: ['Less than $30k / ₩40M', '$30k–60k / ₩40–80M', '$60k–100k / ₩80–130M', '$100k–150k / ₩130–200M', 'More than $150k / ₩200M+', 'No income right now', 'Prefer not to say'] },
  { k: 'savings', type: 'choice', t: 'How much have you saved?', h: 'Months of expenses (excluding retirement accounts).', o: ['Less than 3 months', '3–6 months', '6–12 months', '1–2 years', 'More than 2 years'] },
  { k: 'hoursPerWeek', type: 'choice', t: 'How many hours per week could you realistically spend on changing something?', h: 'Be honest — your plan is built around this.', o: ['Less than 2', '2–5', '5–10', '10–20', '20+'] },
  {
    k: 'stuck',
    type: 'textarea',
    t: "What's the one thing in your life that feels stuck right now?",
    h: 'Be specific. The plan is built from this. 해당하는 항목을 빠르게 골라도 되고, 직접 풀어 써도 됩니다.',
    ph: "예: 회사에서 매일 비슷한 일을 반복하며 의미를 잘 못 느껴요…",
    quickPicks: [
      '커리어 방향이 막막함',
      '일과 삶의 균형',
      '의미·목적이 없음',
      '건강·체력',
      '관계·가족 문제',
      '돈·경제적 불안',
      '자신감·자존감',
      '새 시작이 두려움',
    ],
  },
  {
    k: 'desiredChange',
    type: 'textarea',
    t: 'If you could change one specific thing in the next 90 days, what would it be?',
    h: '항목을 골라도 되고, 본인 표현으로 풀어 써도 됩니다.',
    ph: '예: 매주 한 번 영어 모임에 나가는 습관 만들기',
    quickPicks: [
      '새로운 일·역할 시도',
      '사이드 프로젝트 시작',
      '건강·운동 루틴',
      '한 가지 스킬 익히기',
      '관계·인맥 정리/확장',
      '재정적으로 한 걸음',
      '매일의 루틴 재설계',
      '큰 결정 내리기',
    ],
  },
  {
    k: 'tried',
    type: 'textarea',
    t: "What have you already tried that didn't work?",
    h: "이미 시도했지만 잘 안 된 것 — 같은 걸 또 권하지 않으려고요.",
    ph: '예: 6개월 동안 60군데 이직 지원해봤지만 결과가 없었어요…',
    quickPicks: [
      '이직 시도',
      '강의·자격증',
      '자기계발서 읽기',
      '멘토·코칭',
      '사이드 프로젝트',
      '운동·다이어트',
      '명상·저널링',
      '새 사람 만나기',
    ],
  },
  {
    k: 'strengths',
    type: 'textarea',
    t: 'What are you genuinely good at?',
    h: '강점 — 가장 자신 있는 것을 골라보세요.',
    ph: '예: 복잡한 자료를 누구나 이해할 만큼 쉽게 풀어주는 거…',
    quickPicks: [
      '분석·논리',
      '사람 다루기',
      '가르치기·설명',
      '글쓰기',
      '디자인·시각화',
      '끈기·집요함',
      '빠른 학습',
      '공감·경청',
    ],
  },
  {
    k: 'struggles',
    type: 'textarea',
    t: 'What do you struggle with?',
    h: '약점 — 거슬리거나 자꾸 막히는 부분.',
    ph: '예: 완벽하게 준비되지 않으면 시작을 못 해요…',
    quickPicks: [
      '거절을 못 함',
      '완벽주의',
      '미루기',
      '발표·말하기',
      '갈등 회피',
      '우선순위 정하기',
      '도움 청하기',
      '결정 못 내리기',
    ],
  },
  {
    k: 'childhoodDream',
    type: 'text',
    t: 'What did you want to be as a kid?',
    h: '한 가지만 골라도 되고, 직접 적어도 됩니다.',
    ph: '예: 디자이너',
    quickPicks: ['선생님', '의사', '과학자', '예술가', '운동선수', '사장님', '작가', '디자이너'],
  },
  {
    k: 'feelsAlive',
    type: 'textarea',
    t: 'What is a small thing that consistently makes you feel alive?',
    h: '평소 자신을 살아있게 하는 작은 것.',
    ph: '예: 새벽에 커피 한 잔과 노트북 켜기',
    quickPicks: [
      '새로운 곳 가기',
      '누군가에게 도움 되기',
      '깊은 대화',
      '운동·자연',
      '만들기·창작',
      '음식·요리',
      '책·영화',
      '혼자만의 시간',
    ],
  },
  {
    k: 'mbti',
    type: 'text',
    t: "What's your MBTI? (4 letters — guess if unsure)",
    ph: 'INFJ',
    quickPicks: [
      'ISTJ', 'ISFJ', 'INFJ', 'INTJ',
      'ISTP', 'ISFP', 'INFP', 'INTP',
      'ESTP', 'ESFP', 'ENFP', 'ENTP',
      'ESTJ', 'ESFJ', 'ENFJ', 'ENTJ',
    ],
  },
  { k: 'boldness', type: 'choice', t: 'How bold do you want this plan to be?', h: '1 = small incremental changes; 5 = leap', o: ['1 — Incremental', '2 — Modest', '3 — Balanced', '4 — Bold', '5 — Leap'] },
];
