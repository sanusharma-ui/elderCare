"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface StatItemData {
  id?: string;
  label: string;
  value: string | number;
  subtext?: string;
  icon?: React.ReactNode;
  color?: "default" | "ok" | "alert" | "danger" | "blue" | "accent" | "warning";
  isElder?: boolean;
}

interface StatGroupProps {
  items?: StatItemData[];
  stats?: StatItemData[];
  columns?: 2 | 3 | 4 | 5;
  className?: string;
  isElder?: boolean;
}

export function StatItem({
  label,
  value,
  subtext,
  icon,
  color = "default",
  isElder = false,
}: StatItemData) {
  const normalizedColor = color === "accent" ? "blue" : color === "warning" ? "alert" : color;
  const valueColorStyles = {
    default: "text-ink",
    blue: "text-accent-blue dark:text-sky-400",
    ok: "text-emerald-600 dark:text-emerald-400",
    alert: "text-amber-500 dark:text-amber-400",
    danger: "text-rose-500 dark:text-rose-400",
  };

  return (
    <div className="flex flex-col select-none py-2 px-1">
      {/* Label above or below (Refined hierarchy from reference) */}
      <div className="flex items-center gap-1.5 mb-1 text-ink-muted">
        {icon && <span className="shrink-0">{icon}</span>}
        <span
          className={cn(
            "font-semibold tracking-wide",
            isElder ? "text-[15px] sm:text-base text-ink/90 font-bold" : "text-xs uppercase tracking-wider text-ink-muted font-bold"
          )}
        >
          {label}
        </span>
      </div>

      {/* Large Open Stat Number (NO BOX AROUND IT) */}
      <div className="flex items-baseline gap-2">
        <span
          className={cn(
            "font-black tracking-tight leading-none tabular-nums",
            isElder ? "text-4xl sm:text-5xl" : "text-3xl sm:text-4xl lg:text-5xl",
            valueColorStyles[normalizedColor]
          )}
        >
          {value}
        </span>
        {subtext && (
          <span className="text-xs font-semibold text-ink-muted truncate">
            {subtext}
          </span>
        )}
      </div>
    </div>
  );
}

export function StatGroup({
  items,
  stats,
  columns = 4,
  className = "",
  isElder = false,
}: StatGroupProps) {
  const statList = items || stats || [];
  const colClass = {
    2: "grid-cols-2",
    3: "grid-cols-2 sm:grid-cols-3",
    4: "grid-cols-2 sm:grid-cols-4",
    5: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5",
  }[columns];

  return (
    <div
      className={cn(
        "grid gap-4 sm:gap-6 divide-y sm:divide-y-0 sm:divide-x divide-white/40 dark:divide-white/10 w-full py-2",
        colClass,
        className
      )}
    >
      {statList.map((stat, idx) => (
        <div key={stat.id || idx} className={idx > 0 ? "pt-3 sm:pt-0 sm:pl-4 lg:pl-6" : ""}>
          <StatItem {...stat} isElder={isElder || stat.isElder} />
        </div>
      ))}
    </div>
  );
}
