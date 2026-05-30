import type { Metadata } from "next";
import { Inter, Instrument_Serif, Noto_Sans_KR } from "next/font/google";
import Link from "next/link";
import AuthButton from "@/components/auth-button";
import LangToggle from "@/components/lang-toggle";
import { LocaleProvider } from "@/lib/i18n";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
});

const notoSansKR = Noto_Sans_KR({
  variable: "--font-noto-kr",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Next Step in Life",
  description: "AI가 만들어주는 두 개의 미래 — 나의 가능성을 A/B 테스트하세요",
};

// /quiz, /debate는 jiyun의 통합 플로우(/next-step) 안에서 처리되므로 네비에서 제외.
// /plan(seokbin)은 jiyun의 /next-step으로 일원화되어 네비에서 제외.
// 라우트 디렉터리 자체(app/quiz, app/debate, app/plan)의 정리는 별도 PR에서 처리.
const NAV_ITEMS: { href: string; label: string }[] = [];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${inter.variable} ${instrumentSerif.variable} ${notoSansKR.variable} h-full antialiased`}>
      <body className="min-h-full">
        <LocaleProvider>
          <nav className="sticky top-0 z-50 bg-[var(--bg)]/90 backdrop-blur-sm border-b border-[var(--line)]">
            <div className="max-w-[980px] mx-auto px-6 h-14 flex items-center justify-between">
              <Link href="/" className="flex items-center gap-2.5">
                <span className="w-[7px] h-[7px] rounded-full bg-gradient-to-br from-[var(--ink)] to-[var(--warm)]" />
                <span className="text-[15px] font-semibold tracking-[-0.01em] text-[var(--ink)]">
                  Next Step in Life
                </span>
              </Link>

              <div className="flex items-center gap-1">
                {NAV_ITEMS.map((item) =>
                  item.href.endsWith(".html") ? (
                    <a
                      key={item.href}
                      href={item.href}
                      className="px-3 py-1.5 rounded-lg text-[13px] text-[var(--ink-3)] hover:text-[var(--ink)] hover:bg-[var(--accent-2)] transition-all"
                    >
                      {item.label}
                    </a>
                  ) : (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="px-3 py-1.5 rounded-lg text-[13px] text-[var(--ink-3)] hover:text-[var(--ink)] hover:bg-[var(--accent-2)] transition-all"
                    >
                      {item.label}
                    </Link>
                  ),
                )}
                <div className="ml-2 pl-2 border-l border-[var(--line)] flex items-center gap-3">
                  <LangToggle />
                  <AuthButton />
                </div>
              </div>
            </div>
          </nav>
          {children}
        </LocaleProvider>
      </body>
    </html>
  );
}
