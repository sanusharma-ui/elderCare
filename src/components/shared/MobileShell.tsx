"use client";

import React, { useState } from "react";
import { BrandLogo } from "./BrandLogo";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { NotificationBell } from "./NotificationBell";
import { ThemeToggle } from "./ThemeToggle";
import { Smartphone, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

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
  const t = useTranslations("shell");
  const [viewMode, setViewMode] = useState<"phone" | "wide">("phone");

  return (
    <div className="min-h-screen bg-transparent flex flex-col justify-center items-center py-0 sm:py-6 relative">
      {/* Desktop Tester Controls (Visible only on screens > 640px) */}
      <div className="hidden sm:flex items-center gap-2.5 mb-3 glass-pill px-3.5 py-1.5 z-30">
        <span className="text-xs font-bold text-ink-muted">{t("viewMode")}:</span>
        <button
          type="button"
          onClick={() => setViewMode("phone")}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all",
            viewMode === "phone"
              ? "bg-black text-white dark:bg-white dark:text-black shadow-xs"
              : "text-ink-muted hover:text-ink"
          )}
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>{t("phone")}</span>
        </button>
        <button
          type="button"
          onClick={() => setViewMode("wide")}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all",
            viewMode === "wide"
              ? "bg-black text-white dark:bg-white dark:text-black shadow-xs"
              : "text-ink-muted hover:text-ink"
          )}
        >
          <Monitor className="w-3.5 h-3.5" />
          <span>{t("wide")}</span>
        </button>
      </div>

      <div className="w-full flex justify-center items-center">
        {/* Side Brand Note for Wide Desktop Screens */}
        <aside className="hidden xl:flex flex-col justify-center max-w-xs mr-10 select-none glass-panel p-6">
          <div className="mb-4">
            <BrandLogo size="lg" />
          </div>
          <h2 className="font-sans text-xl font-black text-ink mb-2">
            Care<span className="text-accent-blue">Saathi</span> Mobile
          </h2>
          <p className="text-ink-muted text-sm leading-relaxed mb-4">
            {t("mobileDescription")}
          </p>
          <div className="p-3.5 glass-panel-subtle text-xs text-ink-muted space-y-1.5">
            <div className="flex items-center gap-2 text-accent-blue font-bold">
              <span className="w-2 h-2 rounded-full bg-accent-blue animate-pulse" />
              <span>{t("pwaReady")}</span>
            </div>
            <p>{t("touchTargets")}</p>
          </div>
        </aside>

        {/* Main Phone / Fluid Container */}
        <div
          className={cn(
            "w-full h-[100dvh] sm:h-[844px] bg-white/40 dark:bg-white/[0.03] backdrop-blur-3xl sm:border sm:border-white/70 dark:sm:border-white/10 sm:rounded-[36px] sm:shadow-2xl flex flex-col overflow-hidden relative transition-all duration-300 ease-out",
            viewMode === "phone" ? "max-w-[430px]" : "max-w-[720px]"
          )}
        >
          {/* Simulated Phone Top Speaker & Notch (Visible on desktop phone view) */}
          {viewMode === "phone" && (
            <div className="hidden sm:flex justify-center pt-2.5 pb-1 bg-white/30 dark:bg-white/5 border-b border-white/20 select-none">
              <div className="w-20 h-4 bg-ink/10 dark:bg-white/10 rounded-full flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-ink/20 dark:bg-white/20 mr-2" />
                <div className="w-8 h-1.5 rounded-full bg-ink/20 dark:bg-white/20" />
              </div>
            </div>
          )}

          {/* Sticky Header with Frosted Glass */}
          {!hideHeader && (
            <header className="pt-safe shrink-0 bg-white/60 dark:bg-slate-900/60 backdrop-blur-2xl border-b border-white/60 dark:border-white/10 px-4 py-3 flex items-center justify-between z-20 sticky top-0">
              <div className="flex items-center gap-2">
                <BrandLogo size="sm" href="/" />
                {roleBadge && (
                  <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-accent-blue/15 text-accent-blue border border-accent-blue/20">
                    {roleBadge}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <ThemeToggle compact />
                <LanguageSwitcher compact />
                <NotificationBell />
              </div>
            </header>
          )}

          {/* Scrollable Main Area */}
          <main className="flex-1 overflow-y-auto overscroll-y-contain flex flex-col">
            {children}
          </main>

          {/* Bottom Nav Container */}
          {bottomNav && (
            <nav className="shrink-0 bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl border-t border-white/60 dark:border-white/10 pb-safe z-30 shadow-lg">
              {bottomNav}
            </nav>
          )}
        </div>
      </div>
    </div>
  );
}
