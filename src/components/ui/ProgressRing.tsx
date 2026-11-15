"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface ProgressRingProps {
  value: number; // 0 to 100
  size?: number; // Diameter in px, default 76
  strokeWidth?: number; // default 6
  label?: string; // e.g. "Overall progress"
  sublabel?: string; // e.g. "7-day"
  showValueInside?: boolean;
  className?: string;
}

export function ProgressRing({
  value,
  size = 76,
  strokeWidth = 5.5,
  label = "Overall adherence",
  sublabel,
  showValueInside = true,
  className = "",
}: ProgressRingProps) {
  const clamped = Math.min(100, Math.max(0, Math.round(value)));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (clamped / 100) * circumference;

  return (
    <div className={cn("inline-flex items-center gap-3 select-none", className)}>
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="transform -rotate-90"
        >
          {/* Background track circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="transparent"
            className="text-white/30 dark:text-white/10"
          />
          {/* Animated active progress arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className="text-accent-blue dark:text-sky-400 transition-all duration-700 ease-out"
          />
        </svg>

        {showValueInside && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="font-black text-sm sm:text-base leading-none tracking-tight text-ink tabular-nums">
              {clamped}%
            </span>
          </div>
        )}
      </div>

      {label && (
        <div className="flex flex-col text-left">
          {!showValueInside && (
            <span className="font-black text-xl leading-tight text-ink tabular-nums">
              {clamped}%
            </span>
          )}
          <span className="text-[11px] font-bold text-ink-muted uppercase tracking-wider leading-tight">
            {label}
          </span>
        </div>
      )}
    </div>
  );
}
