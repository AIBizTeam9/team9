// /api/persona-debate-continue 라우트 단위테스트.
// Anthropic SDK와 rate-limit 모듈을 vi.mock으로 격리해서 검증/응답 로직만 테스트한다.
// 이 레포 첫 Anthropic mock — 외부 호출 없이 route의 가드/검증/응답 정합성만 확인.

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { NextRequest } from 'next/server';

// vi.mock 팩토리는 vitest가 import보다 위로 hoist 한다. 그 안에서 외부 const를
// 참조하려면 vi.hoisted로 함께 끌어올려야 한다 (그냥 const는 TDZ).
const { mockCheckBodySize, mockCheckRateLimit, mockMessageCreate } = vi.hoisted(
  () => ({
    mockCheckBodySize: vi.fn(),
    mockCheckRateLimit: vi.fn(),
    mockMessageCreate: vi.fn(),
  }),
);

vi.mock('@/lib/rate-limit', () => ({
  checkBodySize: mockCheckBodySize,
  checkRateLimit: mockCheckRateLimit,
}));

// Anthropic SDK mock — 라우트가 `new Anthropic(...)` 으로 쓰므로 default export는
// constructible해야 한다. 화살표 함수는 constructor가 될 수 없으니 class로 둔다.
vi.mock('@anthropic-ai/sdk', () => ({
  default: class MockAnthropic {
    messages = { create: mockMessageCreate };
  },
}));

vi.stubEnv('ANTHROPIC_API_KEY', 'test-key');

// 라우트는 mock이 셋업된 다음에 import 되어야 한다 (vitest는 vi.mock을 hoist).
import { POST } from '@/app/api/persona-debate-continue/route';

function mockReq(
  body: unknown,
  headers: Record<string, string> = {},
): NextRequest {
  return {
    headers: {
      get: (name: string) => headers[name.toLowerCase()] ?? null,
    },
    json: async () => body,
  } as unknown as NextRequest;
}

const validPersona = (name: string) => ({
  name,
  coreBelief: 'Belief about the user.',
  keyFear: 'Fear about losing.',
  strongestArgument: 'Strong argument.',
  communicationStyle: 'direct, warm',
});

const A = validPersona('The Director');
const B = validPersona('The Photographer');

const validBody = (overrides: Record<string, unknown> = {}) => ({
  personaA: A,
  personaB: B,
  answers: { stuck: '회사가 답답해', desiredChange: '방향을 바꾸고 싶어' },
  turnsSoFar: [
    { speaker: A.name, content: '안정이 우선이야.' },
    { speaker: B.name, content: '안정만 좇다 다 지나간다.' },
    // 마지막 = 사용자가 A로 끼어든 turn
    { speaker: A.name, content: '나는 사실 도전이 두려운 게 맞아.' },
  ],
  userSpokeAs: 'A' as const,
  continueLength: 4,
  ...overrides,
});

const okModelResponse = (turns: { speaker: string; content: string }[]) => ({
  content: [
    {
      type: 'text',
      text: JSON.stringify({ turns }),
    },
  ],
});

beforeEach(() => {
  mockCheckBodySize.mockReturnValue(null);
  mockCheckRateLimit.mockReturnValue({ ok: true });
  mockMessageCreate.mockReset();
});

