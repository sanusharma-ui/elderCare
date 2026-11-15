"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { apiClient } from "@/lib/api-client";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { Skeleton, SkeletonCard } from "@/components/shared/Skeleton";
import { RedeemInviteModal } from "@/components/doctor/RedeemInviteModal";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { StatGroup } from "@/components/ui/StatGroup";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { ProgressRing } from "@/components/ui/ProgressRing";
import {
  Users,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  FileText,
  Sparkles,
  RefreshCw,
  Search,
  ArrowRight,
  Bot,
  Send,
  UserPlus,
  Loader2,
  KeyRound,
} from "lucide-react";
import { toast } from "sonner";

interface PatientAttentionItem {
  elderId: string;
  name: string;
  language: string;
  adherencePercentage: number | null;
  riskScore: number;
  missedDoses7d: number;
  currentMissStreak: number;
  unseenNotesCount: number;
  lowStockCount: number;
  reasons: string[];
}

interface DoctorDashboardData {
  totalPatients: number;
  onTrack: number;
  needsAttention: number;
  critical: number;
  unseenNotesCount: number;
  dosesMissedToday: number;
  attentionList: PatientAttentionItem[];
}

interface AiBriefData {
  briefDate: string;
  content: string;
  stats: any;
  source: string;
  disclaimer: string;
}

interface AskResponse {
  answer: string;
  toolsUsed: string[];
  disclaimer: string;
}

