import Link from "next/link";
import PlanView from "@/components/nextstep/plan-view";
import { getPublicPlan, type PublicPlanQueryClient } from "@/lib/nextstep/db";
import { createSupabaseServer } from "@/lib/supabase-server";

// 공유 페이지는 로그인 없이 접근 가능. 단, is_public=true 인 플랜만 노출.
// RLS의 nextstep_plans_public_read 정책 + gatePublicPlan 두 겹 가드가 private 플랜 노출을 막는다.
export default async function SharedPlanPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let plan = null;
  try {
    const supabase = await createSupabaseServer();
    // getPublicPlan(id, client)을 그대로 호출 — 동일 함수가 단위 테스트로 검증됨.
    plan = await getPublicPlan(id, supabase as unknown as PublicPlanQueryClient);
  } catch {
    // Supabase env 미설정 등 — plan은 위 초기화에서 null. 안전하게 not-shared로 떨어진다.
  }

  if (!plan) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
        <div className="max-w-[440px] w-full px-6 text-center">
          <p
            className="text-[11px] font-medium tracking-[0.08em] uppercase mb-3"
            style={{ color: "var(--ink-3)" }}
          >
            Next Step in Life
          </p>
          <h1
            className="font-serif leading-[1.15] tracking-[-0.02em] mb-3"
            style={{ color: "var(--ink)", fontSize: "clamp(28px, 4.5vw, 36px)" }}
          >
            공유되지 않은 플랜이에요
          </h1>
          <p className="text-[14px] leading-relaxed mb-8" style={{ color: "var(--ink-3)" }}>
            이 링크의 플랜을 찾을 수 없거나, 작성자가 공유를 꺼둔 상태예요. 작성자에게 다시 링크를 받아보세요.
          </p>
          <Link
            href="/next-step"
            className="inline-flex items-center gap-2.5 px-6 py-3 rounded-full text-[14px] font-semibold text-white transition-opacity hover:opacity-85"
            style={{ background: "var(--warm)" }}
          >
            나도 90일 플랜 만들기 →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh" }}>
      <div style={{ maxWidth: "720px", margin: "0 auto", padding: "48px 24px 96px" }}>
        {/* 공유 헤더 — 작성자의 뷰가 아님을 명시 */}
        <div
          className="rounded-2xl p-4 mb-10 flex items-start gap-3"
          style={{
            background: "var(--bg-2)",
            border: "1px solid var(--line)",
          }}
        >
          <span
            className="text-[16px] leading-none mt-0.5"
            style={{ color: "var(--warm)" }}
            aria-hidden
          >
            ✦
          </span>
          <div className="flex-1 min-w-0">
            <p
              className="text-[11px] font-medium tracking-[0.08em] uppercase mb-1"
              style={{ color: "var(--ink-3)" }}
            >
              공유된 90일 플랜
            </p>
            <p className="text-[13px] leading-relaxed" style={{ color: "var(--ink-2)" }}>
              누군가가 자신의 90일 플랜을 공유했어요. 본인 플랜이 궁금하다면{" "}
              <Link
                href="/next-step"
                className="underline"
                style={{ color: "var(--ink)" }}
              >
                여기서 만들 수 있어요
              </Link>
              .
            </p>
          </div>
        </div>

        {/* PlanView를 read-only 모드로 렌더. progress/onProgressChange를 안 넘기면
            ActionCard의 체크박스·리뷰 노트가 자동으로 비활성화된다. startDate도 안
            넘겨서 캘린더 export 버튼도 빠진다 — 공유 받는 사람의 첫 경험은 깔끔히. */}
        <PlanView plan={plan.plan} />
      </div>
    </div>
  );
}
