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
    <div className="flex flex-col items-center justify-center p-8 text-center bg-surface border border-line rounded-2xl my-4">
      <div className="w-16 h-16 rounded-2xl bg-paper-2 border border-line flex items-center justify-center mb-4">
        {/* Geometric Indian medicine leaf motif */}
        <svg viewBox="0 0 48 48" className="w-8 h-8" fill="none">
          <path
            d="M24 10 C27 18 34 22 34 28 C34 33.5 29.5 38 24 38 C18.5 38 14 33.5 14 28 C14 22 21 18 24 10 Z"
            fill="#DDEBE3"
            stroke="#1F5C4A"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path
            d="M24 16 L24 34 M24 24 L29 20 M24 28 L19 24"
            stroke="#1F5C4A"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </div>

      <h3 className="font-semibold text-lg text-ink mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-ink-muted max-w-xs leading-relaxed mb-4">
          {description}
        </p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
