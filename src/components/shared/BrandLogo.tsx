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
    md: "w-9 h-9",
    lg: "w-11 h-11",
  };

  const textSizes = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl",
  };

  const Content = (
    <div className="flex items-center gap-2.5 select-none group">
      <div
        className={`${iconSizes[size]} rounded-xl bg-forest flex items-center justify-center shadow-xs shrink-0 relative overflow-hidden`}
      >
        <svg
          viewBox="0 0 512 512"
          className="w-full h-full p-1"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Saffron diya flame / medicinal leaf */}
          <path
            d="M256 96 C296 176 348 232 348 296 C348 352 308 392 256 392 C204 392 164 352 164 296 C164 232 216 176 256 96 Z"
            fill="#E39B2B"
          />
          {/* Inner calming pill leaf center */}
          <path
            d="M256 160 C274 216 304 256 304 300 C304 336 280 360 256 360 C232 360 208 336 208 300 C208 256 238 216 256 160 Z"
            fill="#FFFDF7"
            opacity="0.95"
          />
          {/* Warm base tablet */}
          <rect x="180" y="328" width="152" height="44" rx="22" fill="#FAF5EA" />
          <circle cx="256" cy="350" r="8" fill="#1F5C4A" />
        </svg>
      </div>

      <div className="flex flex-col">
        <span
          className={`font-displayDeva font-bold text-ink leading-tight ${textSizes[size]}`}
        >
          स्मृति <span className="text-ink-muted font-normal text-[0.85em] font-sans">· Smriti</span>
        </span>
      </div>
    </div>
  );

  if (!href) return Content;

  return (
    <Link href={href} className="inline-block focus:outline-none">
      {Content}
    </Link>
  );
}
