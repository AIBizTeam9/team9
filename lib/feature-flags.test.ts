// feature-flags 단위테스트. PR #32 (chore/demo-cleanup)에서 추가된
// 시연용 feature gate. 환경변수 NEXT_PUBLIC_SHOW_LAB 으로 실험 라우트 노출 제어.

import { describe, it, expect, afterEach, vi } from "vitest";

// 동적 import 로 환경변수 변경 후 모듈을 새로 로드 — feature-flags는
// process.env 를 호출 시점에 읽으므로 굳이 reset할 필요는 없지만,
// next/navigation 의 notFound 가 throw 하는 동작을 mock 해야 한다.

vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));

import {
  experimentalEnabled,
  assertExperimentalEnabled,
} from "./feature-flags";

describe("experimentalEnabled", () => {
  const original = process.env.NEXT_PUBLIC_SHOW_LAB;

  afterEach(() => {
    if (original === undefined) {
      delete process.env.NEXT_PUBLIC_SHOW_LAB;
    } else {
      process.env.NEXT_PUBLIC_SHOW_LAB = original;
    }
  });

  it("NEXT_PUBLIC_SHOW_LAB 가 '1' 이면 true", () => {
    process.env.NEXT_PUBLIC_SHOW_LAB = "1";
    expect(experimentalEnabled()).toBe(true);
  });

  it("'1' 이외의 값(예: 'true', '0', '')은 false", () => {
    for (const v of ["0", "true", "yes", "", "false"]) {
      process.env.NEXT_PUBLIC_SHOW_LAB = v;
      expect(experimentalEnabled()).toBe(false);
    }
  });

  it("환경변수가 아예 없으면 false (production 기본값)", () => {
    delete process.env.NEXT_PUBLIC_SHOW_LAB;
    expect(experimentalEnabled()).toBe(false);
  });
});

describe("assertExperimentalEnabled", () => {
  const original = process.env.NEXT_PUBLIC_SHOW_LAB;

  afterEach(() => {
    if (original === undefined) {
      delete process.env.NEXT_PUBLIC_SHOW_LAB;
    } else {
      process.env.NEXT_PUBLIC_SHOW_LAB = original;
    }
  });

  it("활성화되어 있으면 throw 안 함", () => {
    process.env.NEXT_PUBLIC_SHOW_LAB = "1";
    expect(() => assertExperimentalEnabled()).not.toThrow();
  });

  it("비활성화면 notFound() 가 발동 (mock 에서 throw 로 신호)", () => {
    delete process.env.NEXT_PUBLIC_SHOW_LAB;
    expect(() => assertExperimentalEnabled()).toThrow("NEXT_NOT_FOUND");
  });
});
