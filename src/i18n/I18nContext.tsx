'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import { DEFAULT_LANG, Lang, STORAGE_KEY, messages } from '@/i18n/messages';

type I18nContextValue = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  toggle: () => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

function translate(lang: Lang, key: string, vars?: Record<string, string | number>): string {
  const template = messages[lang][key] ?? messages[DEFAULT_LANG][key] ?? key;
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, name: string) =>
    name in vars ? String(vars[name]) : `{${name}}`,
  );
}

// Module-level language store backing useSyncExternalStore. This keeps the
// first paint at DEFAULT_LANG ('ja') to match SSR, then React re-renders to the
// stored preference after hydration — without a setState-in-effect.
let currentLang: Lang = DEFAULT_LANG;
let initialized = false;
const listeners = new Set<() => void>();

function readStoredLang(): Lang {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === 'ja' || stored === 'en') return stored;
  } catch {
    /* localStorage unavailable */
  }
  return DEFAULT_LANG;
}

function getSnapshot(): Lang {
  // Initialize lazily on the first client read so the value is stable across
  // calls (required by useSyncExternalStore).
  if (!initialized) {
    initialized = true;
    currentLang = readStoredLang();
  }
  return currentLang;
}

function getServerSnapshot(): Lang {
  return DEFAULT_LANG;
}

function subscribe(callback: () => void): () => void {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

function setLangStore(next: Lang): void {
  if (next === currentLang) return;
  currentLang = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, next);
  } catch {
    /* localStorage unavailable */
  }
  listeners.forEach((listener) => listener());
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const lang = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((next: Lang) => setLangStore(next), []);
  const toggle = useCallback(() => setLangStore(currentLang === 'ja' ? 'en' : 'ja'), []);

  const value = useMemo<I18nContextValue>(
    () => ({
      lang,
      setLang,
      toggle,
      t: (key, vars) => translate(lang, key, vars),
    }),
    [lang, setLang, toggle],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return ctx;
}
