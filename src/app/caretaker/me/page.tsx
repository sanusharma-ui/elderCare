"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useCaretaker } from "@/components/caretaker/CaretakerContext";
import { useI18n } from "@/lib/i18n-provider";
import { apiClient } from "@/lib/api-client";
import { InviteCodeCard } from "@/components/shared/InviteCodeCard";
import { BottomSheet } from "@/components/shared/BottomSheet";
import { InstallPrompt } from "@/components/shared/InstallPrompt";
import {
  Users,
  Plus,
  Globe,
  Lock,
  LogOut,
  HeartHandshake,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export default function CaretakerMePage() {
  const { user, logout } = useAuth();
  const { selectedElder, selectedElderId } = useCaretaker();
  const { locale, setLocale } = useI18n();

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
      toast.success("परिवार के सदस्य के लिए पासकोड तैयार हो गया!");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to generate invite");
    },
  });

  return (
    <div className="p-4 sm:p-5 space-y-6">
      {/* Caretaker Profile Banner */}
      <div className="bg-surface border border-line rounded-3xl p-5 shadow-smriti flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-forest-soft flex items-center justify-center text-forest font-bold text-2xl">
          <HeartHandshake className="w-8 h-8" />
        </div>
        <div className="flex-1">
          <h1 className="font-bold text-ink text-xl leading-tight">
            {user?.name}
          </h1>
          <p className="text-xs text-ink-muted mt-0.5">
            केयरटेकर खाता • {user?.email || user?.phone}
          </p>
        </div>
      </div>

      {/* Invite Family Member for Current Elder */}
      {selectedElder && (
        <div className="bg-surface border border-line rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold text-base text-ink">
                परिवार को जोड़ें • Add Family Member
              </h2>
              <p className="text-xs text-ink-muted mt-0.5">
                बुजुर्ग <strong>{selectedElder.name}</strong> के परिवार को अलर्ट के लिए आमंत्रित करें।
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setCreatedInvite(null);
              setInviteSheetOpen(true);
            }}
            className="w-full min-h-[46px] bg-forest text-surface font-bold text-sm rounded-xl flex items-center justify-center gap-2 hover:bg-forest-hover active:scale-95 transition-all shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>परिवार का पासकोड बनाएं • Generate Family Passcode</span>
          </button>
        </div>
      )}

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

      {/* Links & Logout */}
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

      {/* Family Invite Sheet */}
      <BottomSheet
        isOpen={inviteSheetOpen}
        onClose={() => setInviteSheetOpen(false)}
        title="परिवार के लिए पासकोड"
      >
        {!createdInvite ? (
          <div className="space-y-4">
            <p className="text-sm text-ink-muted leading-relaxed">
              केयरटेकर केवल परिवार के सदस्यों के लिए पासकोड तैयार कर सकते हैं ताकि दवा छूटने पर उन्हें तुरंत सूचना मिल सके।
            </p>
            <button
              onClick={() => createFamilyInviteMutation.mutate()}
              disabled={createFamilyInviteMutation.isPending}
              className="w-full min-h-[50px] bg-forest text-surface font-bold rounded-xl hover:bg-forest-hover shadow-xs active:scale-95 transition-all"
            >
              {createFamilyInviteMutation.isPending ? "पासकोड बन रहा है..." : "पासकोड कोड जारी करें"}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <InviteCodeCard
              code={createdInvite.code}
              role="FAMILY"
              expiresAt={createdInvite.expiresAt}
            />
            <button
              onClick={() => setInviteSheetOpen(false)}
              className="w-full min-h-[46px] bg-paper-2 border border-line rounded-xl text-ink font-semibold"
            >
              पूर्ण • Done
            </button>
          </div>
        )}
      </BottomSheet>
    </div>
  );
}
