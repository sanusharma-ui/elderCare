"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { InstallPrompt } from "@/components/shared/InstallPrompt";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { useTranslations } from "next-intl";
import { Users, Globe, Lock, LogOut, ChevronRight, Shield } from "lucide-react";
import { GlassPanel } from "@/components/ui/GlassPanel";

export default function FamilyMePage() {
  const { user, logout } = useAuth();
  const t = useTranslations("common");
  const tRoles = useTranslations("roles");

  return (
    <div className="p-4 sm:p-5 space-y-5">
      {/* Profile Header in GlassPanel */}
      <GlassPanel variant="default" className="p-6 rounded-[32px] flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-accent-blue/15 text-accent-blue border border-accent-blue/20 flex items-center justify-center font-bold text-2xl shadow-inner shrink-0">
          <Users className="w-8 h-8" />
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-[11px] font-bold uppercase tracking-wider text-accent-blue">
            {tRoles("FAMILY")}
          </span>
          <h1 className="font-black text-ink text-xl sm:text-2xl leading-tight truncate">
            {user?.name}
          </h1>
          <p className="text-xs font-semibold text-ink-muted mt-0.5 truncate">
            {user?.email || user?.phone}
          </p>
        </div>
      </GlassPanel>

      {/* Preferences Section */}
      <div className="space-y-2.5">
        <h2 className="text-xs font-bold uppercase tracking-wider text-ink-muted px-1">
          Preferences & Appearance
        </h2>

        {/* Language Preference */}
        <GlassPanel variant="subtle" className="p-4 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/60 dark:bg-white/10 text-ink flex items-center justify-center border border-white/60 dark:border-white/10">
              <Globe className="w-4 h-4 text-accent-blue" />
            </div>
            <div>
              <span className="font-bold text-ink text-sm block">{t("language")}</span>
              <span className="text-[11px] text-ink-muted">Hindi, Marathi, English</span>
            </div>
          </div>
          <LanguageSwitcher compact />
        </GlassPanel>
      </div>

      {/* Install Card */}
      <InstallPrompt />

      {/* Security & Logout */}
      <div className="space-y-2.5">
        <h2 className="text-xs font-bold uppercase tracking-wider text-ink-muted px-1">
          Account & Security
        </h2>

        <Link
          href="/me/change-password"
          className="w-full p-4 bg-white/60 dark:bg-white/[0.04] backdrop-blur-xl border border-white/60 dark:border-white/10 hover:bg-white/80 dark:hover:bg-white/[0.08] rounded-2xl flex items-center justify-between text-ink text-sm font-bold transition-all shadow-xs group"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-accent-blue/15 text-accent-blue flex items-center justify-center border border-accent-blue/20">
              <Lock className="w-4 h-4" />
            </div>
            <span>{t("changePassword")}</span>
          </div>
          <ChevronRight className="w-5 h-5 text-ink-muted group-hover:translate-x-0.5 transition-transform" />
        </Link>

        <button
          onClick={() => logout()}
          className="w-full p-4 bg-white/60 dark:bg-white/[0.04] backdrop-blur-xl border border-white/60 dark:border-white/10 hover:bg-rose-500/10 hover:border-rose-500/30 rounded-2xl flex items-center justify-between text-ink text-sm font-bold transition-all shadow-xs group"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-500/15 text-rose-500 flex items-center justify-center border border-rose-500/20">
              <LogOut className="w-4 h-4" />
            </div>
            <span className="group-hover:text-rose-500 transition-colors">{t("logout")}</span>
          </div>
          <ChevronRight className="w-5 h-5 text-ink-muted group-hover:text-rose-500 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
    </div>
  );
}
