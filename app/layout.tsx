import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Next Step in Life",
  description: "AI가 만들어주는 두 개의 미래 — 나의 가능성을 A/B 테스트하세요",
};

const NAV_ITEMS = [
  { href: "/quiz", label: "퀴즈", icon: "🧪" },
  { href: "/debate", label: "디베이트", icon: "💬" },
  { href: "/plan", label: "90일 플랜", icon: "📋" },
  { href: "/market", label: "시장 인사이트", icon: "📊" },
  { href: "/resources", label: "리소스 허브", icon: "🔗" },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full">
        <nav className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-white/5">
          <div className="max-w-6xl mx-auto px-4 h-12 flex items-center gap-1">
            <Link
              href="/"
              className="text-sm font-bold bg-gradient-to-r from-indigo-300 to-purple-300 bg-clip-text text-transparent mr-4 shrink-0"
            >
              Next Step in Life
            </Link>

            <div className="flex items-center gap-0.5 overflow-x-auto">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-indigo-200/60 hover:text-indigo-100 hover:bg-white/5 transition-all whitespace-nowrap"
                >
                  <span>{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}
