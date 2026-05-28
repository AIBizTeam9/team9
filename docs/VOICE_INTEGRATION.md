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
- speed: 발화 속도 0.7 ~ 2.0 (기본 1.4 — 자연스러우면서 박자 좋음)
- bargeIn: AI 발화 중에 사용자가 말하면 자동으로 끊고 듣기 모드로 전환 (기본 true)

내부 동작:
- LLM 응답은 SSE 스트림으로 받아 문장 단위로 잘라 TTS에 즉시 흘림 — 첫 문장이 거의 즉시 들리기 시작.
- AudioContext로 마이크와 출력 음성을 분석해 막대형 파형을 실시간 시각화.
- VAD(Voice Activity Detection)로 사용자가 말을 시작하면 AI 발화를 즉시 끊고 SR(SpeechRecognition)으로 듣기.

이 페이지의 맥락은:
