"use client";

import React, { useState } from "react";
import { BrandLogo } from "./BrandLogo";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { NotificationBell } from "./NotificationBell";
import { Smartphone, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";

export function MobileShell({
  children,
  bottomNav,
  title,
  hideHeader = false,
  roleBadge,
}: {
  children: React.ReactNode;
  bottomNav?: React.ReactNode;
  title?: string;
  hideHeader?: boolean;
  roleBadge?: string;
}) {
  // Allow desktop testers to switch between realistic Phone frame and Expanded fluid view
  const [viewMode, setViewMode] = useState<"phone" | "wide">("phone");

  return (
    <div className="min-h-screen bg-paper-2 flex flex-col justify-center items-center py-0 sm:py-6 relative selection:bg-forest-soft">
      {/* Desktop Tester Controls (Visible only on screens > 640px) */}
      <div className="hidden sm:flex items-center gap-3 mb-3 bg-surface/90 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-line shadow-xs z-30">
        <span className="text-xs font-semibold text-ink-muted">Desktop View:</span>
        <button
          type="button"
          onClick={() => setViewMode("phone")}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all",
            viewMode === "phone"
              ? "bg-forest text-surface shadow-xs"
              : "text-ink-muted hover:text-ink hover:bg-paper"
          )}
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>Phone (430px)</span>
        </button>
        <button
          type="button"
          onClick={() => setViewMode("wide")}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all",
            viewMode === "wide"
              ? "bg-forest text-surface shadow-xs"
              : "text-ink-muted hover:text-ink hover:bg-paper"
          )}
        >
          <Monitor className="w-3.5 h-3.5" />
          <span>Wide Fluid (720px)</span>
        </button>
      </div>

      <div className="w-full flex justify-center items-center">
        {/* Side Brand Note for Wide Desktop Screens */}
        <aside className="hidden xl:flex flex-col justify-center max-w-xs mr-10 text-ink select-none animate-fade-in">
          <div className="mb-4">
            <BrandLogo size="lg" />
          </div>
          <h2 className="font-displayDeva text-xl font-bold text-forest mb-2">
            मोबाइल केयर इंटरफ़ेस
          </h2>
          <p className="text-ink-muted text-sm leading-relaxed mb-4">
            बुजुर्गों, परिवार और केयरटेकरों के लिए विशेष रूप से डिज़ाइन किया गया मोबाइल ऐप। बड़ी स्क्रीन पर भी यह फोन के वास्तविक रूप में दिखाई देता है।
          </p>
          <div className="p-3 bg-surface border border-line rounded-xl text-xs text-ink-muted space-y-1.5">
            <div className="flex items-center gap-1.5 text-forest font-bold">
              <span className="w-2 h-2 rounded-full bg-forest animate-pulse" />
              <span>PWA Ready & Responsive</span>
            </div>
            <p>Touch-optimized targets (≥56px), haptic vibrations, and speech synthesis.</p>
          </div>
        </aside>

        {/* Main Phone / Fluid Container */}
        <div
          className={cn(
            "w-full h-[100dvh] sm:h-[844px] bg-paper sm:border sm:border-line sm:rounded-[36px] sm:shadow-smriti-float flex flex-col overflow-hidden relative transition-all duration-300 ease-out",
            viewMode === "phone" ? "max-w-[430px]" : "max-w-[720px]"
          )}
        >
          {/* Simulated Phone Top Speaker & Notch (Visible on desktop phone view) */}
          {viewMode === "phone" && (
            <div className="hidden sm:flex justify-center pt-2 pb-1 bg-surface border-b border-line/30 select-none">
              <div className="w-20 h-4 bg-ink/10 rounded-full flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-ink/20 mr-2" />
                <div className="w-8 h-1.5 rounded-full bg-ink/20" />
              </div>
            </div>
          )}

          {/* Sticky Header */}
          {!hideHeader && (
            <header className="pt-safe shrink-0 bg-surface/95 backdrop-blur-md border-b border-line px-4 py-3 flex items-center justify-between z-20">
              <div className="flex items-center gap-2">
                <BrandLogo size="sm" href="/" />
                {roleBadge && (
                  <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-forest-soft text-forest border border-forest/20">
                    {roleBadge}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <LanguageSwitcher compact />
                <NotificationBell />
              </div>
            </header>
          )}

          {/* Scrollable Main Area */}
          <main className="flex-1 overflow-y-auto overscroll-y-contain flex flex-col animate-fade-in">
            {children}
          </main>

          {/* Bottom Nav Container */}
          {bottomNav && (
            <nav className="shrink-0 bg-surface border-t border-line pb-safe z-30 shadow-xs">
              {bottomNav}
            </nav>
          )}
        </div>
      </div>
    </div>
  );
}
