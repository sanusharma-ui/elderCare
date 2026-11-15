"use client";

import React, { useState } from "react";
import { useI18n, Locale } from "@/lib/i18n-provider";
import { Globe } from "lucide-react";

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { locale, setLocale } = useI18n();
  const [open, setOpen] = useState(false);

  const languages: { code: Locale; name: string }[] = [
    { code: "hi", name: "हिन्दी" },
    { code: "mr", name: "मराठी" },
    { code: "en", name: "English" },
  ];

  if (compact) {
    return (
      <div className="relative inline-block text-left">
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-surface border border-line rounded-xl text-sm font-medium text-ink hover:bg-paper active:scale-95 transition-all"
          aria-label="Change language"
        >
          <Globe className="w-4 h-4 text-forest" />
          <span>{languages.find((l) => l.code === locale)?.name}</span>
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
