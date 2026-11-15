"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useAuth } from "@/hooks/use-auth";
import { apiClient } from "@/lib/api-client";
import { EmptyState } from "@/components/shared/EmptyState";
import { SkeletonCard } from "@/components/shared/Skeleton";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { Pill, AlertTriangle, Utensils, Clock, Package } from "lucide-react";
import { formatTime24to12 } from "@/lib/utils";

interface MedicineSchedule {
  id: string;
  timeOfDay: string;
  slot: string;
  daysOfWeek: number[];
  doseQuantity: string;
}

interface MedicineItem {
  id: string;
  name: string;
  nameLocal?: string | null;
  genericName?: string | null;
  dosage: string;
  form: string;
  foodRelation: string;
  instructions?: string | null;
  warnings?: string | null;
  stockCount: number | null;
  refillThreshold: number | null;
  schedules: MedicineSchedule[];
}

export default function ElderMedicinesPage() {
  const t = useTranslations("elder");
  const tFood = useTranslations("foodRelation");
  const { user } = useAuth();

  const { data, isLoading } = useQuery<{ items: MedicineItem[] }>({
    queryKey: ["elder-medicines", user?.id],
    queryFn: () => apiClient<{ items: MedicineItem[] }>(`/api/elders/${user?.id}/medicines`),
    enabled: !!user?.id,
  });

  const medicines = data?.items || [];

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-2xl mx-auto">
      <div>
        <span className="text-xs uppercase font-extrabold tracking-wider text-blue-600 dark:text-blue-400 block mb-1">
          Prescriptions
        </span>
        <h1 className="font-displayDeva text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
          {t("medicinesTitle")}
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          {t("medicinesSubtitle")}
        </p>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <>
            <SkeletonCard lines={3} />
            <SkeletonCard lines={3} />
            <SkeletonCard lines={3} />
          </>
        ) : (
          medicines.map((med) => (
            <GlassPanel
              key={med.id}
              variant="elder"
              className="rounded-[28px] p-5 sm:p-6 space-y-4"
            >
              {/* Top Row */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Pill className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-baseline gap-2.5 flex-wrap">
                      <h3 className="font-bold text-slate-900 dark:text-white text-xl sm:text-2xl">
                        {med.name}
                      </h3>
                      {med.nameLocal && (
                        <span className="font-displayDeva text-lg sm:text-xl font-bold text-blue-600 dark:text-blue-400">
                          ({med.nameLocal})
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1.5 text-xs sm:text-sm text-slate-600 dark:text-slate-300 flex-wrap">
                      <span className="font-bold text-slate-900 dark:text-white px-2.5 py-0.5 bg-white/70 dark:bg-white/10 rounded-full border border-slate-200/60 dark:border-white/10">
                        {med.dosage} • {med.form}
                      </span>
                      <span className="flex items-center gap-1 font-semibold">
                        <Utensils className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        <span>{tFood(med.foodRelation as any)}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Stock info if tracked */}
                {med.stockCount !== null && (
                  <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold px-3 py-1 bg-white/70 dark:bg-white/10 rounded-full border border-slate-200/60 dark:border-white/10 text-slate-800 dark:text-slate-200 shrink-0">
                    <Package className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span>{t("stockRemaining", { count: med.stockCount })}</span>
                  </div>
                )}
              </div>

              {/* Timings / Schedules */}
              <div className="pt-3 border-t border-slate-200/50 dark:border-white/10">
                <span className="text-xs sm:text-sm font-bold text-slate-500 dark:text-slate-400 block mb-2">
                  {t("timings")}:
                </span>
                <div className="flex flex-wrap gap-2">
                  {med.schedules.map((sch) => (
                    <span
                      key={sch.id}
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/70 dark:bg-white/10 border border-slate-200/60 dark:border-white/10 rounded-full text-xs sm:text-sm font-bold text-slate-900 dark:text-white tabular-nums"
                    >
                      <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      <span>{formatTime24to12(sch.timeOfDay)}</span>
                      <span className="text-slate-500 dark:text-slate-400">({sch.doseQuantity})</span>
                    </span>
                  ))}
                </div>
              </div>

              {/* Instructions */}
              {med.instructions && (
                <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                  <strong className="text-slate-900 dark:text-white font-bold">{t("instructionsLabel")}: </strong>
                  <span>{med.instructions}</span>
                </div>
              )}

              {/* Warnings */}
              {med.warnings && (
                <div className="p-3 bg-amber-50/90 dark:bg-amber-950/40 border border-amber-300/60 dark:border-amber-700/40 rounded-2xl flex items-start gap-2.5 text-slate-900 dark:text-slate-100 text-xs sm:text-sm">
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-bold text-amber-800 dark:text-amber-300">{t("warningLabel")}: </strong>
                    <span className="font-semibold">{med.warnings}</span>
                  </div>
                </div>
              )}
            </GlassPanel>
          ))
        )}

        {medicines.length === 0 && !isLoading && (
          <EmptyState
            title={t("noMedicines")}
            description={t("noMedicinesDescription")}
          />
        )}
      </div>
    </div>
  );
}
