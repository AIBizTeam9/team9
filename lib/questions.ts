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
  // 한 화면에 묶어 같이 표시. 같은 group 값의 연속된 질문들이 한 화면에 함께 보임.
  // 피드백 #15/#32: "너무 많은 클릭" — 짧은 객관식/숫자/단답형은 그룹핑.
  // /api/clarify follow-up이 동작하는 textarea 질문은 그룹핑하지 않음 (개별 화면 유지).
  group?: string;
};

export const QUESTIONS: Question[] = [
  { k: 'age', type: 'number', t: '몇 살인가요?', h: '숫자만 — 플랜 타임라인의 호흡을 맞추는 데 쓰여요.', ph: '예: 28', group: 'basic' },
  { k: 'occupation', type: 'text', t: '지금 무슨 일을 하거나 공부하고 있나요?', ph: '예: 마케팅 매니저 / 대학원생', group: 'basic' },
  { k: 'lifeSituation', type: 'choice', t: '지금 어떤 관계 상태인가요?', o: ['싱글', '가볍게 만나는 중', '진지하게 만나는 중', '결혼', '말하고 싶지 않음'], group: 'basic' },
  { k: 'income', type: 'choice', t: '연 소득은 대략 어느 정도인가요?', o: ['₩40M 미만 / <$30k', '₩40–80M / $30–60k', '₩80–130M / $60–100k', '₩130–200M / $100–150k', '₩200M+ / $150k+', '지금은 소득 없음', '말하고 싶지 않음'], group: 'commit' },
  { k: 'savings', type: 'choice', t: '저축은 얼마나 모았나요?', h: '월 생활비 기준 (퇴직연금 등은 제외).', o: ['3개월 미만', '3–6개월', '6–12개월', '1–2년', '2년 이상'], group: 'commit' },
  { k: 'hoursPerWeek', type: 'choice', t: '뭔가를 바꾸는 데 매주 현실적으로 쓸 수 있는 시간은?', h: '솔직하게 — 플랜이 이 시간 안에 들어가도록 설계됩니다.', o: ['2시간 미만', '2–5시간', '5–10시간', '10–20시간', '20시간 이상'], group: 'commit' },
  {
    k: 'stuck',
    type: 'textarea',
    t: '지금 인생에서 한 가지 막혀 있다고 느끼는 게 뭔가요?',
    h: '구체적으로요. 플랜은 이 답변에서 출발합니다. 해당하는 항목을 빠르게 골라도 되고, 직접 풀어 써도 됩니다.',
    ph: '예: 회사에서 매일 비슷한 일을 반복하며 의미를 잘 못 느껴요…',
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
    t: '앞으로 90일 동안 한 가지를 바꿀 수 있다면 뭘 바꾸고 싶나요?',
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
    t: '이미 시도해봤지만 잘 안 된 게 있나요?',
    h: '이미 시도했지만 잘 안 된 것 — 같은 걸 또 권하지 않으려고요.',
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
    t: '자기가 진짜 잘하는 건 뭔가요?',
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
    t: '뭐가 자꾸 힘든가요?',
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
    t: '어릴 때는 뭐가 되고 싶었나요?',
    h: '한 가지만 골라도 되고, 직접 적어도 됩니다.',
    ph: '예: 디자이너',
    quickPicks: ['선생님', '의사', '과학자', '예술가', '운동선수', '사장님', '작가', '디자이너'],
  },
  {
    k: 'feelsAlive',
    type: 'textarea',
    t: '꾸준히 살아있다고 느끼게 해주는 작은 게 있나요?',
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
    t: 'MBTI는 뭔가요? (4글자 — 확실하지 않으면 짐작해도 OK)',
    ph: 'INFJ',
    quickPicks: [
      'ISTJ', 'ISFJ', 'INFJ', 'INTJ',
      'ISTP', 'ISFP', 'INFP', 'INTP',
      'ESTP', 'ESFP', 'ENFP', 'ENTP',
      'ESTJ', 'ESFJ', 'ENFJ', 'ENTJ',
    ],
    group: 'wrap',
  },
  { k: 'boldness', type: 'choice', t: '플랜이 얼마나 과감했으면 좋겠나요?', h: '1 = 작은 점진적 변화 / 5 = 도약', o: ['1 — 점진적', '2 — 적당히', '3 — 균형', '4 — 과감하게', '5 — 도약'], group: 'wrap' },
];

// 동일 group 값을 가진 연속된 질문들을 한 화면(screen)으로 묶는다.
// group이 없으면 단독 화면. textarea의 /api/clarify 흐름을 보존하려고
// 깊은 textarea들은 group을 안 줘서 단독으로 남는다.
export type Screen = { start: number; end: number; questions: Question[] };

export const SCREENS: Screen[] = (() => {
  const out: Screen[] = [];
  let i = 0;
  while (i < QUESTIONS.length) {
    const q0 = QUESTIONS[i];
    let end = i;
    if (q0.group) {
      while (end + 1 < QUESTIONS.length && QUESTIONS[end + 1].group === q0.group) {
        end += 1;
      }
    }
    out.push({ start: i, end, questions: QUESTIONS.slice(i, end + 1) });
    i = end + 1;
  }
  return out;
})();

// 주어진 question index가 속한 screen 인덱스를 찾는다.
export function screenIndexForQuestion(qIndex: number): number {
  for (let s = 0; s < SCREENS.length; s += 1) {
    const sc = SCREENS[s];
    if (qIndex >= sc.start && qIndex <= sc.end) return s;
  }
  return 0;
}
