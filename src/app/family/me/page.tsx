"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/lib/i18n-provider";
import { InstallPrompt } from "@/components/shared/InstallPrompt";
import { Users, Globe, Lock, LogOut } from "lucide-react";

export default function FamilyMePage() {
  const { user, logout } = useAuth();
  const { locale, setLocale } = useI18n();

  return (
    <div className="p-4 sm:p-5 space-y-6">
      {/* Profile Header */}
      <div className="bg-surface border border-line rounded-3xl p-5 shadow-smriti flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-forest-soft flex items-center justify-center text-forest font-bold text-2xl">
          <Users className="w-8 h-8" />
        </div>
        <div className="flex-1">
          <h1 className="font-bold text-ink text-xl leading-tight">
            {user?.name}
          </h1>
          <p className="text-xs text-ink-muted mt-0.5">
            परिवार खाता • {user?.email || user?.phone}
          </p>
        </div>
      </div>

      {/* Language Preference */}
      <div className="bg-surface border border-line rounded-2xl p-4 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-forest-soft text-forest flex items-center justify-center">
            <Globe className="w-5 h-5" />
          </div>
          <span className="font-semibold text-ink text-sm">भाषा • App Language</span>
        </div>
        <div className="flex gap-1 bg-paper-2 p-1 rounded-xl border border-line">
          {(["hi", "mr", "en"] as const).map((l) => (
            <button
              key={l}
              onClick={() => setLocale(l)}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                locale === l ? "bg-surface text-forest shadow-xs" : "text-ink-muted"
              }`}
            >
              {l === "hi" ? "हिन्दी" : l === "mr" ? "मराठी" : "Eng"}
            </button>
          ))}
        </div>
      </div>

      {/* Install Card */}
      <InstallPrompt />

      {/* Security & Logout */}
      <div className="space-y-2">
        <Link
          href="/me/change-password"
          className="w-full p-4 bg-surface border border-line hover:bg-paper-2 rounded-2xl flex items-center justify-between text-ink text-sm font-semibold transition-all shadow-xs"
        >
          <div className="flex items-center gap-3">
            <Lock className="w-5 h-5 text-forest" />
            <span>पासवर्ड बदलें • Change Password</span>
          </div>
          <span>&gt;</span>
        </Link>

        <button
          onClick={() => logout()}
          className="w-full p-4 bg-surface border border-line hover:bg-brick-soft hover:text-brick rounded-2xl flex items-center justify-between text-ink text-sm font-semibold transition-all shadow-xs"
        >
          <div className="flex items-center gap-3">
            <LogOut className="w-5 h-5 text-brick" />
            <span>लॉग आउट • Sign Out</span>
          </div>
          <span>&gt;</span>
        </button>
      </div>
    </div>
  );
}
