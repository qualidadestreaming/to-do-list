"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { NextIntlClientProvider } from "next-intl";
import { LOCALE_COOKIE, loadMessages, type Locale } from "@/lib/i18n/config";

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale precisa estar dentro de <LocaleProvider>");
  return ctx;
}

export function LocaleProvider({
  initialLocale,
  initialMessages,
  children,
}: {
  initialLocale: Locale;
  initialMessages: Record<string, unknown>;
  children: ReactNode;
}) {
  const [locale, setLocaleState] = useState(initialLocale);
  const [messages, setMessages] = useState(initialMessages);

  const setLocale = useCallback((next: Locale) => {
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
    loadMessages(next).then((nextMessages) => {
      setMessages(nextMessages);
      setLocaleState(next);
    });
  }, []);

  const value = useMemo(() => ({ locale, setLocale }), [locale, setLocale]);

  return (
    <LocaleContext.Provider value={value}>
      <NextIntlClientProvider locale={locale} messages={messages} timeZone="America/Manaus">
        {children}
      </NextIntlClientProvider>
    </LocaleContext.Provider>
  );
}
