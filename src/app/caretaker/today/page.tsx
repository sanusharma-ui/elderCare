"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCaretaker } from "@/components/caretaker/CaretakerContext";
import { ElderSwitcher } from "@/components/caretaker/ElderSwitcher";
import { DoseCard, TodayDoseItem } from "@/components/elder/DoseCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { InstallPrompt } from "@/components/shared/InstallPrompt";
import { SkeletonSchedule } from "@/components/shared/Skeleton";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { apiClient } from "@/lib/api-client";
import { Activity, Clock, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

interface TodayResponse {
  date: string;
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

interface AdherenceResponse {
  overall: {
    rate7d: number;
    rate14d: number;
    rate30d: number;
    missStreak: number;
  };
}

export default function CaretakerTodayPage() {
  const { selectedElder, selectedElderId } = useCaretaker();
  const t = useTranslations("caretaker");
  const tSlots = useTranslations("timeSlots");
  const queryClient = useQueryClient();
  const [activeDoseActionId, setActiveDoseActionId] = useState<string | null>(null);

  // Fetch today doses for selected elder
  const { data, isLoading } = useQuery<TodayResponse>({
    queryKey: ["caretaker-today", selectedElderId],
    queryFn: () => apiClient<TodayResponse>(`/api/elders/${selectedElderId}/today`),
    enabled: !!selectedElderId,
    refetchInterval: 60000,
  });

  // Fetch mini adherence stats
  const { data: adherenceData } = useQuery<AdherenceResponse>({
    queryKey: ["caretaker-adherence-mini", selectedElderId],
    queryFn: () => apiClient<AdherenceResponse>(`/api/elders/${selectedElderId}/adherence`),
    enabled: !!selectedElderId,
  });

  // Mark Given Mutation with Optimistic 0ms UI Update
  const markGivenMutation = useMutation({
    mutationFn: (dose: TodayDoseItem) =>
      apiClient(`/api/elders/${selectedElderId}/doses/mark`, {
        method: "POST",
        body: JSON.stringify({
          scheduleId: dose.scheduleId,
          scheduledFor: dose.scheduledFor,
          status: "GIVEN",
        }),
      }),
    onMutate: async (dose: TodayDoseItem) => {
      setActiveDoseActionId(dose.scheduleId);
      await queryClient.cancelQueries({ queryKey: ["caretaker-today", selectedElderId] });
      const previousData = queryClient.getQueryData<TodayResponse>(["caretaker-today", selectedElderId]);

      if (previousData) {
        queryClient.setQueryData<TodayResponse>(["caretaker-today", selectedElderId], {
          ...previousData,
          summary: {
            ...previousData.summary,
            pending: Math.max(0, previousData.summary.pending - 1),
            given: previousData.summary.given + 1,
          },
          slots: {
            ...previousData.slots,
            [dose.timeSlot]: previousData.slots[dose.timeSlot].map((d) =>
              d.scheduleId === dose.scheduleId
                ? { ...d, status: "GIVEN" as const, takenAt: new Date().toISOString() }
                : d
            ),
          },
        });
      }

      return { previousData };
    },
    onSuccess: (result: any) => {
      setActiveDoseActionId(null);
      queryClient.invalidateQueries({ queryKey: ["caretaker-today"] });
      const doseLogId = result?.id;
      toast.success(t("markedGiven"), {
        action: doseLogId
          ? {
              label: "Undo",
              onClick: () => undoMutation.mutate(doseLogId),
            }
          : undefined,
      });
    },
    onError: (err: any, _dose, context) => {
      setActiveDoseActionId(null);
      if (context?.previousData) {
        queryClient.setQueryData(["caretaker-today", selectedElderId], context.previousData);
      }
      toast.error(err.message || "Failed to mark dose");
    },
  });

  // Mark Skipped Mutation
  const markSkippedMutation = useMutation({
    mutationFn: (dose: TodayDoseItem) =>
      apiClient(`/api/elders/${selectedElderId}/doses/mark`, {
        method: "POST",
        body: JSON.stringify({
          scheduleId: dose.scheduleId,
          scheduledFor: dose.scheduledFor,
          status: "SKIPPED",
          note: "Skipped by caretaker",
        }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["caretaker-today"] });
      toast.info(t("markedSkipped"));
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to skip dose");
    },
  });

  // Undo Mutation
  const undoMutation = useMutation({
    mutationFn: (doseLogId: string) =>
      apiClient(`/api/doses/${doseLogId}/undo`, { method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["caretaker-today"] });
      toast.success(t("undoSuccess"));
    },
  });

  const adherenceRate = adherenceData?.overall.rate7d ?? 100;
  const missStreak = adherenceData?.overall.missStreak ?? 0;

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-2xl mx-auto">
      {/* Elder Switcher Header */}
      <ElderSwitcher />

      {/* Mini Adherence Summary Card */}
      {selectedElderId && (
        <GlassPanel variant="default" className="rounded-[28px] p-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <ProgressRing
              value={adherenceRate}
              size={64}
              strokeWidth={6}
              label={t("adherence7d")}
            />
          </div>

          {missStreak > 0 && (
            <div className="flex items-center gap-1.5 px-3.5 py-1.5 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs font-black rounded-full border border-rose-200/50 dark:border-rose-800/40">
              <AlertCircle className="w-4 h-4" />
              <span>{t("missStreak", { count: missStreak })}</span>
            </div>
          )}
        </GlassPanel>
      )}

      {/* Schedule Grouped by Slot */}
      {isLoading ? (
        <SkeletonSchedule />
      ) : (
        <div className="space-y-5 pt-1">
          <h2 className="font-bold text-xl text-slate-900 dark:text-white px-1">
            {t("dailyDoses")}
          </h2>

          {(["MORNING", "AFTERNOON", "EVENING", "NIGHT"] as const).map((slotKey) => {
            const slotDoses = data?.slots[slotKey] || [];
            if (slotDoses.length === 0) return null;

            return (
              <div key={slotKey} className="space-y-3">
                <div className="flex items-center gap-2 px-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600 dark:bg-sky-400" />
                  <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white capitalize">
                    {tSlots(slotKey)} ({slotDoses.length})
                  </h3>
                </div>

                <div className="space-y-3">
                  {slotDoses.map((dose) => (
                    <DoseCard
                      key={dose.scheduleId}
                      dose={dose}
                      isElderView={false}
                      isLoading={activeDoseActionId === dose.scheduleId}
                      onMarkGiven={(d) => markGivenMutation.mutate(d)}
                      onMarkSkipped={(d) => markSkippedMutation.mutate(d)}
                      onUndo={(d) => d.doseLogId && undoMutation.mutate(d.doseLogId)}
                    />
                  ))}
                </div>
              </div>
            );
          })}

          {data?.summary.total === 0 && !isLoading && (
            <EmptyState
              title={t("noDoses")}
              description={t("noDosesDescription")}
            />
          )}
        </div>
      )}

      <InstallPrompt />
    </div>
  );
}
