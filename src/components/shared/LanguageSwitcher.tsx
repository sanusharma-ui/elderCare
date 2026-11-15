"use client";

import React, { useState } from "react";
import { useI18n, Locale } from "@/lib/i18n-provider";
import { Globe } from "lucide-react";

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { locale, setLocale } = useI18n();
  const [open, setOpen] = useState(false);

  const languageNames: Record<Locale, Record<Locale, string>> = {
    en: { en: "English", hi: "Hindi", mr: "Marathi" },
    hi: { en: "अंग्रेज़ी", hi: "हिन्दी", mr: "मराठी" },
    mr: { en: "इंग्रजी", hi: "हिंदी", mr: "मराठी" },
  };
  const languages: { code: Locale; name: string }[] = (["hi", "mr", "en"] as Locale[]).map(
    (code) => ({ code, name: languageNames[locale][code] })
  );

  if (compact) {
    return (
      <div className="relative inline-block text-left">
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 bg-surface/90 backdrop-blur-md border border-line rounded-xl text-xs sm:text-sm font-semibold text-ink hover:bg-paper active:scale-95 transition-all shadow-xs"
          aria-label={locale === "en" ? "Change language" : locale === "hi" ? "भाषा बदलें" : "भाषा बदला"}
        >
          <Globe className="w-3.5 h-3.5 text-forest" />
          <span className="hidden sm:inline">{languages.find((l) => l.code === locale)?.name}</span>
          <span className="sm:hidden uppercase tracking-wider">{locale}</span>
        </button>

        {open && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setOpen(false)}
            />
            <div className="absolute right-0 mt-1.5 w-36 bg-surface border border-line rounded-xl shadow-smriti-float z-50 py-1 overflow-hidden">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    setLocale(lang.code);
                    setOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between ${
                    locale === lang.code
                      ? "bg-forest-soft text-forest font-semibold"
                      : "text-ink hover:bg-paper"
                  }`}
                >
                  <span>{lang.name}</span>
                  {locale === lang.code && (
                    <span className="w-2 h-2 rounded-full bg-forest" />
                  )}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center p-1 bg-paper-2 border border-line rounded-xl gap-1">
      {languages.map((lang) => (
        <button
          key={lang.code}
          onClick={() => setLocale(lang.code)}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
            locale === lang.code
              ? "bg-surface text-forest font-semibold shadow-xs"
              : "text-ink-muted hover:text-ink"
          }`}
        >
          {lang.name}
        </button>
      ))}
    </div>
  );
}
