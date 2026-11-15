"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useCaretaker } from "@/components/caretaker/CaretakerContext";
import { apiClient } from "@/lib/api-client";
import { InviteCodeCard } from "@/components/shared/InviteCodeCard";
import { BottomSheet } from "@/components/shared/BottomSheet";
import { InstallPrompt } from "@/components/shared/InstallPrompt";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import {
  Users,
  Plus,
  Globe,
  Lock,
  LogOut,
  HeartHandshake,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";

export default function CaretakerMePage() {
  const { user, logout } = useAuth();
  const { selectedElder, selectedElderId } = useCaretaker();
  const t = useTranslations("common");
  const tCaretaker = useTranslations("caretakerNav");
  const tFamily = useTranslations("family");

  const [inviteSheetOpen, setInviteSheetOpen] = useState(false);
  const [createdInvite, setCreatedInvite] = useState<any | null>(null);

  // Generate Family Invite Mutation
  const createFamilyInviteMutation = useMutation({
    mutationFn: () =>
      apiClient(`/api/elders/${selectedElderId}/invites`, {
        method: "POST",
        body: JSON.stringify({ intendedRole: "FAMILY" }),
      }),
    onSuccess: (result) => {
      setCreatedInvite(result);
      toast.success(tFamily("linkedSuccess"));
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to generate invite");
    },
  });

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-2xl mx-auto">
      {/* Caretaker Profile Banner */}
      <GlassPanel variant="default" className="rounded-[32px] p-6 flex items-center gap-5">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-black text-2xl flex items-center justify-center shadow-md shrink-0">
          <HeartHandshake className="w-8 h-8" />
        </div>
        <div className="flex-1">
          <h1 className="font-bold text-slate-900 dark:text-white text-xl sm:text-2xl leading-tight">
            {user?.name}
          </h1>
          <p className="text-sm font-bold text-blue-600 dark:text-blue-400 mt-1">
            {tCaretaker("role")} • {user?.email || user?.phone}
          </p>
        </div>
      </GlassPanel>

      {/* Invite Family Member for Current Elder */}
      {selectedElder && (
        <GlassPanel variant="default" className="rounded-[32px] p-6 space-y-4">
          <div>
            <h2 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white">
              {tFamily("linkElder")}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              {tFamily("linkDescription")}
            </p>
          </div>

          <PrimaryButton
            variant="primary"
            onClick={() => {
              setCreatedInvite(null);
              setInviteSheetOpen(true);
            }}
            className="w-full gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>{tFamily("linkWithPasscode")}</span>
          </PrimaryButton>
        </GlassPanel>
      )}

      {/* Language Preference */}
      <GlassPanel variant="default" className="rounded-2xl p-4 sm:p-5 flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Globe className="w-5 h-5" />
          </div>
          <span className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">{t("language")}</span>
        </div>
        <LanguageSwitcher compact />
      </GlassPanel>

      {/* Install Card */}
      <InstallPrompt />

      {/* Links & Logout */}
      <div className="space-y-3">
        <Link
          href="/me/change-password"
          className="w-full p-4 sm:p-5 bg-white/60 dark:bg-white/5 border border-slate-200/70 dark:border-white/10 hover:bg-white/80 dark:hover:bg-white/10 rounded-2xl flex items-center justify-between text-slate-900 dark:text-white text-base font-bold transition-all shadow-xs"
        >
          <div className="flex items-center gap-3.5">
            <Lock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span>{t("changePassword")}</span>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-400" />
        </Link>

        <button
          onClick={() => logout()}
          className="w-full p-4 sm:p-5 bg-white/60 dark:bg-white/5 border border-slate-200/70 dark:border-white/10 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-2xl flex items-center justify-between text-slate-900 dark:text-white text-base font-bold transition-all shadow-xs group"
        >
          <div className="flex items-center gap-3.5">
            <LogOut className="w-5 h-5 text-rose-500 group-hover:scale-110 transition-transform" />
            <span className="group-hover:text-rose-600 dark:group-hover:text-rose-400">
              {t("logout")}
            </span>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-400" />
        </button>
      </div>

      {/* Family Invite Sheet */}
      <BottomSheet
        isOpen={inviteSheetOpen}
        onClose={() => setInviteSheetOpen(false)}
        title={tFamily("enterPasscode")}
      >
        {!createdInvite ? (
          <div className="space-y-4">
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              {tFamily("callSuggestion")}
            </p>
            <PrimaryButton
              variant="primary"
              size="lg"
              onClick={() => createFamilyInviteMutation.mutate()}
              disabled={createFamilyInviteMutation.isPending}
              className="w-full"
            >
              {createFamilyInviteMutation.isPending ? tFamily("verifying") : tFamily("linkBtn")}
            </PrimaryButton>
          </div>
        ) : (
          <div className="space-y-4">
            <InviteCodeCard
              code={createdInvite.code}
              role="FAMILY"
              expiresAt={createdInvite.expiresAt}
            />
            <PrimaryButton
              variant="secondary"
              onClick={() => setInviteSheetOpen(false)}
              className="w-full"
            >
              {t("close")}
            </PrimaryButton>
          </div>
        )}
      </BottomSheet>
    </div>
  );
}
