"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { apiClient } from "@/lib/api-client";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { Skeleton, SkeletonCard } from "@/components/shared/Skeleton";
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
  disclaimer: string;
  toolsUsed: string[];
}

export default function DoctorDashboardPage() {
  const t = useTranslations("doctor");
  const queryClient = useQueryClient();

  const [askQuestion, setAskQuestion] = useState("");
  const [askResult, setAskResult] = useState<AskResponse | null>(null);

  // 1. Fetch Dashboard Metrics
  const { data: metrics, isLoading: metricsLoading } = useQuery<DoctorDashboardData>({
    queryKey: ["doctor-dashboard-metrics"],
    queryFn: () => apiClient<DoctorDashboardData>("/api/doctor/dashboard"),
    refetchInterval: 30000,
  });

  // 2. Fetch AI Daily Brief
  const { data: brief, isLoading: briefLoading } = useQuery<AiBriefData>({
    queryKey: ["doctor-daily-brief"],
    queryFn: () => apiClient<AiBriefData>("/api/doctor/brief"),
    staleTime: 1000 * 60 * 30, // 30 mins
  });

  // Refresh AI Brief Mutation
  const refreshBriefMutation = useMutation({
    mutationFn: () => apiClient<AiBriefData>("/api/doctor/brief/refresh", { method: "POST" }),
    onSuccess: (newBrief) => {
      queryClient.setQueryData(["doctor-daily-brief"], newBrief);
      toast.success("दैनिक सारांश रीफ्रेश हो गया!");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to refresh brief");
    },
  });

  // Ask Smriti Mutation
  const askMutation = useMutation({
    mutationFn: (question: string) =>
      apiClient<AskResponse>("/api/doctor/ask", {
        method: "POST",
        body: JSON.stringify({ question }),
      }),
    onSuccess: (res) => {
      setAskResult(res);
    },
    onError: (err: any) => {
      toast.error(err.message || "Ask CareSaathi request failed");
    },
  });

  const handleAskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!askQuestion.trim()) return;
    askMutation.mutate(askQuestion.trim());
  };

  const reasonLabels: Record<string, string> = {
    LOW_ADHERENCE: "कम अनुपालन (<75%)",
    MISS_STREAK: "लगातार 3+ दिन छूटी",
    URGENT_NOTE: "अनदेखा आवश्यक नोट",
    LOW_STOCK: "दवा स्टॉक कम",
  };

  return (
    <div className="space-y-8">
      {/* Top Ledger Strip */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-line">
        <div>
          <h1 className="font-display text-3xl font-extrabold text-ink tracking-tight">
            {t("dashboard")}
          </h1>
          <p className="text-sm text-ink-muted mt-1">
            समस्त पंजीकृत बुजुर्गों की दैनिक निगरानी व प्राथमिकता रिपोर्ट
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/doctor/patients/new"
            className="px-4 py-2.5 bg-forest hover:bg-forest-hover active:scale-95 text-surface font-bold text-sm rounded-xl flex items-center gap-2 shadow-xs transition-all"
          >
            <UserPlus className="w-4 h-4" />
            <span>{t("addPatient")}</span>
          </Link>
        </div>
      </div>

      {/* STAT CARDS STRIP */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5 sm:gap-4">
        {/* Total Patients */}
        <div className="bg-surface border border-line rounded-2xl p-4 sm:p-5 shadow-xs">
          <span className="text-xs font-bold text-ink-muted uppercase tracking-wider block">
            {t("statTotalPatients")}
          </span>
          {metricsLoading ? (
            <Skeleton className="h-9 w-16 mt-1 rounded-lg" />
          ) : (
            <span className="text-3xl font-extrabold text-ink mt-1 block">
              {metrics?.totalPatients ?? "—"}
            </span>
          )}
        </div>

        {/* On Track */}
        <div className="bg-surface border border-line rounded-2xl p-4 sm:p-5 shadow-xs">
          <span className="text-xs font-bold text-ok uppercase tracking-wider block flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{t("statOnTrack")}</span>
          </span>
          {metricsLoading ? (
            <Skeleton className="h-9 w-16 mt-1 rounded-lg" />
          ) : (
            <span className="text-3xl font-extrabold text-ok mt-1 block">
              {metrics?.onTrack ?? "—"}
            </span>
          )}
        </div>

        {/* Needs Attention */}
        <div className="bg-surface border border-line rounded-2xl p-4 sm:p-5 shadow-xs">
          <span className="text-xs font-bold text-saffron uppercase tracking-wider block flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>{t("statNeedsAttention")}</span>
          </span>
          {metricsLoading ? (
            <Skeleton className="h-9 w-16 mt-1 rounded-lg" />
          ) : (
            <span className="text-3xl font-extrabold text-saffron mt-1 block">
              {metrics?.needsAttention ?? "—"}
            </span>
          )}
        </div>

        {/* High Risk / Critical */}
        <div className="bg-surface border border-line rounded-2xl p-4 sm:p-5 shadow-xs">
          <span className="text-xs font-bold text-brick uppercase tracking-wider block flex items-center gap-1">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>{t("statCritical")}</span>
          </span>
          {metricsLoading ? (
            <Skeleton className="h-9 w-16 mt-1 rounded-lg" />
          ) : (
            <span className="text-3xl font-extrabold text-brick mt-1 block">
              {metrics?.critical ?? "—"}
            </span>
          )}
        </div>

        {/* Unseen Notes */}
        <div className="bg-surface border border-line rounded-2xl p-4 sm:p-5 shadow-xs col-span-2 md:col-span-1">
          <span className="text-xs font-bold text-ink-muted uppercase tracking-wider block flex items-center gap-1">
            <FileText className="w-3.5 h-3.5 text-forest" />
            <span>{t("statUnseenNotes")}</span>
          </span>
          {metricsLoading ? (
            <Skeleton className="h-9 w-16 mt-1 rounded-lg" />
          ) : (
            <span className="text-3xl font-extrabold text-forest mt-1 block">
              {metrics?.unseenNotesCount ?? "—"}
            </span>
          )}
        </div>
      </div>

      {/* AI DAILY BRIEF CARD */}
      <div className="bg-surface border-2 border-forest/30 rounded-3xl p-6 sm:p-7 shadow-sm relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-forest-soft text-forest flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-saffron" />
            </div>
            <div>
              <h2 className="font-displayDeva text-xl font-bold text-ink">
                {t("briefCardTitle")}
              </h2>
              <span className="text-xs text-ink-muted">
                {brief?.briefDate ? `Date: ${brief.briefDate}` : "Today"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-bold px-3 py-1 rounded-full border ${
                brief?.source === "ai"
                  ? "bg-forest-soft text-forest border-forest/20"
                  : "bg-paper-2 text-ink-muted border-line"
              }`}
            >
              {brief?.source === "ai" ? t("sourceAi") : t("sourceFallback")}
            </span>

            <button
              onClick={() => refreshBriefMutation.mutate()}
              disabled={refreshBriefMutation.isPending}
              className="p-2 rounded-xl border border-line bg-surface hover:bg-paper active:scale-95 text-ink transition-all"
              title="Refresh Brief"
            >
              <RefreshCw
                className={`w-4 h-4 text-forest ${
                  refreshBriefMutation.isPending ? "animate-spin" : ""
                }`}
              />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 bg-paper rounded-2xl border border-line text-sm sm:text-base text-ink leading-relaxed whitespace-pre-line font-normal min-h-[90px]">
          {briefLoading ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-forest">
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
        <div className="mt-3 text-[11px] text-ink-muted italic">
          {brief?.disclaimer}
        </div>
      </div>

      {/* TWO COLUMN WORKSPACE: Priority Attention List + Ask Smriti Assistant */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Ranked Priority Attention Patients (Span 7) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-xl font-bold text-ink">
                {t("needsAttentionTitle")}
              </h2>
              <p className="text-xs text-ink-muted">
                जोखिम स्कोर के आधार पर क्रमबद्ध मरीज जिन्हें तुरंत ध्यान की जरूरत है
              </p>
            </div>
            <Link
              href="/doctor/patients"
              className="text-xs font-bold text-forest hover:underline flex items-center gap-1"
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
                  <div
                    className={`bg-surface border rounded-2xl p-4 sm:p-5 shadow-xs transition-all group-hover:shadow-sm relative overflow-hidden ${
                      isHighRisk ? "border-brick/40" : "border-saffron/40"
                    }`}
                  >
                    {/* Left status color bar */}
                    <div
                      className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                        isHighRisk ? "bg-brick" : "bg-saffron"
                      }`}
                    />

                    <div className="flex items-start justify-between gap-3 pl-2">
                      <div>
                        <div className="flex items-baseline gap-2">
                          <h3 className="font-bold text-ink text-base sm:text-lg group-hover:text-forest transition-colors">
                            {patient.name}
                          </h3>
                          <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-paper-2 border border-line text-ink">
                            जोखिम: {patient.riskScore}
                          </span>
                        </div>

                        {/* Reason Chips */}
                        <div className="flex flex-wrap gap-1.5 mt-2.5">
                          {patient.reasons.map((r) => (
                            <span
                              key={r}
                              className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${
                                r === "URGENT_NOTE" || r === "MISS_STREAK"
                                  ? "bg-brick-soft text-brick border-brick/20"
                                  : "bg-saffron-soft text-ink border-saffron/30"
                              }`}
                            >
                              {reasonLabels[r] || r}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Right Adherence Stats */}
                      <div className="text-right shrink-0">
                        <span className="text-xs text-ink-muted block">7-दिन अनुपालन</span>
                        <span
                          className={`text-lg font-extrabold ${
                            (patient.adherencePercentage ?? 100) < 75
                              ? "text-brick"
                              : "text-forest"
                          }`}
                        >
                          {patient.adherencePercentage !== null
                            ? `${patient.adherencePercentage}%`
                            : "—"}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            }))}

            {(!metrics || metrics.attentionList.length === 0) && !metricsLoading && (
              <EmptyState
                title="सभी मरीज सुरक्षित हैं"
                description="इस समय किसी भी मरीज को तत्काल ध्यान की आवश्यकता नहीं है। सभी अनुपालन लक्ष्य 80% से ऊपर हैं।"
              />
            )}
          </div>
        </div>

        {/* Right: "Ask Smriti" Clinical Assistant (Span 5) */}
        <div className="lg:col-span-5 bg-surface border border-line rounded-3xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Bot className="w-6 h-6 text-forest" />
              <h2 className="font-displayDeva text-xl font-bold text-ink">
                {t("askSmriti")}
              </h2>
            </div>
            <p className="text-xs text-ink-muted leading-relaxed mb-4">
              CareSaathi AI scans your patients' prescriptions, dose adherence logs, and caretaker observations to provide immediate clinical answers.
            </p>

            {/* Example Prompt Chips */}
            <div className="space-y-1.5 mb-5">
              <span className="text-[11px] font-bold text-forest uppercase tracking-wider block">
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
                  className="w-full text-left p-2 bg-paper-2 hover:bg-forest-soft hover:text-forest text-xs rounded-xl border border-line transition-all block truncate"
                >
                  "{ex}"
                </button>
              ))}
            </div>

            {/* Analyzing Indicator */}
            {askMutation.isPending && (
              <div className="p-4 bg-paper rounded-2xl border border-line text-xs text-ink mb-4 flex items-center gap-3 animate-pulse">
                <Loader2 className="w-5 h-5 animate-spin text-forest shrink-0" />
                <span className="font-medium">
                  मरीजों के रिकॉर्ड और क्लिनिकल डेटा का विश्लेषण हो रहा है... (Analyzing patient cohort...)
                </span>
              </div>
            )}

            {/* Answer Display */}
            {askResult && !askMutation.isPending && (
              <div className="p-4 bg-paper rounded-2xl border border-forest/20 text-xs sm:text-sm text-ink mb-4 space-y-2 animate-fade-in">
                <div className="font-semibold text-forest flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-saffron" />
                  <span>क्लिनिकल उत्तर:</span>
                </div>
                <p className="leading-relaxed whitespace-pre-line">
                  {askResult.answer}
                </p>
                {askResult.toolsUsed && askResult.toolsUsed.length > 0 && (
                  <div className="pt-2 border-t border-line/60 text-[10px] text-ink-muted">
                    डेटा स्रोत: {askResult.toolsUsed.join(", ")}
                  </div>
                )}
                <div className="text-[10px] text-ink-muted italic">
                  {askResult.disclaimer}
                </div>
              </div>
            )}
          </div>

          {/* Ask Input Form */}
          <form onSubmit={handleAskSubmit} className="mt-4 pt-3 border-t border-line">
            <div className="relative">
              <input
                type="text"
                required
                value={askQuestion}
                onChange={(e) => setAskQuestion(e.target.value)}
                placeholder={t("askPlaceholder")}
                className="w-full min-h-[46px] pl-3.5 pr-11 bg-paper border border-line rounded-xl text-xs sm:text-sm text-ink focus:bg-surface focus:border-forest transition-colors"
              />
              <button
                type="submit"
                disabled={askMutation.isPending || !askQuestion.trim()}
                className="absolute right-1.5 top-1.5 p-2 bg-forest text-surface rounded-lg hover:bg-forest-hover active:scale-95 disabled:opacity-50 transition-all"
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
        </div>
      </div>
    </div>
  );
}
