"use client";

import React from "react";
import { useTranslations } from "next-intl";
import {
  Pill,
  Clock,
  Utensils,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  RotateCcw,
  Loader2,
} from "lucide-react";
import { cn, formatTime24to12 } from "@/lib/utils";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { PrimaryButton } from "@/components/ui/PrimaryButton";

export interface TodayDoseItem {
  scheduleId: string;
  doseLogId?: string | null;
  medicineId: string;
  medicineName: string;
  nameLocal?: string | null;
  form: string;
  doseQuantity: string;
  foodRelation: "BEFORE_FOOD" | "AFTER_FOOD" | "WITH_FOOD" | "ANYTIME";
  timeOfDay: string;
  timeSlot: "MORNING" | "AFTERNOON" | "EVENING" | "NIGHT";
  instructions?: string | null;
  warnings?: string | null;
  status: "PENDING" | "TAKEN" | "GIVEN" | "MISSED" | "SKIPPED";
  scheduledFor: string;
  takenAt?: string | null;
  markedByRole?: string | null;
  canMark?: boolean;
}

export function DoseCard({
  dose,
  onMarkTaken,
  onUndo,
  isElderView = true,
  onMarkGiven,
  onMarkSkipped,
  isLoading = false,
}: {
  dose: TodayDoseItem;
  onMarkTaken?: (dose: TodayDoseItem) => void;
  onUndo?: (dose: TodayDoseItem) => void;
  isElderView?: boolean;
  onMarkGiven?: (dose: TodayDoseItem) => void;
  onMarkSkipped?: (dose: TodayDoseItem) => void;
  isLoading?: boolean;
}) {
  const t = useTranslations("elder");
  const tFood = useTranslations("foodRelation");
  const tDose = useTranslations("doseStatus");
  const tCommon = useTranslations("common");

  const isTaken = dose.status === "TAKEN" || dose.status === "GIVEN";
  const isMissed = dose.status === "MISSED";
  const isPending = dose.status === "PENDING";
  const isSkipped = dose.status === "SKIPPED";

  return (
    <GlassPanel
      variant="elder"
      className={cn(
        "rounded-[28px] p-5 sm:p-6 transition-all relative overflow-hidden",
        isTaken && "border-emerald-500/40 bg-emerald-500/5",
        isMissed && "border-rose-500/40 bg-rose-500/5",
        isSkipped && "opacity-75"
      )}
    >
      {/* Left status color bar */}
      <div
        className={cn(
          "absolute left-0 top-0 bottom-0 w-2",
          isTaken && "bg-emerald-500",
          isMissed && "bg-rose-500",
          isPending && "bg-blue-600 dark:bg-sky-400",
          isSkipped && "bg-slate-400"
        )}
      />

      {/* Top row: Medicine Name, Local Name & Scheduled Time */}
      <div className="flex items-start justify-between gap-3 pl-2">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
            <Pill className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-baseline gap-2.5 flex-wrap">
              <h3 className="font-bold text-slate-900 dark:text-white text-xl sm:text-2xl leading-snug">
                {dose.medicineName}
              </h3>
              {dose.nameLocal && (
                <span className="font-displayDeva text-lg sm:text-xl font-bold text-blue-600 dark:text-blue-400">
                  ({dose.nameLocal})
                </span>
              )}
            </div>

            <div className="flex items-center gap-2.5 mt-1.5 text-sm sm:text-base text-slate-600 dark:text-slate-300 flex-wrap">
              <span className="font-extrabold text-slate-900 dark:text-white px-2.5 py-0.5 bg-white/70 dark:bg-white/10 rounded-full border border-slate-200/60 dark:border-white/10 text-xs sm:text-sm">
                {dose.doseQuantity}
              </span>
              <span className="flex items-center gap-1.5 font-bold">
                <Utensils className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>{tFood(dose.foodRelation)}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Time Badge */}
        <div className="flex flex-col items-end shrink-0">
          <div className="flex items-center gap-1.5 text-sm sm:text-base font-extrabold text-slate-900 dark:text-white bg-white/80 dark:bg-white/10 px-3 py-1.5 rounded-full border border-slate-200/60 dark:border-white/10 tabular-nums shadow-xs">
            <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>{formatTime24to12(dose.timeOfDay)}</span>
          </div>
          {isTaken && dose.takenAt && (
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-1">
              ✓ {new Date(dose.takenAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
        </div>
      </div>

      {/* Instructions if present */}
      {dose.instructions && (
        <div className="mt-3.5 pl-2 text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
          <span className="font-bold text-slate-900 dark:text-white">{t("instructions")}: </span>
          <span>{dose.instructions}</span>
        </div>
      )}

      {/* PROMINENT WARNING CALLOUT */}
      {dose.warnings && (
        <div className="mt-3.5 ml-2 p-3 bg-amber-50/90 dark:bg-amber-950/40 border border-amber-300/60 dark:border-amber-700/40 rounded-2xl flex items-start gap-3 text-slate-900 dark:text-slate-100 text-sm sm:text-base">
          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-amber-800 dark:text-amber-300">{t("warningNotice")}: </span>
            <span className="font-semibold leading-tight">
              {dose.warnings}
            </span>
          </div>
        </div>
      )}

      {/* Action Bar */}
      <div className="mt-4 pt-3.5 border-t border-slate-200/50 dark:border-white/10 pl-2">
        {isElderView ? (
          // Elder: Generous min 58px primary button
          <div>
            {isPending && (
              <PrimaryButton
                variant="primary"
                size="elder"
                onClick={() => {
                  if ("vibrate" in navigator) navigator.vibrate([40, 20, 40]);
                  onMarkTaken?.(dose);
                }}
                disabled={isLoading}
                className="w-full gap-2.5 text-lg sm:text-xl font-black"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span>{tCommon("loading")}</span>
                  </div>
                ) : (
                  <>
                    <CheckCircle2 className="w-6 h-6" />
                    <span>{t("takeNow")}</span>
                  </>
                )}
              </PrimaryButton>
            )}

            {isMissed && (
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm sm:text-base font-bold text-rose-600 dark:text-rose-400 flex items-center gap-2">
                  <XCircle className="w-5 h-5" />
                  <span>{tDose("MISSED")}</span>
                </span>
                <PrimaryButton
                  variant="danger"
                  size="md"
                  onClick={() => {
                    if ("vibrate" in navigator) navigator.vibrate([40, 20, 40]);
                    onMarkTaken?.(dose);
                  }}
                  disabled={isLoading}
                  className="gap-2"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  <span>{t("takeLate")}</span>
                </PrimaryButton>
              </div>
            )}

            {isTaken && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-extrabold text-base sm:text-lg">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>{tDose("TAKEN")}</span>
                </div>
                {onUndo && (
                  <PrimaryButton
                    variant="ghost"
                    size="sm"
                    onClick={() => onUndo(dose)}
                    disabled={isLoading}
                    className="gap-1.5 text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>{tCommon("undo")}</span>
                  </PrimaryButton>
                )}
              </div>
            )}

            {isSkipped && (
              <div className="text-sm sm:text-base font-bold text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <HelpCircle className="w-5 h-5" />
                <span>{tDose("SKIPPED")}</span>
              </div>
            )}
          </div>
        ) : (
          // Caretaker: Given / Skip controls
          <div className="flex items-center justify-between gap-2.5">
            {isPending ? (
              <>
                <PrimaryButton
                  variant="primary"
                  size="md"
                  onClick={() => onMarkGiven?.(dose)}
                  disabled={isLoading}
                  className="flex-1 gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Mark Given</span>
                </PrimaryButton>
                <PrimaryButton
                  variant="secondary"
                  size="md"
                  onClick={() => onMarkSkipped?.(dose)}
                  disabled={isLoading}
                  className="gap-1.5"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Skip</span>
                </PrimaryButton>
              </>
            ) : (
              <div className="flex items-center justify-between w-full">
                <span className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400">
                  Status: <strong className="text-slate-900 dark:text-white">{tDose(dose.status)}</strong>
                  {dose.markedByRole && ` (${dose.markedByRole})`}
                </span>
                {onUndo && isTaken && (
                  <PrimaryButton
                    variant="ghost"
                    size="sm"
                    onClick={() => onUndo(dose)}
                    disabled={isLoading}
                    className="gap-1 text-xs"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Undo</span>
                  </PrimaryButton>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </GlassPanel>
  );
}
