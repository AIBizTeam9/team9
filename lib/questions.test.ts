// lib/questions.ts 단위테스트.
//
// 두 사전(QUESTIONS_KO / QUESTIONS_EN)의 invariant를 명시적으로 검증한다.
// 기존 코드는 dev 환경에서만 `process.env.NODE_ENV !== 'production'`로 throw해
// 검사하므로, prod에서는 무방비. 이 테스트는 모든 환경에서 동작하는 unit-level
// 보장이 된다.
//
// 추가로 quiz/page.tsx가 가정하는 type/o/quickPicks 관계를 검증해, 새 질문이
// 추가될 때 형식 실수를 즉시 잡는다.

import { describe, it, expect } from "vitest";
import {
  QUESTIONS,
  QUESTIONS_KO,
  QUESTIONS_EN,
  getQuestions,
  type Question,
} from "./questions";

const ALLOWED_TYPES: ReadonlyArray<Question["type"]> = [
  "number",
  "text",
  "textarea",
  "choice",
];

const MBTI_16 = [
  "ISTJ", "ISFJ", "INFJ", "INTJ",
  "ISTP", "ISFP", "INFP", "INTP",
  "ESTP", "ESFP", "ENFP", "ENTP",
  "ESTJ", "ESFJ", "ENFJ", "ENTJ",
];

describe("QUESTIONS_KO / QUESTIONS_EN — cross-dictionary invariants", () => {
  it("두 사전의 길이가 같다", () => {
    expect(QUESTIONS_KO.length).toBe(QUESTIONS_EN.length);
  });

  it("두 사전이 정확히 15문항이다 — 프로젝트 spec 기준", () => {
    expect(QUESTIONS_KO).toHaveLength(15);
    expect(QUESTIONS_EN).toHaveLength(15);
  });

  it("두 사전이 같은 key 순서를 가진다 — quiz/page.tsx가 index로 매칭", () => {
    for (let i = 0; i < QUESTIONS_KO.length; i++) {
      expect(QUESTIONS_KO[i].k, `index ${i}`).toBe(QUESTIONS_EN[i].k);
    }
  });

  it("같은 index에서 두 사전의 type이 같다", () => {
    for (let i = 0; i < QUESTIONS_KO.length; i++) {
      expect(QUESTIONS_KO[i].type, `key ${QUESTIONS_KO[i].k}`).toBe(
        QUESTIONS_EN[i].type,
      );
    }
  });
});

describe("각 사전 내부 일관성", () => {
  for (const [name, dict] of [
    ["KO", QUESTIONS_KO],
    ["EN", QUESTIONS_EN],
  ] as const) {
    describe(name, () => {
      it("키(k)가 모두 고유하다 — 중복 시 sessionStorage 충돌", () => {
        const keys = dict.map((q) => q.k);
        expect(new Set(keys).size).toBe(keys.length);
      });

      it("모든 type 값이 허용된 4종 안에 있다", () => {
        for (const q of dict) {
          expect(ALLOWED_TYPES, `key ${q.k}`).toContain(q.type);
        }
      });

      it("질문 텍스트(t)가 비어있지 않다", () => {
        for (const q of dict) {
          expect(q.t.trim(), `key ${q.k}`).not.toBe("");
        }
      });

      it("type='choice' 질문은 o 배열에 ≥2 옵션을 가진다", () => {
        const choices = dict.filter((q) => q.type === "choice");
        expect(choices.length).toBeGreaterThan(0);
        for (const q of choices) {
          expect(q.o, `key ${q.k}`).toBeDefined();
          expect(q.o!.length, `key ${q.k}`).toBeGreaterThanOrEqual(2);
          // 빈 문자열 옵션 금지
          for (const opt of q.o!) {
            expect(opt.trim(), `key ${q.k}`).not.toBe("");
          }
        }
      });

      it("type='choice'가 아닌 질문은 o를 갖지 않는다", () => {
        const nonChoices = dict.filter((q) => q.type !== "choice");
        for (const q of nonChoices) {
          expect(q.o, `key ${q.k}`).toBeUndefined();
        }
      });

      it("quickPicks는 text/textarea 질문에서만 사용 — number/choice엔 없다", () => {
        const wrongScope = dict.filter(
          (q) =>
            q.quickPicks !== undefined &&
            q.type !== "text" &&
            q.type !== "textarea",
        );
        expect(wrongScope, `keys: ${wrongScope.map((q) => q.k).join(",")}`)
          .toHaveLength(0);
      });

      it("quickPicks가 정의된 경우 ≥2 항목이고 빈 문자열 없음", () => {
        for (const q of dict) {
          if (q.quickPicks === undefined) continue;
          expect(q.quickPicks.length, `key ${q.k}`).toBeGreaterThanOrEqual(2);
          for (const pick of q.quickPicks) {
            expect(pick.trim(), `key ${q.k}`).not.toBe("");
          }
        }
      });
    });
  }
});

describe("사용자 개인정보·UX invariants", () => {
  it("income 질문은 '말하고 싶지 않음' 옵션을 포함 (KO·EN 양쪽 privacy 보호)", () => {
    const incomeKo = QUESTIONS_KO.find((q) => q.k === "income");
    const incomeEn = QUESTIONS_EN.find((q) => q.k === "income");
    expect(incomeKo?.o).toContain("말하고 싶지 않음");
    expect(incomeEn?.o).toContain("Prefer not to say");
  });

  it("boldness 질문은 정확히 5개 옵션 (1-5 스케일)", () => {
    const boldnessKo = QUESTIONS_KO.find((q) => q.k === "boldness");
    const boldnessEn = QUESTIONS_EN.find((q) => q.k === "boldness");
    expect(boldnessKo?.o).toHaveLength(5);
    expect(boldnessEn?.o).toHaveLength(5);
  });

  it("mbti quickPicks는 16개의 MBTI 타입을 정확히 포함", () => {
    const mbtiKo = QUESTIONS_KO.find((q) => q.k === "mbti");
    const mbtiEn = QUESTIONS_EN.find((q) => q.k === "mbti");
    expect(mbtiKo?.quickPicks).toEqual(MBTI_16);
    expect(mbtiEn?.quickPicks).toEqual(MBTI_16);
  });
});

describe("getQuestions(locale) — locale 라우팅", () => {
  it("'ko' 인자는 QUESTIONS_KO와 동일 참조", () => {
    expect(getQuestions("ko")).toBe(QUESTIONS_KO);
  });

  it("'en' 인자는 QUESTIONS_EN과 동일 참조", () => {
    expect(getQuestions("en")).toBe(QUESTIONS_EN);
  });
});

describe("legacy QUESTIONS export — 하위 호환", () => {
  it("QUESTIONS는 QUESTIONS_KO와 동일 참조 — 기존 코드 호환", () => {
    expect(QUESTIONS).toBe(QUESTIONS_KO);
  });
});
