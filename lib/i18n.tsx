// 가벼운 client-side i18n. 외부 라이브러리 없음.
//
// - 두 언어(ko/en)만 지원. 기본은 ko.
// - locale 상태는 React Context로 propagate, cookie 'lang'으로 1년 persist.
// - t(key)는 현재 locale 사전에서 lookup, 없으면 key 그대로 반환 (fallback).
// - Server Component에서는 useLocale 못 씀 → 사용자-노출 페이지는 'use client'로.

"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { ko } from "./dictionaries/ko";
import { en } from "./dictionaries/en";

export type Locale = "ko" | "en";

// 공유 key 집합 — 두 사전이 EXACT 동일한 key를 가지도록 강제하기 위해
// ko를 source of truth로 두고 en은 같은 shape이어야 한다.
export type DictKey = keyof typeof ko;

const DICTS = { ko, en } as const;

const COOKIE_NAME = "lang";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1년 (초)

function readCookieLocale(): Locale | null {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(/(?:^|;\s*)lang=(ko|en)\b/);
  return m ? (m[1] as Locale) : null;
}

function writeCookieLocale(loc: Locale) {
  if (typeof document === "undefined") return;
  document.cookie = `${COOKIE_NAME}=${loc}; path=/; max-age=${COOKIE_MAX_AGE}; samesite=lax`;
}

interface LocaleContextValue {
  locale: Locale;
  setLocale: (loc: Locale) => void;
  t: (key: DictKey) => string;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
  // SSR 시점에 cookie 못 읽으므로 기본은 ko. mount 후 cookie 있으면 보정.
  const [locale, setLocaleState] = useState<Locale>("ko");

  useEffect(() => {
    const fromCookie = readCookieLocale();
    if (fromCookie && fromCookie !== locale) setLocaleState(fromCookie);
    // 마운트 시 한 번만.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setLocale = useCallback((loc: Locale) => {
    writeCookieLocale(loc);
    setLocaleState(loc);
  }, []);

  const t = useCallback(
    (key: DictKey): string => {
      const dict = DICTS[locale];
      const v = (dict as Record<string, string>)[key];
      if (v != null) return v;
      const fallback = (DICTS.ko as Record<string, string>)[key];
      return fallback ?? key;
    },
    [locale],
  );

  const value = useMemo(
    () => ({ locale, setLocale, t }),
    [locale, setLocale, t],
  );

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    // Provider 없을 때도 동작은 하도록 (테스트·고립 컴포넌트 보호). t는 ko fallback.
    return {
      locale: "ko",
      setLocale: () => {
        /* noop without provider */
      },
      t: (key: DictKey) => {
        const v = (ko as Record<string, string>)[key];
        return v ?? key;
      },
    };
  }
  return ctx;
}
