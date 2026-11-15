"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { NextIntlClientProvider } from "next-intl";
import enMessages from "@/messages/en.json";
import hiMessages from "@/messages/hi.json";
import mrMessages from "@/messages/mr.json";

export type Locale = "en" | "hi" | "mr";

const messagesMap: Record<Locale, any> = {
  en: enMessages,
  hi: hiMessages,
  mr: mrMessages,
};

interface I18nContextType {
  locale: Locale;
  setLocale: (newLocale: Locale) => Promise<void>;
}

const I18nContext = createContext<I18nContextType>({
  locale: "hi",
  setLocale: async () => {},
});

export const useI18n = () => useContext(I18nContext);

export function I18nProvider({
  initialLocale = "hi",
  children,
}: {
  initialLocale?: Locale;
  children: React.ReactNode;
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  useEffect(() => {
    // Read cookie on mount if present
    const cookieMatch = document.cookie.match(/(?:^|;\s*)NEXT_LOCALE=([^;]+)/);
    if (cookieMatch) {
      const saved = cookieMatch[1] as Locale;
      if (["en", "hi", "mr"].includes(saved)) {
        setLocaleState(saved);
      }
    }
  }, []);

  const setLocale = async (newLocale: Locale) => {
    setLocaleState(newLocale);
    // Persist to cookie (1 year expiry)
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;

    // Non-blocking fire-and-forget sync with /api/me (0ms UI delay)
    fetch("/api/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ language: newLocale }),
    }).catch(() => {});
  };

  const currentMessages = messagesMap[locale] || messagesMap.hi;

  return (
    <I18nContext.Provider value={{ locale, setLocale }}>
      <NextIntlClientProvider locale={locale} messages={currentMessages} timeZone="Asia/Kolkata">
        {children}
      </NextIntlClientProvider>
    </I18nContext.Provider>
  );
}
