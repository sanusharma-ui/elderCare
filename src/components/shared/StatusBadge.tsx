import React from "react";
import { cn } from "@/lib/utils";

export type StatusVariant =
  | "ok"
  | "pending"
  | "missed"
  | "urgent"
  | "warning"
  | "neutral";

export function StatusBadge({
  variant,
  label,
  className,
}: {
  variant: StatusVariant;
  label: string;
  className?: string;
}) {
  const styles: Record<StatusVariant, string> = {
    ok: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/25",
    pending: "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/25",
    missed: "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/25",
    urgent: "bg-rose-600 text-white border-rose-600 font-black shadow-xs",
    warning: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/25",
    neutral: "glass-pill text-ink-muted border-white/60 dark:border-white/10",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-colors select-none",
        styles[variant],
        className
      )}
    >
      {variant !== "urgent" && (
        <span
          className={cn(
            "w-1.5 h-1.5 rounded-full shrink-0",
            variant === "ok" && "bg-emerald-500",
            variant === "pending" && "bg-blue-500",
            variant === "missed" && "bg-rose-500",
            variant === "warning" && "bg-amber-500",
            variant === "neutral" && "bg-ink-muted"
          )}
        />
      )}
      <span>{label}</span>
    </span>
  );
}
