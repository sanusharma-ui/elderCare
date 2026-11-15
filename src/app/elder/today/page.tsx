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
import {
  Volume2,
  VolumeX,
  CheckCircle2,
  Clock,
  Sparkles,
  ChevronDown,
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
    refetchInterval: 60000, // 60s auto refresh
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

  // Find the next upcoming/due pending dose
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
    utterance.rate = 0.9; // Calm, senior-friendly pacing
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="p-4 sm:p-5 space-y-5">
      {/* Calm Senior Greeting Banner */}
      <div className="bg-surface border border-line rounded-3xl p-5 shadow-smriti relative overflow-hidden">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="font-displayDeva text-2xl sm:text-3xl font-bold text-ink leading-tight">
              {getGreeting()}
            </h1>
            <p className="text-sm sm:text-base text-ink-muted mt-1 font-medium">
              {totalDoses === 0
                ? "आज के लिए कोई दवा निर्धारित नहीं है।"
                : t("progress", { taken: totalTaken, total: totalDoses })}
            </p>
          </div>

          {/* Listen / Speech Button */}
          {speechSupported && (
            <button
              onClick={handleSpeakSchedule}
              className={`p-3 rounded-2xl flex items-center justify-center shrink-0 border transition-all active:scale-95 shadow-xs ${
                isSpeaking
                  ? "bg-saffron text-surface border-saffron animate-pulse"
                  : "bg-forest-soft text-forest border-forest/20 hover:bg-forest hover:text-surface"
              }`}
              title="Listen Schedule Aloud"
              aria-label="Listen Schedule"
            >
              {isSpeaking ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
            </button>
          )}
        </div>

        {/* Progress Bar & Ring */}
        {totalDoses > 0 && (
          <div className="mt-4 pt-4 border-t border-line/60">
            <div className="flex items-center justify-between text-xs font-semibold text-ink-muted mb-1.5">
              <span>आज की प्रगति • Progress</span>
              <span className="text-forest font-bold">{progressPercent}%</span>
            </div>
            <div className="w-full h-3 bg-paper-2 rounded-full overflow-hidden border border-line/50">
              <div
                className="h-full bg-forest transition-all duration-500 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* BIG "NEXT DOSE" CARD */}
      {nextDose && (
        <div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-forest uppercase tracking-wider mb-2 px-1">
            <Sparkles className="w-4 h-4 text-saffron" />
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

      {/* SCHEDULE GROUPED BY TIME SLOTS: सुबह / दोपहर / शाम / रात */}
      <div className="space-y-4 pt-2">
        <h2 className="font-displayDeva text-xl font-bold text-ink px-1">
          आज का पूरा समय पत्र • Full Day Schedule
        </h2>

        {(["MORNING", "AFTERNOON", "EVENING", "NIGHT"] as const).map((slotKey) => {
          const slotDoses = data?.slots[slotKey] || [];
          if (slotDoses.length === 0) return null;

          return (
            <div key={slotKey} className="space-y-3">
              <div className="flex items-center gap-2 px-1 pt-1">
                <span className="w-2.5 h-2.5 rounded-full bg-forest" />
                <h3 className="font-bold text-base text-ink">
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
            title="कोई दवा निर्धारित नहीं है"
            description="आज के लिए आपके डॉक्टर द्वारा कोई दवा शेड्यूल नहीं की गई है।"
          />
        )}
      </div>

      {/* PWA Install Promotion */}
      <InstallPrompt />
    </div>
  );
}
