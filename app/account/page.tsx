"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { getUser, onAuthChange, signOut } from "@/lib/auth";
import { loadOverallSummary, type OverallSummary } from "@/lib/whytree/db";
import { loadPlansOverview, type PlansOverview } from "@/lib/nextstep/db";

type ActivityCard = {
  href: string;
  emoji: string;
  title: string;
  desc: string;
  tone: "warm" | "blue" | "green" | "violet";
};

const ACTIVITY_CARDS: ActivityCard[] = [
  {
    href: "/next-step",
    emoji: "🧭",
    title: "90일 플랜",
    desc: "내 두 미래를 따라가는 90일 실행 계획",
    tone: "warm",
  },
  {
    href: "/letter",
    emoji: "💌",
    title: "미래의 나에게",
    desc: "오늘의 내가 미래의 나에게 보내는 편지",
    tone: "violet",
  },
  {
    href: "/market/compare",
    emoji: "⚖️",
    title: "두 미래 비교",
    desc: "두 키워드를 5개 시장 축에서 나란히",
    tone: "blue",
  },
  {
    href: "/market",
    emoji: "📊",
    title: "시장 인사이트",
    desc: "기술·산업·연봉·스킬·전망 데이터",
    tone: "blue",
  },
  {
    href: "/resources",
    emoji: "🧰",
    title: "리소스 허브",
    desc: "채용·강의·커뮤니티 외부 자료",
    tone: "green",
  },
  {
    href: "/bookmarks",
    emoji: "🔖",
    title: "내 북마크",
    desc: "저장한 시장·리소스 카드 모음",
    tone: "warm",
  },
];

const TONE_BG: Record<ActivityCard["tone"], string> = {
  warm: "var(--warm-soft)",
  blue: "var(--blue-soft)",
  green: "var(--green-soft)",
  violet: "#f0ecf9",
};

const TONE_FG: Record<ActivityCard["tone"], string> = {
  warm: "var(--warm)",
  blue: "var(--blue)",
  green: "var(--green)",
  violet: "#7c5cbf",
};

