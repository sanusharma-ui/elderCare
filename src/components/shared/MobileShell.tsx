"use client";

import React from "react";
import { BrandLogo } from "./BrandLogo";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { NotificationBell } from "./NotificationBell";

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
  return (
    <div className="min-h-screen bg-paper-2 flex justify-center items-center">
      {/* Side Brand Note for Wide Desktop Screens */}
      <aside className="hidden lg:flex flex-col justify-center max-w-xs mr-12 text-ink select-none">
        <div className="mb-4">
          <BrandLogo size="lg" />
        </div>
        <h2 className="font-displayDeva text-xl font-bold text-forest mb-2">
          मोबाइल केयर इंटरफ़ेस
        </h2>
        <p className="text-ink-muted text-sm leading-relaxed mb-4">
          बुजुर्गों, परिवार और केयरटेकरों के लिए विशेष रूप से डिज़ाइन किया गया मोबाइल ऐप। बड़ी स्क्रीन पर भी यह फोन के वास्तविक रूप में दिखाई देता है।
        </p>
        <div className="p-3 bg-surface border border-line rounded-xl text-xs text-ink-muted">
          <strong className="text-ink font-semibold">Native PWA View:</strong> Designed for 360px–430px phone viewports with touch-first interactions.
        </div>
      </aside>

      {/* Main Centered Phone Column */}
      <div className="w-full max-w-[430px] h-[100dvh] bg-paper sm:border sm:border-line sm:rounded-3xl sm:shadow-smriti-float flex flex-col overflow-hidden relative">
        {/* Sticky Header */}
        {!hideHeader && (
          <header className="pt-safe shrink-0 bg-surface/95 backdrop-blur-xs border-b border-line px-4 py-3 flex items-center justify-between z-20">
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
        <main className="flex-1 overflow-y-auto overscroll-y-contain flex flex-col">
          {children}
        </main>

        {/* Bottom Nav Container */}
        {bottomNav && (
          <nav className="shrink-0 bg-surface border-t border-line pb-safe z-30">
            {bottomNav}
          </nav>
        )}
      </div>
    </div>
  );
}
