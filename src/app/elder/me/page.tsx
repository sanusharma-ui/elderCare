"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useAuth } from "@/hooks/use-auth";
import { useI18n, Locale } from "@/lib/i18n-provider";
import { apiClient } from "@/lib/api-client";
import { InviteCodeCard } from "@/components/shared/InviteCodeCard";
import { BottomSheet } from "@/components/shared/BottomSheet";
import {
  UserPlus,
  Users,
  KeyRound,
  ShieldAlert,
  Volume2,
  Type,
  Globe,
  Lock,
  LogOut,
  XCircle,
  Plus,
  HeartHandshake,
  Stethoscope,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface MemberItem {
  id: string;
  role: "DOCTOR" | "CARETAKER" | "FAMILY";
  user: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
  };
}

interface InviteItem {
  id: string;
  code: string;
  intendedRole: string;
  expiresAt: string;
  status: string;
}

export default function ElderMePage() {
  const t = useTranslations("elder");
  const tRoles = useTranslations("roles");
  const { user, refetch, logout } = useAuth();
  const { locale, setLocale } = useI18n();
  const queryClient = useQueryClient();

  const [inviteSheetOpen, setInviteSheetOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<"DOCTOR" | "CARETAKER" | "FAMILY">("FAMILY");
  const [newInvite, setNewInvite] = useState<InviteItem | null>(null);

  // Instant client-side state for Large Text & Voice Reminders (0ms lag, no DB blocking)
  const [largeText, setLargeText] = useState<boolean>(false);
  const [voiceReminders, setVoiceReminders] = useState<boolean>(true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const isLarge = localStorage.getItem("smriti_large_text") === "true";
      setLargeText(isLarge);
      const isVoice = localStorage.getItem("smriti_voice_reminders") !== "false";
      setVoiceReminders(isVoice);
    }
  }, []);

  const handleToggleLargeText = () => {
    const next = !largeText;
    setLargeText(next);
    localStorage.setItem("smriti_large_text", String(next));
    if (next) {
      document.documentElement.setAttribute("data-text-size", "large");
      document.body.setAttribute("data-text-size", "large");
    } else {
      document.documentElement.removeAttribute("data-text-size");
      document.body.removeAttribute("data-text-size");
    }
    toast.success(next ? "बड़ा फ़ॉन्ट और आइकन चालू (Large Size Enabled)" : "सामान्य आकार (Normal Size)");

    // Fire-and-forget background sync without blocking or refetching
    fetch("/api/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ largeTextMode: next }),
    }).catch(() => {});
  };

  const handleToggleVoiceReminders = () => {
    const next = !voiceReminders;
    setVoiceReminders(next);
    localStorage.setItem("smriti_voice_reminders", String(next));
    toast.success(next ? "आवाज़ में याद दिलाना चालू" : "आवाज़ में याद दिलाना बंद");

    fetch("/api/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ voiceReminders: next }),
    }).catch(() => {});
  };

  // Fetch Care Circle Members
  const { data: membersData } = useQuery<{ items: MemberItem[] }>({
    queryKey: ["elder-members", user?.id],
    queryFn: () => apiClient<{ items: MemberItem[] }>(`/api/elders/${user?.id}/members`),
    enabled: !!user?.id,
  });

  // Fetch Active Invites
  const { data: invitesData } = useQuery<{ items: InviteItem[] }>({
    queryKey: ["elder-invites", user?.id],
    queryFn: () => apiClient<{ items: InviteItem[] }>(`/api/elders/${user?.id}/invites`),
    enabled: !!user?.id,
  });

  // Toggle Preferences (Large text & Voice reminders)
  const updatePreferenceMutation = useMutation({
    mutationFn: (updates: { largeTextMode?: boolean; voiceReminders?: boolean }) =>
      apiClient("/api/me", {
        method: "PATCH",
        body: JSON.stringify(updates),
      }),
    onSuccess: () => {
      refetch();
      toast.success("सेटिंग्स अपडेट हो गई");
    },
  });

  // Generate Invite Code Mutation
  const createInviteMutation = useMutation({
    mutationFn: (intendedRole: "DOCTOR" | "CARETAKER" | "FAMILY") =>
      apiClient<InviteItem>(`/api/elders/${user?.id}/invites`, {
        method: "POST",
        body: JSON.stringify({ intendedRole }),
      }),
    onSuccess: (created) => {
      setNewInvite(created);
      queryClient.invalidateQueries({ queryKey: ["elder-invites"] });
      toast.success("नया पासकोड कोड तैयार हो गया!");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to generate invite");
    },
  });

  // Revoke Member Mutation
  const revokeMemberMutation = useMutation({
    mutationFn: (memberId: string) =>
      apiClient(`/api/elders/${user?.id}/members/${memberId}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["elder-members"] });
      toast.success("सदस्य की पहुंच हटा दी गई");
    },
  });

  const members = membersData?.items || [];
  const invites = invitesData?.items || [];

  return (
    <div className="p-4 sm:p-5 space-y-6">
      {/* Elder Profile Summary */}
      <div className="bg-surface border border-line rounded-3xl p-5 shadow-smriti flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-forest-soft flex items-center justify-center text-forest font-displayDeva font-bold text-2xl">
          {user?.name?.[0] || "बु"}
        </div>
        <div className="flex-1">
          <h1 className="font-displayDeva text-2xl font-bold text-ink leading-tight">
            {user?.name}
          </h1>
          <p className="text-sm text-ink-muted mt-0.5">
            {user?.phone || user?.email || "बुजुर्ग खाता"}
          </p>
        </div>
      </div>

      {/* Senior Accessibility Preferences */}
      <div className="bg-surface border border-line rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
        <h2 className="font-bold text-base text-ink flex items-center gap-2">
          <span>सुविधा और भाषा • Preferences</span>
        </h2>

        {/* Large Text Mode */}
        <div className="flex items-center justify-between py-2 border-b border-line/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-forest-soft text-forest flex items-center justify-center shrink-0">
              <Type className="w-5 h-5" />
            </div>
            <div>
              <span className="font-semibold text-ink text-sm sm:text-base block">
                {t("largeText")}
              </span>
              <span className="text-xs text-ink-muted">आंखों के लिए बड़े और स्पष्ट अक्षर</span>
            </div>
          </div>
          <button
            type="button"
            onClick={handleToggleLargeText}
            className={`w-14 h-8 flex items-center rounded-full p-1 transition-colors active:scale-95 ${
              largeText ? "bg-forest" : "bg-line"
            }`}
            title="Toggle Large Text & Icons"
            aria-label="Toggle Large Text"
          >
            <div
              className={`bg-surface w-6 h-6 rounded-full shadow-md transform transition-transform ${
                largeText ? "translate-x-6" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        {/* Voice Reminders */}
        <div className="flex items-center justify-between py-2 border-b border-line/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-forest-soft text-forest flex items-center justify-center shrink-0">
              <Volume2 className="w-5 h-5" />
            </div>
            <div>
              <span className="font-semibold text-ink text-sm sm:text-base block">
                {t("voiceReminders")}
              </span>
              <span className="text-xs text-ink-muted">दवा का समय होने पर बोलकर याद दिलाएं</span>
            </div>
          </div>
          <button
            type="button"
            onClick={handleToggleVoiceReminders}
            className={`w-14 h-8 flex items-center rounded-full p-1 transition-colors active:scale-95 ${
              voiceReminders ? "bg-forest" : "bg-line"
            }`}
            title="Toggle Voice Reminders"
            aria-label="Toggle Voice Reminders"
          >
            <div
              className={`bg-surface w-6 h-6 rounded-full shadow-md transform transition-transform ${
                voiceReminders ? "translate-x-6" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        {/* Language Chooser */}
        <div className="flex items-center justify-between py-1">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-forest-soft text-forest flex items-center justify-center shrink-0">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <span className="font-semibold text-ink text-sm sm:text-base block">
                भाषा • App Language
              </span>
              <span className="text-xs text-ink-muted">
                {locale === "hi" ? "हिन्दी" : locale === "mr" ? "मराठी" : "English"}
              </span>
            </div>
          </div>
          <div className="flex gap-1 bg-paper-2 p-1 rounded-xl border border-line">
            {(["hi", "mr", "en"] as const).map((l) => (
              <button
                key={l}
                onClick={() => setLocale(l)}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                  locale === l ? "bg-surface text-forest shadow-xs" : "text-ink-muted"
                }`}
              >
                {l === "hi" ? "हिन्दी" : l === "mr" ? "मराठी" : "Eng"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* CARE CIRCLE MANAGEMENT */}
      <div className="bg-surface border border-line rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-displayDeva text-xl font-bold text-ink">
              {t("circleTitle")}
            </h2>
            <p className="text-xs text-ink-muted mt-0.5">
              आपके साथ जुड़े परिवार के सदस्य, केयरटेकर और डॉक्टर
            </p>
          </div>

          <button
            onClick={() => {
              setNewInvite(null);
              setInviteSheetOpen(true);
            }}
            className="px-3.5 py-2 bg-forest text-surface text-xs font-bold rounded-xl flex items-center gap-1.5 hover:bg-forest-hover shadow-xs active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>जोड़ें • Add</span>
          </button>
        </div>

        {/* Active Members List */}
        <div className="space-y-2.5">
          {members.map((member) => (
            <div
              key={member.id}
              className="p-3 bg-paper rounded-xl border border-line flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-forest-soft text-forest flex items-center justify-center shrink-0">
                  {member.role === "DOCTOR" ? (
                    <Stethoscope className="w-5 h-5" />
                  ) : member.role === "CARETAKER" ? (
                    <HeartHandshake className="w-5 h-5" />
                  ) : (
                    <Users className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <span className="font-bold text-ink text-sm block">
                    {member.user.name}
                  </span>
                  <span className="text-[11px] font-semibold text-forest uppercase">
                    {tRoles(member.role)}
                  </span>
                </div>
              </div>

              <button
                onClick={() => {
                  if (confirm(t("revokeConfirm", { name: member.user.name }))) {
                    revokeMemberMutation.mutate(member.user.id);
                  }
                }}
                className="text-xs text-brick hover:bg-brick-soft px-2.5 py-1 rounded-lg border border-transparent hover:border-brick/20 font-medium transition-all"
              >
                हटाएं
              </button>
            </div>
          ))}

          {members.length === 0 && (
            <p className="text-xs text-ink-muted text-center py-4 bg-paper rounded-xl">
              अभी कोई सदस्य नहीं जुड़ा है। परिवार या डॉक्टर को जोड़ने के लिए ऊपर 'जोड़ें' बटन दबाएं।
            </p>
          )}
        </div>

        {/* Pending Invites List */}
        {invites.length > 0 && (
          <div className="pt-3 border-t border-line/60">
            <span className="text-xs font-bold text-ink block mb-2">
              सक्रिय पासकोड कोड • Pending Passcodes
            </span>
            <div className="space-y-2">
              {invites.map((inv) => (
                <div
                  key={inv.id}
                  className="p-3 bg-paper-2 rounded-xl border border-line flex items-center justify-between"
                >
                  <div>
                    <span className="font-mono font-extrabold text-forest text-base tracking-wider block">
                      {inv.code}
                    </span>
                    <span className="text-[10px] text-ink-muted">
                      {tRoles(inv.intendedRole as any)} के लिए • 48 घंटे में समाप्त
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Security & Account Links */}
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

      {/* BOTTOM SHEET FOR GENERATING NEW INVITE CODE */}
      <BottomSheet
        isOpen={inviteSheetOpen}
        onClose={() => setInviteSheetOpen(false)}
        title="केयर सर्कल में नया सदस्य जोड़ें"
      >
        {!newInvite ? (
          <div className="space-y-4">
            <p className="text-sm text-ink-muted">
              आप किसे जोड़ना चाहते हैं? भूमिका चुनें और पासकोड बनाएं:
            </p>

            <div className="grid grid-cols-3 gap-2">
              {(["FAMILY", "CARETAKER", "DOCTOR"] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setSelectedRole(r)}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    selectedRole === r
                      ? "border-forest bg-forest-soft text-forest font-bold"
                      : "border-line bg-paper-2 text-ink"
                  }`}
                >
                  <div className="text-xs font-bold leading-tight">
                    {r === "FAMILY" ? "परिवार" : r === "CARETAKER" ? "केयरटेकर" : "डॉक्टर"}
                  </div>
                </button>
              ))}
            </div>

            <button
              onClick={() => createInviteMutation.mutate(selectedRole)}
              disabled={createInviteMutation.isPending}
              className="w-full min-h-[50px] bg-forest text-surface font-bold rounded-xl mt-4 hover:bg-forest-hover active:scale-95 transition-all shadow-xs flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {createInviteMutation.isPending ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>पासकोड बन रहा है... • Generating Code</span>
                </>
              ) : (
                <span>पासकोड कोड बनाएं • Generate Code</span>
              )}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <InviteCodeCard
              code={newInvite.code}
              role={newInvite.intendedRole}
              expiresAt={newInvite.expiresAt}
            />

            <button
              onClick={() => setInviteSheetOpen(false)}
              className="w-full min-h-[46px] bg-paper-2 border border-line text-ink font-semibold rounded-xl hover:bg-paper"
            >
              पूर्ण • Done
            </button>
          </div>
        )}
      </BottomSheet>
    </div>
  );
}
