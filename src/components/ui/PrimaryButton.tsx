"use client";

import React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface PrimaryButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg" | "elder";
  loading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export function PrimaryButton({
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  fullWidth = false,
  icon,
  children,
  className = "",
  ...props
}: PrimaryButtonProps) {
  const sizeStyles = {
    sm: "px-3.5 py-1.5 text-xs font-bold min-h-[34px]",
    md: "px-5 py-2.5 text-sm font-bold min-h-[40px]",
    lg: "px-6 py-3 text-base font-bold min-h-[44px]",
    elder: "px-7 py-3.5 text-lg font-bold min-h-[52px] tracking-wide",
  };

  const variantStyles = {
    primary:
      "bg-slate-900 text-white border border-slate-900 hover:bg-slate-800 active:scale-[0.99] shadow-sm",
    secondary:
      "bg-white text-slate-900 border border-slate-300 hover:bg-slate-50 hover:border-slate-400 active:scale-[0.99]",
    danger:
      "bg-rose-600 text-white border border-rose-600 hover:bg-rose-700 active:scale-[0.99] shadow-sm",
    ghost:
      "bg-transparent text-ink border border-transparent hover:bg-slate-100 hover:border-slate-200 active:scale-[0.99]",
  };

  return (
    <button
      disabled={disabled || loading}
      className={cn(
        "rounded-lg inline-flex items-center justify-center gap-2 transition-colors duration-150 select-none cursor-pointer disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100",
        fullWidth && "w-full",
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
