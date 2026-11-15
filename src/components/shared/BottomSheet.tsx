"use client";

import React, { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export function BottomSheet({
  isOpen,
  onClose,
  title,
  children,
  className,
}: {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") onClose();
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => {
        document.body.style.overflow = "";
        window.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-ink/40 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={onClose}
      />

      {/* Sheet Container */}
      <div
        className={cn(
          "relative w-full max-w-[430px] max-h-[85dvh] bg-surface border-t border-line rounded-t-3xl shadow-smriti-sheet flex flex-col z-10 animate-in slide-in-from-bottom duration-200 pb-safe",
          className
        )}
      >
        {/* Grab Handle */}
        <div className="w-12 h-1.5 bg-line rounded-full mx-auto mt-3 mb-2 shrink-0" />

        {/* Header */}
        {title && (
          <div className="px-6 py-3 border-b border-line flex items-center justify-between shrink-0">
            <h3 className="font-semibold text-lg text-ink">{title}</h3>
            <button
              onClick={onClose}
              className="p-1 text-ink-muted hover:text-ink rounded-full active:bg-paper-2"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  );
}
