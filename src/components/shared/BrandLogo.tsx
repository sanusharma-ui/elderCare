import React from "react";
import Link from "next/link";

export function BrandLogo({
  size = "md",
  href = "/",
}: {
  size?: "sm" | "md" | "lg";
  href?: string;
}) {
  const iconSizes = {
    sm: "w-7 h-7",
    md: "w-8 h-8",
    lg: "w-9 h-9",
  };

  const textSizes = {
    sm: "text-base sm:text-lg",
    md: "text-lg sm:text-xl",
    lg: "text-xl sm:text-2xl",
  };

  const Content = (
    <div className="flex items-center gap-2 select-none group whitespace-nowrap">
      {/* Sleek Modern Care Icon */}
      <div
        className={`${iconSizes[size]} rounded-xl bg-forest flex items-center justify-center shadow-xs shrink-0 relative overflow-hidden`}
      >
        <svg
          viewBox="0 0 24 24"
          className="w-5 h-5 text-surface"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* Heart with medical cross and pulse */}
          <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
          <path d="M12 7v6" stroke="#E39B2B" strokeWidth="2.5" />
          <path d="M9 10h6" stroke="#E39B2B" strokeWidth="2.5" />
        </svg>
      </div>

      {/* Brand Wordmark (Single line, strictly no wrapping) */}
      <div className="flex items-center gap-1.5">
        <span
          className={`font-sans font-extrabold text-ink tracking-tight leading-none ${textSizes[size]}`}
        >
          Care<span className="text-forest">Saathi</span>
        </span>
        <span className="hidden xs:inline-block text-[11px] font-semibold text-ink-muted/80 bg-forest-soft/70 px-1.5 py-0.5 rounded-md leading-none border border-forest/15">
          केयर साथी
        </span>
      </div>
    </div>
  );

  if (!href) return Content;

  return (
    <Link href={href} className="inline-block focus:outline-none shrink-0">
      {Content}
    </Link>
  );
}