function formatDate(input: string | null | undefined): string | null {
  if (!input) return null;
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);
  const [whytreeSummary, setWhytreeSummary] = useState<OverallSummary | null>(
    null,
  );
  const [plansOverview, setPlansOverview] = useState<PlansOverview | null>(
    null,
  );

  useEffect(() => {
    let mounted = true;

    getUser().then(async (u) => {
      if (!mounted) return;
      setUser(u);
      setLoading(false);
      if (!u) {
        router.replace("/login");
        return;
      }
      const [summary, overview] = await Promise.all([
        loadOverallSummary(u.id),
        loadPlansOverview(u.id),
      ]);
      if (!mounted) return;
      setWhytreeSummary(summary);
      setPlansOverview(overview);
    });

    const { data } = onAuthChange((u) => {
      if (!mounted) return;
      const next = u as User | null;
      setUser(next);
      if (!next) router.replace("/login");
      else {
        Promise.all([
          loadOverallSummary(next.id),
          loadPlansOverview(next.id),
        ]).then(([s, o]) => {
          if (!mounted) return;
          setWhytreeSummary(s);
          setPlansOverview(o);
        });
      }
    });

    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, [router]);

  const onSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
      router.replace("/");
    } catch {
      setSigningOut(false);
    }
  };

  if (loading) {
    return (
      <div
        className="min-h-[calc(100vh-56px)] flex items-center justify-center"
        style={{ background: "var(--bg)" }}
      >
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full animate-bounce"
              style={{
                background: "var(--warm)",
                animationDelay: `${i * 200}ms`,
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (!user) {
    // useEffect가 redirect 처리 중. 깜빡임 방지용 빈 화면.
    return null;
  }

  const avatarUrl = user.user_metadata?.avatar_url as string | undefined;
  const fullName =
    (user.user_metadata?.full_name as string | undefined) ??
    user.email?.split("@")[0] ??
    "사용자";
  const provider =
    (user.app_metadata?.provider as string | undefined) ?? "google";
  const joinedAt = formatDate(user.created_at);
  const lastSignIn = formatDate(user.last_sign_in_at);

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <section className="max-w-[920px] mx-auto px-6 pt-14 pb-10">
        <div
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[12px] tracking-[0.04em] uppercase mb-6"
          style={{
            background: "var(--accent-2)",
            color: "var(--ink-3)",
            border: "1px solid var(--line)",
          }}
        >
          <span
            className="w-[6px] h-[6px] rounded-full"
            style={{ background: "var(--warm)" }}
          />
          My Account
        </div>

        <h1
          className="font-serif text-4xl sm:text-5xl tracking-[-0.03em] leading-[1.1] mb-4"
          style={{ color: "var(--ink)" }}
        >
          내 정보
        </h1>
        <p
          className="text-[15px] leading-relaxed max-w-xl"
          style={{ color: "var(--ink-3)" }}
        >
          로그인 상태와 내가 진행 중인 두 미래의 흔적을 한 자리에서.
        </p>
      </section>

      <main className="max-w-[920px] mx-auto px-6 pb-24 grid gap-6 lg:grid-cols-[1.1fr_2fr]">
        {/* 좌: 프로필 카드 */}
        <aside
          className="rounded-2xl p-6 sm:p-7 self-start"
          style={{
            background: "var(--bg-2)",
            border: "1px solid var(--line)",
            boxShadow: "var(--shadow)",
          }}
        >
          <div className="flex items-center gap-4 mb-5">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt=""
                className="w-16 h-16 rounded-full"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-[22px] font-bold text-white"
                style={{ background: "var(--warm)" }}
              >
                {fullName[0]}
              </div>
            )}
            <div className="min-w-0">
              <p
                className="font-serif text-[20px] tracking-[-0.01em] truncate"
                style={{ color: "var(--ink)" }}
              >
                {fullName}
              </p>
              <p
                className="text-[12px] truncate"
                style={{ color: "var(--ink-3)" }}
              >
                {user.email}
              </p>
            </div>
          </div>

          <dl
            className="text-[13px] space-y-2.5 pt-4 mb-5"
            style={{ borderTop: "1px solid var(--line)" }}
          >
            <Row label="로그인 방식" value={providerLabel(provider)} />
            {joinedAt && <Row label="가입일" value={joinedAt} />}
            {lastSignIn && <Row label="최근 접속" value={lastSignIn} />}
            <Row
              label="사용자 ID"
              value={
                <span
                  className="font-mono text-[11px] truncate inline-block max-w-[160px] align-bottom"
                  title={user.id}
                  style={{ color: "var(--ink-3)" }}
                >
                  {user.id}
                </span>
              }
            />
          </dl>

          <button
            onClick={onSignOut}
            disabled={signingOut}
            className="w-full px-4 py-2.5 rounded-xl text-[13px] font-medium transition-all hover:opacity-85 disabled:opacity-50"
            style={{
              background: "var(--accent-2)",
              color: "var(--warm)",
              border: "1px solid var(--line)",
            }}
          >
            {signingOut ? "로그아웃 중..." : "로그아웃"}
          </button>
        </aside>

        {/* 우: 내 활동 바로가기 */}
        <section>
          <p
            className="text-[11px] font-medium tracking-[0.08em] uppercase mb-4"
            style={{ color: "var(--ink-3)" }}
          >
            내 활동 바로가기
          </p>

          <div className="grid gap-3 sm:grid-cols-2">
            {ACTIVITY_CARDS.map((c) => (
              <Link
                key={c.href}
                href={c.href}
                className="group rounded-2xl p-5 transition-all hover:shadow-lg"
                style={{
                  background: "var(--bg-2)",
                  border: "1px solid var(--line)",
                  boxShadow: "var(--shadow)",
                }}
              >
                <div className="flex items-start gap-3 mb-2">
                  <span
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                    style={{ background: TONE_BG[c.tone] }}
                  >
                    {c.emoji}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3
                      className="font-serif text-[16px] tracking-[-0.01em] mb-0.5 group-hover:opacity-80 transition-opacity"
                      style={{ color: "var(--ink)" }}
                    >
                      {c.title}
                    </h3>
                    <p
                      className="text-[12px] leading-relaxed line-clamp-2"
                      style={{ color: "var(--ink-3)" }}
                    >
                      {c.desc}
                    </p>
                  </div>
                </div>
                <div
                  className="flex items-center justify-end text-[11px] opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ color: TONE_FG[c.tone] }}
                >
                  바로가기 →
                </div>
              </Link>
            ))}
          </div>

          {/* 90일 플랜 — 저장된 플랜 목록 */}
          <div className="mt-8">
            <p
              className="text-[11px] font-medium tracking-[0.08em] uppercase mb-4"
              style={{ color: "var(--ink-3)" }}
            >
              Next Step · 저장된 90일 플랜
            </p>
            <Link
              href="/account/next-step"
              className="group block rounded-2xl p-5 transition-all hover:shadow-lg"
              style={{
                background: "var(--bg-2)",
                border: "1px solid var(--line)",
                boxShadow: "var(--shadow)",
              }}
            >
              <div className="flex items-start gap-3 mb-3">
                <span
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                  style={{ background: "var(--warm-soft)" }}
                >
                  🧭
                </span>
                <div className="min-w-0 flex-1">
                  <h3
                    className="font-serif text-[16px] tracking-[-0.01em] mb-0.5"
                    style={{ color: "var(--ink)" }}
                  >
                    지난 플랜들
                  </h3>
                  <p
                    className="text-[12px] leading-relaxed"
                    style={{ color: "var(--ink-3)" }}
                  >
                    {plansOverview === null
                      ? "불러오는 중…"
                      : plansOverview.total > 0
                        ? `플랜 ${plansOverview.total}개${
                            plansOverview.latest
                              ? ` · 최근 ${formatRelative(
                                  plansOverview.latest.created_at,
                                )}`
                              : ""
                          }`
                        : "아직 저장된 플랜이 없어요. 퀴즈를 마치면 자동으로 저장됩니다."}
                  </p>
                </div>
              </div>

              {plansOverview?.latest && (
                <dl
                  className="grid gap-2 text-[12px] pt-3"
                  style={{ borderTop: "1px solid var(--line)" }}
                >
                  <div className="flex gap-3">
                    <dt
                      className="w-[64px] flex-shrink-0 text-[10px] uppercase tracking-[0.06em]"
                      style={{ color: "var(--ink-3)" }}
                    >
                      최근 헤드라인
                    </dt>
                    <dd
                      className="flex-1 font-serif line-clamp-2"
                      style={{ color: "var(--ink)" }}
                    >
                      {plansOverview.latest.headline}
                    </dd>
                  </div>
                  {plansOverview.latest.firstStep && (
                    <div className="flex gap-3">
                      <dt
                        className="w-[64px] flex-shrink-0 text-[10px] uppercase tracking-[0.06em]"
                        style={{ color: "var(--warm)" }}
                      >
                        첫 행동
                      </dt>
                      <dd
                        className="flex-1 line-clamp-2"
                        style={{ color: "var(--ink-2)" }}
                      >
                        {plansOverview.latest.firstStep}
                      </dd>
                    </div>
                  )}
                </dl>
              )}

              <div
                className="flex items-center justify-end mt-3 text-[11px] opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ color: "var(--warm)" }}
              >
                지난 플랜 보기 →
              </div>
            </Link>
          </div>

          {/* Why Tree 대화 기록 — 로그인 사용자에게만 의미가 있는 영역 */}
          <div className="mt-8">
            <p
              className="text-[11px] font-medium tracking-[0.08em] uppercase mb-4"
              style={{ color: "var(--ink-3)" }}
            >
              Why Tree · 대화 기록
            </p>
            <Link
              href="/account/whytree"
              className="group block rounded-2xl p-5 transition-all hover:shadow-lg"
              style={{
                background: "var(--bg-2)",
                border: "1px solid var(--line)",
                boxShadow: "var(--shadow)",
              }}
            >
              <div className="flex items-start gap-3 mb-3">
                <span
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                  style={{ background: "var(--blue-soft)" }}
                >
                  🌳
                </span>
                <div className="min-w-0 flex-1">
                  <h3
                    className="font-serif text-[16px] tracking-[-0.01em] mb-0.5"
                    style={{ color: "var(--ink)" }}
                  >
                    지나간 대화들
                  </h3>
                  <p
                    className="text-[12px] leading-relaxed"
                    style={{ color: "var(--ink-3)" }}
                  >
                    {whytreeSummary === null
                      ? "불러오는 중…"
                      : whytreeSummary.hasData
                        ? `${whytreeSummary.totalSessions}일 동안 대화 ${whytreeSummary.totalMessages}개 · 노드 ${whytreeSummary.totalNodes}개${
                            whytreeSummary.lastUpdatedAt
                              ? ` · 마지막 ${formatRelative(
                                  whytreeSummary.lastUpdatedAt,
                                )}`
                              : ""
                          }`
                        : "아직 시작된 대화가 없어요. Why 트리에서 첫 질문을 받아보세요."}
                  </p>
                </div>
              </div>

              {whytreeSummary?.hasData && (
                <dl
                  className="grid gap-2 text-[12px] pt-3"
                  style={{ borderTop: "1px solid var(--line)" }}
                >
                  {whytreeSummary.latestPurpose && (
                    <div className="flex gap-3">
                      <dt
                        className="w-[64px] flex-shrink-0 text-[10px] uppercase tracking-[0.06em]"
                        style={{ color: "var(--ink-3)" }}
                      >
                        최근 목적
                      </dt>
                      <dd
                        className="flex-1 font-serif"
                        style={{ color: "var(--ink)" }}
                      >
                        {whytreeSummary.latestPurpose}
                      </dd>
                    </div>
                  )}
                  {whytreeSummary.latestExperiment && (
                    <div className="flex gap-3">
                      <dt
                        className="w-[64px] flex-shrink-0 text-[10px] uppercase tracking-[0.06em]"
                        style={{ color: "var(--green)" }}
                      >
                        최근 실험
                      </dt>
                      <dd
                        className="flex-1"
                        style={{ color: "var(--ink-2)" }}
                      >
                        {whytreeSummary.latestExperiment}
                      </dd>
                    </div>
                  )}
                </dl>
              )}

              <div
                className="flex items-center justify-end mt-3 text-[11px] opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ color: "var(--blue)" }}
              >
                대화 기록 보기 →
              </div>
            </Link>
          </div>

          <p
            className="text-[11px] mt-5"
            style={{ color: "var(--ink-3)" }}
          >
            진행률·통계 표시는 다음 업데이트에서 추가됩니다.
          </p>
        </section>
      </main>
    </div>
  );
}

function formatRelative(iso: string): string {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "";
  const diff = Date.now() - t;
  const min = Math.floor(diff / 60000);
  if (min < 1) return "방금";
  if (min < 60) return `${min}분 전`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}시간 전`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day}일 전`;
  return new Date(iso).toLocaleDateString("ko-KR");
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline gap-3">
      <dt
        className="w-[68px] flex-shrink-0 text-[11px] tracking-[0.04em] uppercase"
        style={{ color: "var(--ink-3)" }}
      >
        {label}
      </dt>
      <dd className="flex-1 min-w-0" style={{ color: "var(--ink-2)" }}>
        {value}
      </dd>
    </div>
  );
}

function providerLabel(provider: string): string {
  if (provider === "google") return "Google";
  if (provider === "email") return "이메일";
  return provider.charAt(0).toUpperCase() + provider.slice(1);
}