export default function DoctorDashboardPage() {
  const t = useTranslations("doctor");
  const queryClient = useQueryClient();

  const [askQuestion, setAskQuestion] = useState("");
  const [askResult, setAskResult] = useState<AskResponse | null>(null);
  const [redeemOpen, setRedeemOpen] = useState(false);

  // 1. Fetch Aggregated Metrics & Needs Attention List
  const {
    data: metrics,
    isLoading: metricsLoading,
    refetch: refetchMetrics,
  } = useQuery<DoctorDashboardData>({
    queryKey: ["doctor-dashboard-metrics"],
    queryFn: () => apiClient<DoctorDashboardData>("/api/doctor/dashboard"),
    refetchInterval: 30000,
  });

  // 2. Fetch Daily AI Brief
  const {
    data: brief,
    isLoading: briefLoading,
  } = useQuery<AiBriefData>({
    queryKey: ["doctor-ai-brief"],
    queryFn: () => apiClient<AiBriefData>("/api/doctor/daily-brief"),
    staleTime: 1000 * 60 * 60,
  });

  // 3. Mutation: Force Regenerate AI Daily Brief
  const refreshBriefMutation = useMutation({
    mutationFn: () =>
      apiClient<AiBriefData>("/api/doctor/daily-brief", {
        method: "POST",
      }),
    onSuccess: (data) => {
      queryClient.setQueryData(["doctor-ai-brief"], data);
      toast.success(t("briefRefreshSuccess"));
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to regenerate brief");
    },
  });

  // 4. Mutation: Ask CareSaathi Assistant
  const askMutation = useMutation({
    mutationFn: (question: string) =>
      apiClient<AskResponse>("/api/doctor/ask", {
        method: "POST",
        body: JSON.stringify({ question }),
      }),
    onSuccess: (data) => {
      setAskResult(data);
      toast.success("CareSaathi AI ने विश्लेषण पूरा किया");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to get AI answer");
    },
  });

  const handleAskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!askQuestion.trim()) return;
    askMutation.mutate(askQuestion.trim());
  };

  const reasonLabels: Record<string, string> = {
    URGENT_NOTE: "गंभीर नोट (Urgent Note)",
    LOW_ADHERENCE: "कम अनुपालन (< 75%)",
    MISS_STREAK: "दवा छूटी (Streak > 2)",
    LOW_STOCK: "स्टॉक समाप्त होने वाला है",
  };

  // Calculate cohort average adherence for the progress ring
  const cohortAdherence =
    metrics && metrics.totalPatients > 0
      ? Math.round((metrics.onTrack / metrics.totalPatients) * 100)
      : 0;

  const todayFormatted = new Date().toLocaleDateString("en-IN", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="space-y-8">
      {/* HEADER SECTION (REFERENCE LOOK) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2">
        <div>
          <span className="text-xs uppercase font-extrabold tracking-wider text-blue-600 dark:text-blue-400 block mb-1">
            CareSaathi Clinical Suite
          </span>
          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
            Dashboard
          </h1>
          <p className="text-sm sm:text-base font-bold text-blue-600 dark:text-blue-400 mt-1">
            {todayFormatted} • समस्त पंजीकृत बुजुर्गों की दैनिक निगरानी
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Cohort Adherence Gauge */}
          <div className="hidden sm:flex items-center gap-3 pr-2 mr-2 border-r border-slate-200/60 dark:border-white/10">
            <ProgressRing
              value={cohortAdherence}
              size={68}
              strokeWidth={6}
              label="Cohort On-Track"
            />
          </div>

          <PrimaryButton
            variant="secondary"
            size="md"
            onClick={() => setRedeemOpen(true)}
            className="gap-2"
          >
            <KeyRound className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>पासकोड से मरीज जोड़ें • Redeem Code</span>
          </PrimaryButton>

          <Link href="/doctor/patients/new">
            <PrimaryButton variant="primary" size="md" className="gap-2">
              <UserPlus className="w-4 h-4" />
              <span>{t("registerPatient")}</span>
            </PrimaryButton>
          </Link>
        </div>
      </div>

      {/* STATS STRIP: STRICTLY NO BOXES OR INDIVIDUAL CARDS (REFERENCE RULE) */}
      <StatGroup
        columns={5}
        items={[
          {
            label: t("statTotalPatients"),
            value: metricsLoading ? "—" : metrics?.totalPatients ?? 0,
            color: "default",
          },
          {
            label: "Adherence > 80%",
            value: metricsLoading ? "—" : metrics?.onTrack ?? 0,
            color: "ok",
          },
          {
            label: t("statNeedsAttention"),
            value: metricsLoading ? "—" : metrics?.needsAttention ?? 0,
            color: (metrics?.needsAttention ?? 0) > 0 ? "alert" : "default",
          },
          {
            label: t("statCritical"),
            value: metricsLoading ? "—" : metrics?.critical ?? 0,
            color: (metrics?.critical ?? 0) > 0 ? "danger" : "default",
          },
          {
            label: t("statUnseenNotes"),
            value: metricsLoading ? "—" : metrics?.unseenNotesCount ?? 0,
            color: (metrics?.unseenNotesCount ?? 0) > 0 ? "blue" : "default",
          },
        ]}
      />

      {/* AI DAILY BRIEF FROSTED GLASS PANEL */}
      <GlassPanel variant="default" className="rounded-[32px] p-6 sm:p-8 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <h2 className="font-display text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                {t("briefCardTitle")}
              </h2>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {brief?.briefDate ? `Date: ${brief.briefDate}` : "Today"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-bold px-3 py-1 rounded-full border ${
                brief?.source === "ai"
                  ? "bg-blue-50/80 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-200/50 dark:border-blue-800/40"
                  : "bg-white/40 dark:bg-white/5 text-slate-500 dark:text-slate-400 border-white/40 dark:border-white/10"
              }`}
            >
              {brief?.source === "ai" ? t("sourceAi") : t("sourceFallback")}
            </span>

            <button
              onClick={() => refreshBriefMutation.mutate()}
              disabled={refreshBriefMutation.isPending}
              className="p-2.5 rounded-full bg-white/60 dark:bg-white/10 border border-white/60 dark:border-white/10 hover:bg-white/80 dark:hover:bg-white/20 active:scale-95 transition-all text-slate-700 dark:text-slate-200"
              title="Refresh Brief"
            >
              <RefreshCw
                className={`w-4 h-4 text-blue-600 dark:text-blue-400 ${
                  refreshBriefMutation.isPending ? "animate-spin" : ""
                }`}
              />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 bg-white/60 dark:bg-white/5 rounded-2xl border border-white/60 dark:border-white/10 text-sm sm:text-base text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-line font-normal min-h-[90px]">
          {briefLoading ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-blue-600 dark:text-blue-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>दैनिक क्लिनिकल सारांश संकलित हो रहा है... (Generating AI brief...)</span>
              </div>
              <Skeleton className="h-4 w-5/6 rounded-md" />
              <Skeleton className="h-4 w-4/6 rounded-md" />
            </div>
          ) : (
            brief?.content || "आज के लिए कोई विशेष अलर्ट नहीं है।"
          )}
        </div>

        {/* Clinical Disclaimer */}
        <div className="text-[11px] text-slate-400 dark:text-slate-500 italic">
          {brief?.disclaimer}
        </div>
      </GlassPanel>

      {/* TWO COLUMN WORKSPACE: Priority Attention List + Ask CareSaathi */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Ranked Priority Attention Patients */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                {t("needsAttentionTitle")}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                जोखिम स्कोर के आधार पर क्रमबद्ध मरीज जिन्हें तुरंत ध्यान की जरूरत है
              </p>
            </div>
            <Link
              href="/doctor/patients"
              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              <span>सभी मरीज देखें</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {metricsLoading ? (
              <>
                <SkeletonCard lines={2} />
                <SkeletonCard lines={2} />
              </>
            ) : (
              metrics?.attentionList.map((patient) => {
                const isHighRisk = patient.riskScore >= 50;

                return (
                  <Link
                    key={patient.elderId}
                    href={`/doctor/patients/${patient.elderId}`}
                    className="block group"
                  >
                    <GlassPanel
                      variant="interactive"
                      className={`rounded-[28px] p-5 relative overflow-hidden ${
                        isHighRisk
                          ? "border-rose-400/50 dark:border-rose-500/30"
                          : "border-amber-400/50 dark:border-amber-500/30"
                      }`}
                    >
                      {/* Left status color bar */}
                      <div
                        className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                          isHighRisk ? "bg-rose-500" : "bg-amber-500"
                        }`}
                      />

                      <div className="flex items-start justify-between gap-3 pl-3">
                        <div>
                          <div className="flex items-baseline gap-2.5">
                            <h3 className="font-bold text-slate-900 dark:text-white text-base sm:text-lg group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                              {patient.name}
                            </h3>
                            <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300">
                              जोखिम: {patient.riskScore}
                            </span>
                          </div>

                          {/* Reason Chips */}
                          <div className="flex flex-wrap gap-1.5 mt-2.5">
                            {patient.reasons.map((r) => (
                              <span
                                key={r}
                                className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                                  r === "URGENT_NOTE" || r === "MISS_STREAK"
                                    ? "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-200/50 dark:border-rose-800/40"
                                    : "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200/50 dark:border-amber-800/40"
                                }`}
                              >
                                {reasonLabels[r] || r}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Right Adherence Stats */}
                        <div className="text-right shrink-0">
                          <span className="text-xs text-slate-400 dark:text-slate-500 block">
                            7-दिन अनुपालन
                          </span>
                          <span
                            className={`text-lg font-black ${
                              (patient.adherencePercentage ?? 100) < 75
                                ? "text-rose-600 dark:text-rose-400"
                                : "text-emerald-600 dark:text-emerald-400"
                            }`}
                          >
                            {patient.adherencePercentage !== null
                              ? `${patient.adherencePercentage}%`
                              : "—"}
                          </span>
                        </div>
                      </div>
                    </GlassPanel>
                  </Link>
                );
              })
            )}

            {(!metrics || metrics.attentionList.length === 0) && !metricsLoading && (
              <EmptyState
                title="सभी मरीज सुरक्षित हैं"
                description="इस समय किसी भी मरीज को तत्काल ध्यान की आवश्यकता नहीं है। सभी अनुपालन लक्ष्य 80% से ऊपर हैं।"
              />
            )}
          </div>
        </div>

        {/* Right: "Ask CareSaathi" Clinical Assistant */}
        <div className="lg:col-span-5">
          <GlassPanel
            variant="default"
            className="rounded-[32px] p-6 sm:p-7 flex flex-col justify-between h-full space-y-5"
          >
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <Bot className="w-6 h-6" />
                </div>
                <h2 className="font-display text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  {t("askSmriti")}
                </h2>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
                CareSaathi AI scans your patients' prescriptions, dose adherence logs, and caretaker observations to provide immediate clinical answers.
              </p>

              {/* Example Prompt Chips */}
              <div className="space-y-2 mb-4">
                <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider block">
                  त्वरित प्रश्न • Example Prompts:
                </span>
                {[
                  "सुरेश जी ने इस हफ्ते सुबह की दवा कितनी बार छोड़ी?",
                  "कमला देवी की वर्तमान दवाइयां और स्टॉक बताएं।",
                  "रमेश जी के लिए कोई अर्जेंट केयरटेकर नोट है क्या?",
                ].map((ex, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      setAskQuestion(ex);
                      askMutation.mutate(ex);
                    }}
                    className="w-full text-left p-2.5 bg-white/50 dark:bg-white/5 hover:bg-white/80 dark:hover:bg-white/10 text-xs text-slate-700 dark:text-slate-200 rounded-xl border border-white/60 dark:border-white/10 transition-all block truncate"
                  >
                    "{ex}"
                  </button>
                ))}
              </div>

              {/* Analyzing Indicator */}
              {askMutation.isPending && (
                <div className="p-4 bg-white/50 dark:bg-white/5 rounded-2xl border border-white/60 dark:border-white/10 text-xs text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-3 animate-pulse">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-600 dark:text-blue-400 shrink-0" />
                  <span className="font-medium">
                    मरीजों के रिकॉर्ड और क्लिनिकल डेटा का विश्लेषण हो रहा है... (Analyzing cohort...)
                  </span>
                </div>
              )}

              {/* Answer Display */}
              {askResult && !askMutation.isPending && (
                <div className="p-4 sm:p-5 bg-white/60 dark:bg-white/5 rounded-2xl border border-blue-500/20 text-xs sm:text-sm text-slate-800 dark:text-slate-200 mb-4 space-y-2">
                  <div className="font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>क्लिनिकल उत्तर:</span>
                  </div>
                  <p className="leading-relaxed whitespace-pre-line">
                    {askResult.answer}
                  </p>
                  {askResult.toolsUsed && askResult.toolsUsed.length > 0 && (
                    <div className="pt-2 border-t border-slate-200/50 dark:border-white/10 text-[10px] text-slate-400 dark:text-slate-500">
                      डेटा स्रोत: {askResult.toolsUsed.join(", ")}
                    </div>
                  )}
                  <div className="text-[10px] text-slate-400 dark:text-slate-500 italic">
                    {askResult.disclaimer}
                  </div>
                </div>
              )}
            </div>

            {/* Ask Input Form */}
            <form onSubmit={handleAskSubmit} className="pt-3 border-t border-slate-200/50 dark:border-white/10">
              <div className="relative">
                <input
                  type="text"
                  required
                  value={askQuestion}
                  onChange={(e) => setAskQuestion(e.target.value)}
                  placeholder={t("askPlaceholder")}
                  className="w-full min-h-[46px] pl-4 pr-12 bg-white/60 dark:bg-white/5 border border-slate-200/70 dark:border-white/10 rounded-full text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                />
                <button
                  type="submit"
                  disabled={askMutation.isPending || !askQuestion.trim()}
                  className="absolute right-1.5 top-1.5 p-2 bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-full hover:scale-105 active:scale-95 disabled:opacity-50 transition-all shadow-xs"
                  title="Send Question"
                >
                  {askMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </div>
            </form>
          </GlassPanel>
        </div>
      </div>

      {/* Redeem Invite Modal */}
      <RedeemInviteModal
        isOpen={redeemOpen}
        onClose={() => setRedeemOpen(false)}
        onSuccess={() => {
          refetchMetrics();
        }}
      />
    </div>
  );
}
