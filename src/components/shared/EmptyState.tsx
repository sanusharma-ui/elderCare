import React from "react";

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center glass-panel my-4 select-none">
      <div className="w-16 h-16 rounded-3xl bg-white/50 dark:bg-white/10 border border-white/60 dark:border-white/10 flex items-center justify-center mb-4 shadow-sm">
        <svg viewBox="0 0 48 48" className="w-8 h-8" fill="none">
          <path
            d="M24 10 C27 18 34 22 34 28 C34 33.5 29.5 38 24 38 C18.5 38 14 33.5 14 28 C14 22 21 18 24 10 Z"
            fill="rgba(37, 99, 235, 0.12)"
            stroke="#2563EB"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path
            d="M24 16 L24 34 M24 24 L29 20 M24 28 L19 24"
            stroke="#2563EB"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      </div>

      <h3 className="font-sans font-bold text-lg text-ink mb-1">{title}</h3>
      {description && (
        <p className="text-sm font-semibold text-ink-muted max-w-xs leading-relaxed mb-4">
          {description}
        </p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
