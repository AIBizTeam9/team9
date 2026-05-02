# 음성 대화 통합 가이드

각 팀원이 담당 페이지에 **음성으로 LLM과 대화하는 기능**을 붙이기 위한 가이드입니다.
공통 인프라는 동근이 만들어 두었습니다 — 여러분은 **시스템 프롬프트와 첫 멘트만** 정의하면 됩니다.

---

## 동작 개요

1. 사용자가 "음성 대화 시작" 버튼을 누름
2. AI가 먼저 한 마디 던짐 (TTS)
3. 사용자가 마이크 버튼을 누르고 말함 (STT)
4. AI가 듣고 응답 (Claude API → TTS)
5. 4번이 반복

브라우저 Web Speech API를 사용하므로 **Chrome / Edge**에서 동작합니다. Safari/Firefox는 STT가 제한적입니다.

---

## 테스트 환경 (네비에 노출 안 됨)

`/lab/voice` — 프리셋 페르소나 5종 + 커스텀 프롬프트 빌더가 있는 실험실.
직접 말 걸어 본 뒤 마음에 들면 그대로 본인 페이지에 박을 코드 스니펫이 자동 생성됩니다.

`/lab` — 모든 실험 목록 (현재는 음성 대화만).

---

## 통합 방법 (Claude Code에 붙여넣기)

자기 담당 페이지(`app/quiz/page.tsx`, `app/debate/page.tsx`, `app/plan/page.tsx`, `app/rolemodel/page.tsx` 등)에서 Claude Code에 다음 프롬프트를 붙여넣으세요. 두 군데(`<여기>`)만 본인 컨텍스트에 맞게 수정하면 됩니다.

```text
내 페이지에 음성 대화 기능을 추가해줘.

공통 컴포넌트는 이미 만들어져 있어:
- 컴포넌트: components/voice-chat.tsx (기본 export)
- API: /api/voice-chat (POST, { systemPrompt, messages })
- 라이브러리: lib/voice.ts

내가 해야 할 일은 내 페이지에 <VoiceChat /> 컴포넌트를 임포트해서 박는 것.
필수 props 두 개만 지정하면 됨:
- systemPrompt: 페르소나/역할/말투 정의
- initialMessage: AI가 먼저 던지는 첫 멘트

선택 props:
- speakerLabel: 화면에 표시할 이름 (예: "롤모델 · 일론 머스크")
- accentColor: 'var(--warm)' | 'var(--blue)' | 'var(--green)' 중 하나
- serverVoice: OpenAI TTS 보이스 — nova | shimmer | coral | sage | alloy | ballad | echo | onyx | ash | fable
- speed: 발화 속도 0.7 ~ 1.3 (기본 1.0)
- bargeIn: AI 발화 중에 사용자가 말하면 자동으로 끊고 듣기 모드로 전환 (기본 true)

내부 동작:
- LLM 응답은 SSE 스트림으로 받아 문장 단위로 잘라 TTS에 즉시 흘림 — 첫 문장이 거의 즉시 들리기 시작.
- AudioContext로 마이크와 출력 음성을 분석해 막대형 파형을 실시간 시각화.
- VAD(Voice Activity Detection)로 사용자가 말을 시작하면 AI 발화를 즉시 끊고 SR(SpeechRecognition)으로 듣기.

이 페이지의 맥락은:
<여기에 페이지 목적 한 줄로 — 예: "사용자의 90일 플랜을 같이 짜는 미래의 자아">

페르소나/말투/대화 목표는:
<여기에 자세한 인격 정의 3~5줄 — 한국어, 반말/존댓말 명시>

이걸 systemPrompt와 initialMessage로 만들고, 내 페이지의 적절한 자리(보통 결과 카드 아래나 최하단)에 끼워줘.
페이지가 server component면 VoiceChat이 client component이므로 그냥 임포트해서 쓰면 됨 — 'use client' 추가 필요 없음.
```

---

## 사용 예시 (코드 스니펫)

```tsx
import VoiceChat from "@/components/voice-chat";

const SYSTEM_PROMPT = `당신은 사용자의 90일 플랜을 함께 다듬는 코치입니다.
사용자가 적은 플랜을 보고, 비현실적인 부분을 짚어주고 더 작은 첫 행동을 제안하세요.
반말로, 친한 코치처럼 다정하게.`;

const INITIAL_MESSAGE = "오늘 너의 플랜 한번 같이 봐볼까? 가장 자신 없는 항목 하나만 말해줘.";

export default function PlanPage() {
  return (
    <main>
      {/* ... 기존 내용 ... */}
      <VoiceChat
        systemPrompt={SYSTEM_PROMPT}
        initialMessage={INITIAL_MESSAGE}
        speakerLabel="플랜 코치"
        accentColor="var(--green)"
      />
    </main>
  );
}
```

---

## 시스템 프롬프트 작성 팁

- **음성으로 읽힌다.** 마크다운, 이모지, 괄호 안의 부연 설명 금지. 짧고 자연스럽게.
- **1~3 문장으로 답하도록 강제.** API에서 자동으로 가이드를 추가하지만, 시스템 프롬프트에서도 명시하면 더 잘 지킴.
- **페르소나의 톤을 박제.** "다정한 형", "엄격한 코치", "냉정한 분석가" 같이 형용사 한 단어라도 박아두면 일관성이 살아남.
- **목적을 박제.** "사용자가 다음 한 가지 행동을 결정하도록 돕는다" 식으로 목표를 명시.

---

## 참고

- 대화 응답: `ANTHROPIC_API_KEY`가 있으면 `claude-sonnet-4-6`, 없으면 데모 응답.
- 음성 합성: `OPENAI_API_KEY`가 있으면 OpenAI TTS(자연스러움), 없으면 브라우저 Web Speech로 자동 폴백.
- 모바일 Safari는 동작이 불안정합니다. 데모/시연은 데스크톱 Chrome/Edge 권장.

질문 / 버그는 dongkeun에게.
