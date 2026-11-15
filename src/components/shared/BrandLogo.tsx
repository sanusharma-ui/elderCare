"use client";

import React from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";

export function BrandLogo({
  size = "md",
  href = "/",
}: {
  size?: "sm" | "md" | "lg";
  href?: string;
}) {
  const t = useTranslations("common");
  const iconSizes = {
    sm: "w-7 h-7",
    md: "w-8 h-8",
    lg: "w-10 h-10",
  };

  const textSizes = {
    sm: "text-base sm:text-lg",
    md: "text-lg sm:text-xl",
    lg: "text-xl sm:text-2xl",
  };

  const Content = (
    <div className="flex items-center gap-2 select-none group whitespace-nowrap">
      {/* Sleek Modern Care Icon in Blue/Indigo Pill */}
      <div
        className={`${iconSizes[size]} rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 dark:from-sky-500 dark:to-blue-600 flex items-center justify-center shadow-md shrink-0 relative overflow-hidden transition-transform group-hover:scale-105`}
      >
        <svg
          viewBox="0 0 24 24"
          className="w-4 h-4 sm:w-5 sm:h-5 text-white"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.3"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* Heart with medical pulse */}
          <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
          <path d="M12 7v6" stroke="#FFFFFF" strokeWidth="2.4" />
          <path d="M9 10h6" stroke="#FFFFFF" strokeWidth="2.4" />
        </svg>
      </div>

      {/* Brand Wordmark */}
      <div className="flex items-center gap-1.5">
        <span
          className={`font-sans font-black text-ink tracking-tight leading-none ${textSizes[size]}`}
        >
          Care<span className="text-accent-blue">Saathi</span>
        </span>
        <span className="hidden xs:inline-block text-[11px] font-bold text-ink-muted bg-white/70 dark:bg-white/10 px-1.5 py-0.5 rounded-md leading-none border border-white/60 dark:border-white/10">
          {t("brandHindi")}
        </span>
      </div>
    </div>
  );

  if (!href) return Content;

  return (
    <Link href={href} className="inline-flex focus-visible:outline-none">
      {Content}
    </Link>
  );
}
