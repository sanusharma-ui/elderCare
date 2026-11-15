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
} from "lucide-react";
import { cn, formatTime24to12 } from "@/lib/utils";

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

  const isTaken = dose.status === "TAKEN" || dose.status === "GIVEN";
  const isMissed = dose.status === "MISSED";
  const isPending = dose.status === "PENDING";
  const isSkipped = dose.status === "SKIPPED";

  // Form icon
  const renderFormIcon = () => {
    return <Pill className="w-5 h-5 text-forest" />;
  };

  return (
    <div
      className={cn(
        "relative bg-surface border rounded-2xl p-4 sm:p-5 transition-all shadow-xs overflow-hidden",
        isTaken && "border-ok/30 bg-ok/5",
        isMissed && "border-brick/40 bg-brick/5",
        isPending && "border-line",
        isSkipped && "border-line bg-paper-2/50"
      )}
    >
      {/* Left status color bar */}
      <div
        className={cn(
          "absolute left-0 top-0 bottom-0 w-1.5",
          isTaken && "bg-ok",
          isMissed && "bg-brick",
          isPending && "bg-saffron",
          isSkipped && "bg-ink-muted"
        )}
      />

      {/* Top row: Medicine Name, Local Name & Scheduled Time */}
      <div className="flex items-start justify-between gap-3 pl-2">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-forest-soft flex items-center justify-center shrink-0 mt-0.5">
            {renderFormIcon()}
          </div>
          <div>
            <div className="flex items-baseline gap-2 flex-wrap">
              <h3 className="font-bold text-ink text-lg sm:text-xl leading-snug">
                {dose.medicineName}
              </h3>
              {dose.nameLocal && (
                <span className="font-displayDeva text-base font-semibold text-forest">
                  ({dose.nameLocal})
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 mt-1 text-xs text-ink-muted flex-wrap">
              <span className="font-semibold text-ink px-2 py-0.5 bg-paper-2 rounded-md">
                {dose.doseQuantity}
              </span>
              <span className="flex items-center gap-1">
                <Utensils className="w-3.5 h-3.5 text-forest" />
                <span>{tFood(dose.foodRelation)}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Time Badge */}
        <div className="flex flex-col items-end shrink-0">
          <div className="flex items-center gap-1 text-sm font-semibold text-ink bg-paper-2 px-2.5 py-1 rounded-lg border border-line tabular-nums">
            <Clock className="w-3.5 h-3.5 text-forest" />
            <span>{formatTime24to12(dose.timeOfDay)}</span>
          </div>
          {isTaken && dose.takenAt && (
            <span className="text-[11px] font-medium text-ok mt-1">
              {new Date(dose.takenAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
        </div>
      </div>

      {/* Instructions if present */}
      {dose.instructions && (
        <div className="mt-3 pl-2 text-xs text-ink-muted leading-relaxed">
          <span className="font-semibold text-ink">{t("instructions")}: </span>
          <span>{dose.instructions}</span>
        </div>
      )}

      {/* PROMINENT WARNING CALLOUT ("what NOT to do") */}
      {dose.warnings && (
        <div className="mt-3 ml-2 p-2.5 bg-saffron-soft/70 border border-saffron/40 rounded-xl flex items-start gap-2.5 text-ink text-xs sm:text-sm">
          <AlertTriangle className="w-4 h-4 text-saffron shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-ink">{t("warningNotice")}: </span>
            <span className="text-ink font-medium leading-tight">
              {dose.warnings}
            </span>
          </div>
        </div>
      )}

      {/* Action Bar */}
      <div className="mt-4 pt-3 border-t border-line/60 pl-2">
        {isElderView ? (
          // Elder: Huge min 56px primary button
          <div>
            {isPending && (
              <button
                onClick={() => {
                  if ("vibrate" in navigator) navigator.vibrate([40, 20, 40]);
                  onMarkTaken?.(dose);
                }}
                disabled={isLoading}
                className="w-full min-h-[56px] bg-forest hover:bg-forest-hover active:scale-[0.98] text-surface text-lg sm:text-xl font-bold rounded-2xl flex items-center justify-center gap-2 shadow-xs transition-all disabled:opacity-50"
              >
                <CheckCircle2 className="w-6 h-6" />
                <span>{t("takeNow")}</span>
              </button>
            )}

            {isMissed && (
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-semibold text-brick flex items-center gap-1.5">
                  <XCircle className="w-4 h-4" />
                  <span>{tDose("MISSED")}</span>
                </span>
                <button
                  onClick={() => {
                    if ("vibrate" in navigator) navigator.vibrate([40, 20, 40]);
                    onMarkTaken?.(dose);
                  }}
                  disabled={isLoading}
                  className="px-4 min-h-[48px] bg-brick hover:bg-brick/90 text-surface text-sm sm:text-base font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition-all"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{t("takeLate")}</span>
                </button>
              </div>
            )}

            {isTaken && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-ok font-bold text-sm sm:text-base">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>{tDose("TAKEN")}</span>
                </div>
                {onUndo && (
                  <button
                    onClick={() => onUndo(dose)}
                    disabled={isLoading}
                    className="text-xs font-semibold text-ink-muted hover:text-ink flex items-center gap-1 px-3 py-1.5 rounded-lg border border-line bg-surface active:bg-paper-2"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Undo</span>
                  </button>
                )}
              </div>
            )}

            {isSkipped && (
              <div className="text-sm font-semibold text-ink-muted flex items-center gap-2">
                <HelpCircle className="w-4 h-4" />
                <span>{tDose("SKIPPED")}</span>
              </div>
            )}
          </div>
        ) : (
          // Caretaker: Given / Skip controls
          <div className="flex items-center justify-between gap-2">
            {isPending ? (
              <>
                <button
                  onClick={() => onMarkGiven?.(dose)}
                  disabled={isLoading}
                  className="flex-1 min-h-[48px] bg-forest text-surface font-semibold rounded-xl text-sm flex items-center justify-center gap-1.5 hover:bg-forest-hover active:scale-95"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Mark Given</span>
                </button>
                <button
                  onClick={() => onMarkSkipped?.(dose)}
                  disabled={isLoading}
                  className="px-3 min-h-[48px] bg-paper-2 border border-line text-ink-muted hover:text-ink font-semibold rounded-xl text-sm flex items-center justify-center gap-1 active:scale-95"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Skip</span>
                </button>
              </>
            ) : (
              <div className="flex items-center justify-between w-full">
                <span className="text-xs font-semibold text-ink-muted">
                  Status: <strong className="text-ink">{tDose(dose.status)}</strong>
                  {dose.markedByRole && ` (${dose.markedByRole})`}
                </span>
                {onUndo && isTaken && (
                  <button
                    onClick={() => onUndo(dose)}
                    disabled={isLoading}
                    className="text-xs font-semibold text-ink-muted hover:text-ink flex items-center gap-1 px-2.5 py-1 rounded-lg border border-line bg-surface"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Undo</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
