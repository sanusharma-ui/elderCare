"use client";

import React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface PrimaryButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg" | "elder";
  loading?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export function PrimaryButton({
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  icon,
  children,
  className = "",
  ...props
}: PrimaryButtonProps) {
  const sizeStyles = {
    sm: "px-4 py-2 text-xs font-bold min-h-[38px]",
    md: "px-6 py-3.5 text-sm font-bold min-h-[46px]",
    lg: "px-8 py-4 text-base font-bold min-h-[52px]",
    // Senior accessible 56px minimum touch target
    elder: "px-8 py-4 text-lg font-bold min-h-[58px] tracking-wide",
  };

  const variantStyles = {
    // Reference signature: Solid black pill in light mode, solid white pill in dark mode
    primary:
      "bg-black text-white hover:bg-neutral-800 active:scale-97 dark:bg-white dark:text-black dark:hover:bg-neutral-200 shadow-lg shadow-black/15 dark:shadow-white/10",
    secondary:
      "glass-pill text-ink hover:border-accent-blue/40 active:scale-97 shadow-sm",
    danger:
      "bg-rose-600 text-white hover:bg-rose-700 active:scale-97 shadow-md",
    ghost:
      "bg-transparent text-ink hover:bg-white/30 dark:hover:bg-white/10 active:scale-97",
  };

  return (
    <button
      disabled={disabled || loading}
      className={cn(
        "rounded-full inline-flex items-center justify-center gap-2.5 transition-all duration-150 select-none cursor-pointer disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100",
        sizeStyles[size],
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin shrink-0" />
          <span>{children}</span>
        </>
      ) : (
        <>
          {icon && <span className="shrink-0">{icon}</span>}
          <span>{children}</span>
        </>
      )}
    </button>
  );
}
