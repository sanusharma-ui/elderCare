"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useAuth } from "@/hooks/use-auth";
import { useI18n, Locale } from "@/lib/i18n-provider";
import { apiClient } from "@/lib/api-client";
import { InviteCodeCard } from "@/components/shared/InviteCodeCard";
import { BottomSheet } from "@/components/shared/BottomSheet";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
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
  ChevronRight,
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

  // Instant client-side state for Large Text & Voice Reminders
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
    <div className="p-4 sm:p-6 space-y-6 max-w-2xl mx-auto">
      {/* Elder Profile Summary */}
      <GlassPanel variant="elder" className="rounded-[32px] p-6 flex items-center gap-5">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-black text-2xl flex items-center justify-center shadow-md shrink-0">
          {user?.name?.[0] || "CS"}
        </div>
        <div className="flex-1">
          <h1 className="font-displayDeva text-2xl sm:text-3xl font-black text-slate-900 dark:text-white leading-tight">
            {user?.name}
          </h1>
          <p className="text-sm sm:text-base font-bold text-blue-600 dark:text-blue-400 mt-1">
            {user?.phone || user?.email || (locale === "en" ? "Elder Account" : "बुजुर्ग खाता")}
          </p>
        </div>
      </GlassPanel>

      {/* Senior Accessibility Preferences */}
      <GlassPanel variant="elder" className="rounded-[32px] p-6 space-y-5">
        <h2 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
          <span>सुविधा और भाषा • Preferences</span>
        </h2>

        {/* Large Text Mode */}
        <div className="flex items-center justify-between py-2.5 border-b border-slate-200/50 dark:border-white/10">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Type className="w-6 h-6" />
            </div>
            <div>
              <span className="font-bold text-slate-900 dark:text-white text-base sm:text-lg block">
                {t("largeText")}
              </span>
              <span className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                {locale === "en" ? "Larger, readable fonts & icons" : "आंखों के लिए बड़े और स्पष्ट अक्षर"}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={handleToggleLargeText}
            className={`w-16 h-9 flex items-center rounded-full p-1 transition-colors active:scale-95 ${
              largeText ? "bg-slate-900 dark:bg-white" : "bg-slate-300 dark:bg-slate-700"
            }`}
            title="Toggle Large Text & Icons"
            aria-label="Toggle Large Text"
          >
            <div
              className={`w-7 h-7 rounded-full shadow-md transform transition-transform ${
                largeText ? "translate-x-7 bg-white dark:bg-slate-900" : "translate-x-0 bg-white"
              }`}
            />
          </button>
        </div>

        {/* Voice Reminders */}
        <div className="flex items-center justify-between py-2.5 border-b border-slate-200/50 dark:border-white/10">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Volume2 className="w-6 h-6" />
            </div>
            <div>
              <span className="font-bold text-slate-900 dark:text-white text-base sm:text-lg block">
                {t("voiceReminders")}
              </span>
              <span className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                {locale === "en" ? "Vernacular audio guidance & speech reminders" : "दवा का समय होने पर बोलकर याद दिलाएं"}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={handleToggleVoiceReminders}
            className={`w-16 h-9 flex items-center rounded-full p-1 transition-colors active:scale-95 ${
              voiceReminders ? "bg-slate-900 dark:bg-white" : "bg-slate-300 dark:bg-slate-700"
            }`}
            title="Toggle Voice Reminders"
            aria-label="Toggle Voice Reminders"
          >
            <div
              className={`w-7 h-7 rounded-full shadow-md transform transition-transform ${
                voiceReminders ? "translate-x-7 bg-white dark:bg-slate-900" : "translate-x-0 bg-white"
              }`}
            />
          </button>
        </div>

        {/* Language Chooser */}
        <div className="flex items-center justify-between py-1">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Globe className="w-6 h-6" />
            </div>
            <div>
              <span className="font-bold text-slate-900 dark:text-white text-base sm:text-lg block">
                भाषा • App Language
              </span>
              <span className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                {locale === "hi" ? "हिन्दी" : locale === "mr" ? "मराठी" : "English"}
              </span>
            </div>
          </div>
          <div className="flex gap-1.5 bg-white/60 dark:bg-white/10 p-1.5 rounded-full border border-slate-200/60 dark:border-white/10">
            {(["hi", "mr", "en"] as const).map((l) => (
              <button
                key={l}
                onClick={() => setLocale(l)}
                className={`px-3 py-1.5 text-xs sm:text-sm font-black rounded-full transition-all ${
                  locale === l
                    ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs"
                    : "text-slate-600 dark:text-slate-300 hover:text-slate-900"
                }`}
              >
                {l === "hi" ? "हिन्दी" : l === "mr" ? "मराठी" : "Eng"}
              </button>
            ))}
          </div>
        </div>
      </GlassPanel>

      {/* CARE CIRCLE MANAGEMENT */}
      <GlassPanel variant="elder" className="rounded-[32px] p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-displayDeva text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              {t("circleTitle")}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              आपके साथ जुड़े परिवार के सदस्य, केयरटेकर और डॉक्टर
            </p>
          </div>

          <PrimaryButton
            variant="primary"
            size="sm"
            onClick={() => {
              setNewInvite(null);
              setInviteSheetOpen(true);
            }}
            className="gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>जोड़ें • Add</span>
          </PrimaryButton>
        </div>

        {/* Active Members List */}
        <div className="space-y-3">
          {members.map((member) => (
            <div
              key={member.id}
              className="p-4 bg-white/50 dark:bg-white/5 rounded-2xl border border-white/60 dark:border-white/10 flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  {member.role === "DOCTOR" ? (
                    <Stethoscope className="w-5 h-5" />
                  ) : member.role === "CARETAKER" ? (
                    <HeartHandshake className="w-5 h-5" />
                  ) : (
                    <Users className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <span className="font-bold text-slate-900 dark:text-white text-sm sm:text-base block">
                    {member.user.name}
                  </span>
                  <span className="text-xs font-extrabold text-blue-600 dark:text-blue-400 uppercase">
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
                className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 px-3 py-1.5 rounded-full border border-transparent transition-all"
              >
                हटाएं
              </button>
            </div>
          ))}

          {members.length === 0 && (
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 text-center py-6 bg-white/40 dark:bg-white/5 rounded-2xl">
              अभी कोई सदस्य नहीं जुड़ा है। परिवार या डॉक्टर को जोड़ने के लिए ऊपर 'जोड़ें' बटन दबाएं।
            </p>
          )}
        </div>

        {/* Pending Invites List */}
        {invites.length > 0 && (
          <div className="pt-3 border-t border-slate-200/50 dark:border-white/10">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block mb-2">
              सक्रिय पासकोड कोड • Pending Passcodes
            </span>
            <div className="space-y-2">
              {invites.map((inv) => (
                <div
                  key={inv.id}
                  className="p-3.5 bg-white/50 dark:bg-white/5 rounded-2xl border border-white/60 dark:border-white/10 flex items-center justify-between"
                >
                  <div>
                    <span className="font-mono font-black text-blue-600 dark:text-blue-400 text-lg tracking-wider block">
                      {inv.code}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {tRoles(inv.intendedRole as any)} के लिए • 48 घंटे में समाप्त
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </GlassPanel>

      {/* Security & Account Links */}
      <div className="space-y-3">
        <Link
          href="/me/change-password"
          className="w-full p-4 sm:p-5 bg-white/60 dark:bg-white/5 border border-slate-200/70 dark:border-white/10 hover:bg-white/80 dark:hover:bg-white/10 rounded-2xl flex items-center justify-between text-slate-900 dark:text-white text-base font-bold transition-all shadow-xs"
        >
          <div className="flex items-center gap-3.5">
            <Lock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span>पासवर्ड बदलें • Change Password</span>
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
              लॉग आउट • Sign Out
            </span>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-400" />
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
            <p className="text-sm text-slate-600 dark:text-slate-400">
              आप किसे जोड़ना चाहते हैं? भूमिका चुनें और पासकोड बनाएं:
            </p>

            <div className="grid grid-cols-3 gap-2.5">
              {(["FAMILY", "CARETAKER", "DOCTOR"] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setSelectedRole(r)}
                  className={`p-3.5 rounded-2xl border text-center transition-all ${
                    selectedRole === r
                      ? "border-blue-600 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-black shadow-xs"
                      : "border-slate-200 dark:border-white/10 bg-white/40 dark:bg-white/5 text-slate-700 dark:text-slate-300"
                  }`}
                >
                  <div className="text-xs sm:text-sm font-bold leading-tight">
                    {r === "FAMILY" ? "परिवार" : r === "CARETAKER" ? "केयरटेकर" : "डॉक्टर"}
                  </div>
                </button>
              ))}
            </div>

            <PrimaryButton
              variant="primary"
              size="lg"
              onClick={() => createInviteMutation.mutate(selectedRole)}
              disabled={createInviteMutation.isPending}
              className="w-full mt-4"
            >
              {createInviteMutation.isPending ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  <span>पासकोड बन रहा है...</span>
                </>
              ) : (
                <span>पासकोड कोड बनाएं • Generate Code</span>
              )}
            </PrimaryButton>
          </div>
        ) : (
          <div className="space-y-4">
            <InviteCodeCard
              code={newInvite.code}
              role={newInvite.intendedRole}
              expiresAt={newInvite.expiresAt}
            />

            <PrimaryButton
              variant="secondary"
              onClick={() => setInviteSheetOpen(false)}
              className="w-full"
            >
              पूर्ण • Done
            </PrimaryButton>
          </div>
        )}
      </BottomSheet>
    </div>
  );
}
