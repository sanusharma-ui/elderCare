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
    ok: "bg-ok/10 text-ok border-ok/20",
    pending: "bg-forest-soft text-forest border-forest/20",
    missed: "bg-brick-soft text-brick border-brick/20",
    urgent: "bg-brick text-surface border-brick font-bold",
    warning: "bg-saffron-soft text-saffron border-saffron/20",
    neutral: "bg-paper-2 text-ink-muted border-line",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border",
        styles[variant],
        className
      )}
    >
      {variant !== "urgent" && (
        <span
          className={cn(
            "w-1.5 h-1.5 rounded-full",
            variant === "ok" && "bg-ok",
            variant === "pending" && "bg-forest",
            variant === "missed" && "bg-brick",
            variant === "warning" && "bg-saffron",
            variant === "neutral" && "bg-ink-muted"
          )}
        />
      )}
      <span>{label}</span>
    </span>
  );
}
