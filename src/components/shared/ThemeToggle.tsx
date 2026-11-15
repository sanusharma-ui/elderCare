"use client";

import React, { useEffect, useState } from "react";
import { useTheme } from "./ThemeProvider";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle({
  className = "",
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  const { resolvedTheme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div
        className={`w-9 h-9 rounded-full bg-white/40 dark:bg-white/10 border border-white/60 dark:border-white/10 ${className}`}
      />
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`glass-pill p-2 flex items-center justify-center text-ink hover:text-accent-blue active:scale-95 transition-all select-none ${
        compact ? "w-9 h-9" : "px-3 py-1.5 gap-1.5 text-xs font-bold"
      } ${className}`}
      title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
      aria-label="Toggle Dark Mode"
    >
      {isDark ? (
        <>
          <Sun className="w-4 h-4 text-amber-400 transition-transform rotate-0" />
          {!compact && <span>Light</span>}
        </>
      ) : (
        <>
          <Moon className="w-4 h-4 text-accent-blue transition-transform -rotate-12" />
          {!compact && <span>Dark</span>}
        </>
      )}
    </button>
  );
}