describe('POST /api/persona-debate-continue', () => {
  describe('body validation', () => {
    it('returns 400 when personaA is missing/invalid', async () => {
      const res = await POST(mockReq(validBody({ personaA: undefined })));
      expect(res.status).toBe(400);
      expect(mockMessageCreate).not.toHaveBeenCalled();
    });

    it('returns 400 when personaB is missing/invalid', async () => {
      const res = await POST(mockReq(validBody({ personaB: { name: '' } })));
      expect(res.status).toBe(400);
    });

    it('returns 400 when userSpokeAs is neither "A" nor "B"', async () => {
      const res = await POST(mockReq(validBody({ userSpokeAs: 'C' })));
      expect(res.status).toBe(400);
    });

    it('returns 400 when continueLength is out of range (0 or >8)', async () => {
      const low = await POST(mockReq(validBody({ continueLength: 0 })));
      expect(low.status).toBe(400);
      const high = await POST(mockReq(validBody({ continueLength: 99 })));
      expect(high.status).toBe(400);
    });

    it('returns 400 when last turnsSoFar content is empty/whitespace', async () => {
      const turns = validBody().turnsSoFar.slice();
      turns[turns.length - 1] = { speaker: A.name, content: '   ' };
      const res = await POST(mockReq(validBody({ turnsSoFar: turns })));
      expect(res.status).toBe(400);
    });

    it('returns 400 when turnsSoFar is oversized (>30 items)', async () => {
      const oversized = Array.from({ length: 50 }, (_, i) => ({
        speaker: i % 2 === 0 ? A.name : B.name,
        content: 'x',
      }));
      const res = await POST(mockReq(validBody({ turnsSoFar: oversized })));
      expect(res.status).toBe(400);
    });

    it('returns 400 when turnsSoFar is empty', async () => {
      const res = await POST(mockReq(validBody({ turnsSoFar: [] })));
      expect(res.status).toBe(400);
    });
  });

  describe('guards run before Anthropic', () => {
    it('returns 429 when rate-limited and never calls Anthropic', async () => {
      mockCheckRateLimit.mockReturnValue({ ok: false, retryAfterSec: 60 });
      const res = await POST(mockReq(validBody()));
      expect(res.status).toBe(429);
      expect(mockMessageCreate).not.toHaveBeenCalled();
    });

    it('returns 413 when body size guard rejects', async () => {
      mockCheckBodySize.mockReturnValue({ ok: false, retryAfterSec: 1 });
      const res = await POST(mockReq(validBody()));
      expect(res.status).toBe(413);
      expect(mockMessageCreate).not.toHaveBeenCalled();
    });

    it('calls checkRateLimit with the "persona-debate-continue" key', async () => {
      mockMessageCreate.mockResolvedValue(
        okModelResponse([
          { speaker: B.name, content: 'r1' },
          { speaker: A.name, content: 'r2' },
          { speaker: B.name, content: 'r3' },
          { speaker: A.name, content: 'r4' },
        ]),
      );
      await POST(mockReq(validBody()));
      expect(mockCheckRateLimit).toHaveBeenCalled();
      const keyArg = mockCheckRateLimit.mock.calls[0]?.[1];
      expect(keyArg).toBe('persona-debate-continue');
    });
  });

  describe('happy path', () => {
    it('returns 200 with N turns matching continueLength', async () => {
      mockMessageCreate.mockResolvedValue(
        okModelResponse([
          { speaker: B.name, content: 'r1' },
          { speaker: A.name, content: 'r2' },
          { speaker: B.name, content: 'r3' },
          { speaker: A.name, content: 'r4' },
        ]),
      );
      const res = await POST(
        mockReq(validBody({ continueLength: 4, userSpokeAs: 'A' })),
      );
      expect(res.status).toBe(200);
      const json = (await res.json()) as { turns: { speaker: string }[] };
      expect(json.turns).toHaveLength(4);
    });

    it('first new turn speaker is the OPPOSITE persona of userSpokeAs', async () => {
      // 사용자가 A로 발화 → 첫 응답은 반드시 B여야 한다.
      mockMessageCreate.mockResolvedValue(
        okModelResponse([
          { speaker: B.name, content: 'B responds first.' },
          { speaker: A.name, content: 'A rebuts.' },
        ]),
      );
      const res = await POST(
        mockReq(validBody({ continueLength: 2, userSpokeAs: 'A' })),
      );
      expect(res.status).toBe(200);
      const json = (await res.json()) as { turns: { speaker: string }[] };
      expect(json.turns[0].speaker).toBe(B.name);
    });

    it('handles userSpokeAs="B" symmetrically (first new turn is A)', async () => {
      const body = validBody({
        userSpokeAs: 'B',
        continueLength: 2,
        turnsSoFar: [
          { speaker: A.name, content: 'a1' },
          { speaker: B.name, content: 'b1' },
          { speaker: B.name, content: 'user-as-B' },
        ],
      });
      mockMessageCreate.mockResolvedValue(
        okModelResponse([
          { speaker: A.name, content: 'A responds.' },
          { speaker: B.name, content: 'B counters.' },
        ]),
      );
      const res = await POST(mockReq(body));
      expect(res.status).toBe(200);
      const json = (await res.json()) as { turns: { speaker: string }[] };
      expect(json.turns[0].speaker).toBe(A.name);
    });
  });

  describe('strict model response validation (502 on any drift)', () => {
    it('returns 502 when first speaker is the SAME persona as userSpokeAs', async () => {
      // 사용자가 A로 발화했는데 모델이 A부터 응답 → 잘못된 응답.
      mockMessageCreate.mockResolvedValue(
        okModelResponse([
          { speaker: A.name, content: 'wrong starter' },
          { speaker: B.name, content: 'r2' },
        ]),
      );
      const res = await POST(
        mockReq(validBody({ continueLength: 2, userSpokeAs: 'A' })),
      );
      expect(res.status).toBe(502);
    });

    it('returns 502 when number of turns ≠ continueLength', async () => {
      mockMessageCreate.mockResolvedValue(
        okModelResponse([
          { speaker: B.name, content: 'r1' },
          { speaker: A.name, content: 'r2' },
        ]),
      );
      const res = await POST(
        mockReq(validBody({ continueLength: 4, userSpokeAs: 'A' })),
      );
      expect(res.status).toBe(502);
    });

    it('returns 502 when speakers do not strictly alternate', async () => {
      mockMessageCreate.mockResolvedValue(
        okModelResponse([
          { speaker: B.name, content: 'r1' },
          { speaker: B.name, content: 'should be A' },
        ]),
      );
      const res = await POST(
        mockReq(validBody({ continueLength: 2, userSpokeAs: 'A' })),
      );
      expect(res.status).toBe(502);
    });

    it('returns 502 when a turn has empty content', async () => {
      mockMessageCreate.mockResolvedValue(
        okModelResponse([
          { speaker: B.name, content: '' },
          { speaker: A.name, content: 'r2' },
        ]),
      );
      const res = await POST(
        mockReq(validBody({ continueLength: 2, userSpokeAs: 'A' })),
      );
      expect(res.status).toBe(502);
    });

    it('returns 502 when Anthropic throws', async () => {
      mockMessageCreate.mockRejectedValue(new Error('upstream down'));
      const res = await POST(mockReq(validBody()));
      expect(res.status).toBe(502);
    });

    it('returns 502 when model response is not valid JSON', async () => {
      mockMessageCreate.mockResolvedValue({
        content: [{ type: 'text', text: 'not json at all' }],
      });
      const res = await POST(mockReq(validBody()));
      expect(res.status).toBe(502);
    });

    it('strips markdown fences before parsing', async () => {
      // 모델이 ```json ... ``` 으로 감싸도 통과해야 한다.
      mockMessageCreate.mockResolvedValue({
        content: [
          {
            type: 'text',
            text:
              '```json\n' +
              JSON.stringify({
                turns: [
                  { speaker: B.name, content: 'r1' },
                  { speaker: A.name, content: 'r2' },
                ],
              }) +
              '\n```',
          },
        ],
      });
      const res = await POST(
        mockReq(validBody({ continueLength: 2, userSpokeAs: 'A' })),
      );
      expect(res.status).toBe(200);
    });
  });
});
