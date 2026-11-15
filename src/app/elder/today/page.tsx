"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/lib/i18n-provider";
import { apiClient } from "@/lib/api-client";
import { DoseCard, TodayDoseItem } from "@/components/elder/DoseCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { InstallPrompt } from "@/components/shared/InstallPrompt";
import { SkeletonSchedule } from "@/components/shared/Skeleton";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { ProgressRing } from "@/components/ui/ProgressRing";
import {
  Volume2,
  VolumeX,
  CheckCircle2,
  Clock,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { formatTime24to12 } from "@/lib/utils";

interface TodayResponse {
  date: string;
  dayOfWeek: number;
  timezone: string;
  elder: { id: string; name: string };
  summary: {
    total: number;
    pending: number;
    taken: number;
    given: number;
    missed: number;
    skipped: number;
  };
  slots: {
    MORNING: TodayDoseItem[];
    AFTERNOON: TodayDoseItem[];
    EVENING: TodayDoseItem[];
    NIGHT: TodayDoseItem[];
  };
}

export default function ElderTodayPage() {
  const t = useTranslations("elder");
  const tSlots = useTranslations("timeSlots");
  const { user } = useAuth();
  const { locale } = useI18n();
  const queryClient = useQueryClient();

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [markingScheduleId, setMarkingScheduleId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      setSpeechSupported(true);
    }
  }, []);

  // Fetch /api/elders/:elderId/today
  const { data, isLoading, refetch } = useQuery<TodayResponse>({
    queryKey: ["elder-today", user?.id],
    queryFn: () => apiClient<TodayResponse>(`/api/elders/${user?.id}/today`),
    enabled: !!user?.id,
    refetchInterval: 60000,
  });

  // Mark Dose Mutation with Optimistic 0ms UI Update
  const markDoseMutation = useMutation({
    mutationFn: (dose: TodayDoseItem) =>
      apiClient(`/api/elders/${user?.id}/doses/mark`, {
        method: "POST",
        body: JSON.stringify({
          scheduleId: dose.scheduleId,
          scheduledFor: dose.scheduledFor,
          status: "TAKEN",
        }),
      }),
    onMutate: async (dose: TodayDoseItem) => {
      setMarkingScheduleId(dose.scheduleId);
      await queryClient.cancelQueries({ queryKey: ["elder-today", user?.id] });
      const previousData = queryClient.getQueryData<TodayResponse>(["elder-today", user?.id]);

      if (previousData) {
        queryClient.setQueryData<TodayResponse>(["elder-today", user?.id], {
          ...previousData,
          summary: {
            ...previousData.summary,
            pending: Math.max(0, previousData.summary.pending - 1),
            taken: previousData.summary.taken + 1,
          },
          slots: {
            ...previousData.slots,
            [dose.timeSlot]: previousData.slots[dose.timeSlot].map((d) =>
              d.scheduleId === dose.scheduleId
                ? { ...d, status: "TAKEN" as const, takenAt: new Date().toISOString() }
                : d
            ),
          },
        });
      }

      return { previousData };
    },
    onSuccess: (result: any) => {
      setMarkingScheduleId(null);
      queryClient.invalidateQueries({ queryKey: ["elder-today"] });
      const doseLogId = result?.id;

      toast.success(t("markDoseSuccess"), {
        duration: 8000,
        action: doseLogId
          ? {
              label: "Undo",
              onClick: () => undoMutation.mutate(doseLogId),
            }
          : undefined,
      });
    },
    onError: (err: any, _dose, context) => {
      setMarkingScheduleId(null);
      if (context?.previousData) {
        queryClient.setQueryData(["elder-today", user?.id], context.previousData);
      }
      toast.error(err.message || "Failed to mark dose");
    },
  });

  // Undo Mutation
  const undoMutation = useMutation({
    mutationFn: (doseLogId: string) =>
      apiClient(`/api/doses/${doseLogId}/undo`, {
        method: "POST",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["elder-today"] });
      toast.success(t("undoSuccess"));
    },
    onError: (err: any) => {
      toast.error(err.message || "Undo window expired");
    },
  });

  // Calm Greeting by Time of Day
  const getGreeting = () => {
    const hour = new Date().getHours();
    const name = user?.name?.split(" ")[0] || "";
    if (hour < 12) return t("greetingMorning", { name });
    if (hour < 17) return t("greetingAfternoon", { name });
    if (hour < 21) return t("greetingEvening", { name });
    return t("greetingNight", { name });
  };

  // Find next pending dose
  const allDoses: TodayDoseItem[] = data
    ? [
        ...(data.slots.MORNING || []),
        ...(data.slots.AFTERNOON || []),
        ...(data.slots.EVENING || []),
        ...(data.slots.NIGHT || []),
      ]
    : [];

  const nextDose = allDoses.find((d) => d.status === "PENDING");
  const totalTaken = (data?.summary.taken || 0) + (data?.summary.given || 0);
  const totalDoses = data?.summary.total || 0;
  const progressPercent = totalDoses > 0 ? Math.round((totalTaken / totalDoses) * 100) : 0;

  // Web Speech API: Speak today's schedule aloud
  const handleSpeakSchedule = () => {
    if (!speechSupported || isSpeaking) {
      if (isSpeaking) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
      }
      return;
    }

    let speechText = "";
    if (locale === "hi") {
      speechText = `नमस्ते ${user?.name || ""}. आज आपको कुल ${totalDoses} खुराक लेनी हैं। जिनमें से ${totalTaken} ले ली गई हैं।`;
      if (nextDose) {
        speechText += ` अगली दवा ${nextDose.medicineName} ${nextDose.nameLocal ? nextDose.nameLocal : ""}, समय ${formatTime24to12(nextDose.timeOfDay)} पर लेनी है।`;
      } else {
        speechText += ` आज की सभी दवाइयां पूरी हो चुकी हैं।`;
      }
    } else if (locale === "mr") {
      speechText = `नमस्कार ${user?.name || ""}. आज तुम्हाला एकूण ${totalDoses} औषधे घ्यायची आहेत. ज्यापैकी ${totalTaken} घेतली आहेत.`;
      if (nextDose) {
        speechText += ` पुढील औषध ${nextDose.medicineName}, वेळ ${formatTime24to12(nextDose.timeOfDay)} वाजता आहे.`;
      } else {
        speechText += ` आजची सर्व औषधे पूर्ण झाली आहेत.`;
      }
    } else {
      speechText = `Hello ${user?.name || ""}. You have ${totalDoses} doses scheduled today. ${totalTaken} completed.`;
      if (nextDose) {
        speechText += ` Next dose is ${nextDose.medicineName} at ${formatTime24to12(nextDose.timeOfDay)}.`;
      } else {
        speechText += ` All doses are complete for today.`;
      }
    }

    const utterance = new SpeechSynthesisUtterance(speechText);
    utterance.lang = locale === "hi" ? "hi-IN" : locale === "mr" ? "mr-IN" : "en-IN";
    utterance.rate = 0.9;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6">
        <SkeletonSchedule />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-2xl mx-auto">
      {/* Calm Senior Greeting Banner */}
      <GlassPanel variant="elder" className="rounded-[32px] p-6 sm:p-7 relative overflow-hidden">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-displayDeva text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white leading-tight">
              {getGreeting()}
            </h1>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 mt-1.5 font-bold">
              {totalDoses === 0
                ? t("noMedicinesToday")
                : t("progress", { taken: totalTaken, total: totalDoses })}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Progress Gauge */}
            {totalDoses > 0 && (
              <ProgressRing
                value={progressPercent}
                size={68}
                strokeWidth={6}
                showValueInside={true}
              />
            )}

            {/* Listen / Speech Button */}
            {speechSupported && (
              <button
                onClick={handleSpeakSchedule}
                className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 border transition-all active:scale-95 shadow-sm ${
                  isSpeaking
                    ? "bg-amber-500 text-white border-amber-500 animate-pulse"
                    : "bg-white/80 dark:bg-white/10 text-blue-600 dark:text-blue-400 border-white/80 dark:border-white/10 hover:bg-white"
                }`}
                title="Listen Schedule Aloud"
                aria-label="Listen Schedule"
              >
                {isSpeaking ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
              </button>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        {totalDoses > 0 && (
          <div className="mt-5 pt-4 border-t border-slate-200/50 dark:border-white/10">
            <div className="flex items-center justify-between text-sm font-bold text-slate-600 dark:text-slate-300 mb-2">
              <span>{t("progress", { taken: totalTaken, total: totalDoses })}</span>
              <span className="text-blue-600 dark:text-blue-400 font-black">{progressPercent}%</span>
            </div>
            <div className="w-full h-3.5 bg-slate-200/70 dark:bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 dark:bg-sky-400 transition-all duration-500 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}
      </GlassPanel>

      {/* BIG "NEXT DOSE" CARD */}
      {nextDose && (
        <div className="space-y-2.5">
          <div className="flex items-center gap-2 text-sm sm:text-base font-extrabold text-blue-600 dark:text-blue-400 uppercase tracking-wider px-1">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <span>{t("nextDose")}</span>
          </div>
          <DoseCard
            dose={nextDose}
            isElderView={true}
            isLoading={markingScheduleId === nextDose.scheduleId}
            onMarkTaken={(d) => markDoseMutation.mutate(d)}
            onUndo={(d) => d.doseLogId && undoMutation.mutate(d.doseLogId)}
          />
        </div>
      )}

      {/* Schedule Grouped by Time Slots */}
      <div className="space-y-5 pt-2">
        <h2 className="font-displayDeva text-2xl font-black text-slate-900 dark:text-white px-1">
          {t("fullSchedule")}
        </h2>

        {(["MORNING", "AFTERNOON", "EVENING", "NIGHT"] as const).map((slotKey) => {
          const slotDoses = data?.slots[slotKey] || [];
          if (slotDoses.length === 0) return null;

          return (
            <div key={slotKey} className="space-y-3">
              <div className="flex items-center gap-2 px-1 pt-1">
                <span className="w-3 h-3 rounded-full bg-blue-600 dark:bg-sky-400" />
                <h3 className="font-bold text-lg sm:text-xl text-slate-900 dark:text-white">
                  {tSlots(slotKey)} ({slotDoses.length})
                </h3>
              </div>

              <div className="space-y-3">
                {slotDoses.map((dose) => (
                  <DoseCard
                    key={dose.scheduleId}
                    dose={dose}
                    isElderView={true}
                    isLoading={markingScheduleId === dose.scheduleId}
                    onMarkTaken={(d) => markDoseMutation.mutate(d)}
                    onUndo={(d) => d.doseLogId && undoMutation.mutate(d.doseLogId)}
                  />
                ))}
              </div>
            </div>
          );
        })}

        {totalDoses === 0 && !isLoading && (
          <EmptyState
            title={t("noSchedule")}
            description={t("noMedicinesToday")}
          />
        )}
      </div>

      {/* PWA Install Promotion */}
      <InstallPrompt />
    </div>
  );
}
