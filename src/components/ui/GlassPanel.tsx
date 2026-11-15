"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface GlassPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "subtle" | "elder" | "interactive";
  children: React.ReactNode;
  className?: string;
}

export function GlassPanel({
  variant = "default",
  children,
  className = "",
  ...props
}: GlassPanelProps) {
  const variantStyles = {
    // Default reference-matched frosted glass (blur-2xl, rounded-32px, translucent border)
    default: "glass-panel p-6 sm:p-7",
    // Subtle glass for secondary sections
    subtle: "glass-panel-subtle p-5 sm:p-6",
    // Performance-optimized for elder/caretaker screens (blur-xl, min 56px touch friendly)
    elder: "glass-panel-elder p-6 sm:p-8",
    // Interactive clickable glass card
    interactive:
      "glass-panel p-6 hover:border-accent-blue/50 active:scale-[0.99] transition-all duration-200 cursor-pointer",
  };

  return (
    <div
      className={cn(
        "relative overflow-hidden select-none transition-all duration-300",
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
