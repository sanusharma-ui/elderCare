"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useCaretaker } from "@/components/caretaker/CaretakerContext";
import { ElderSwitcher } from "@/components/caretaker/ElderSwitcher";
import { apiClient } from "@/lib/api-client";
import { EmptyState } from "@/components/shared/EmptyState";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { Pill, AlertTriangle, Package, AlertCircle, Clock, Utensils } from "lucide-react";
import { formatTime24to12 } from "@/lib/utils";
import { useTranslations } from "next-intl";

interface MedicineItem {
  id: string;
  name: string;
  nameLocal?: string | null;
  dosage: string;
  form: string;
  foodRelation: string;
  instructions?: string | null;
  warnings?: string | null;
  stockCount: number | null;
  refillThreshold: number | null;
  schedules: { id: string; timeOfDay: string; doseQuantity: string }[];
}

export default function CaretakerMedicinesPage() {
  const { selectedElderId } = useCaretaker();
  const t = useTranslations("caretaker");

  const { data, isLoading } = useQuery<{ items: MedicineItem[] }>({
    queryKey: ["caretaker-medicines", selectedElderId],
    queryFn: () => apiClient<{ items: MedicineItem[] }>(`/api/elders/${selectedElderId}/medicines`),
    enabled: !!selectedElderId,
  });

  const medicines = data?.items || [];
  const lowStockMedicines = medicines.filter(
    (m) => m.stockCount !== null && m.refillThreshold !== null && m.stockCount <= m.refillThreshold
  );

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-2xl mx-auto">
      <ElderSwitcher />

      {/* Low Stock Warning Banner if any */}
      {lowStockMedicines.length > 0 && (
        <GlassPanel
          variant="default"
          className="rounded-[28px] p-5 border-amber-400/60 dark:border-amber-500/40 bg-amber-500/10 space-y-3"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white text-base">
                {t("lowStockTitle")}
              </h4>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1">
                {t("lowStockDescription")}
              </p>
              <ul className="mt-2.5 space-y-1 text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                {lowStockMedicines.map((m) => (
                  <li key={m.id}>
                    • {m.name}: <strong className="text-amber-600 dark:text-amber-400">{t("remaining", { count: m.stockCount || 0, threshold: m.refillThreshold || 0 })}</strong>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </GlassPanel>
      )}

      {/* Medicines List */}
      <div className="space-y-4 pt-1">
        <h2 className="font-bold text-xl text-slate-900 dark:text-white px-1">
          {t("activePrescriptions")}
        </h2>

        {medicines.map((med) => {
          const isLow =
            med.stockCount !== null &&
            med.refillThreshold !== null &&
            med.stockCount <= med.refillThreshold;

          return (
            <GlassPanel
              key={med.id}
              variant="default"
              className="rounded-[28px] p-5 sm:p-6 space-y-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                    <Pill className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-lg sm:text-xl leading-snug">
                      {med.name}
                    </h3>
                    {med.nameLocal && (
                      <span className="font-displayDeva text-sm font-bold text-blue-600 dark:text-blue-400 block">
                        {med.nameLocal}
                      </span>
                    )}
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1 block">
                      {med.dosage} • {med.form} • {med.foodRelation}
                    </span>
                  </div>
                </div>

                {med.stockCount !== null && (
                  <div
                    className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full border ${
                      isLow
                        ? "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-200/50 dark:border-rose-800/40"
                        : "bg-white/70 dark:bg-white/10 text-slate-800 dark:text-slate-200 border-slate-200/60 dark:border-white/10"
                    }`}
                  >
                    <Package className="w-3.5 h-3.5" />
                    <span>{t("remaining", { count: med.stockCount, threshold: med.refillThreshold || 0 })}</span>
                  </div>
                )}
              </div>

              {/* Schedules */}
              <div className="pt-3 border-t border-slate-200/50 dark:border-white/10 flex flex-wrap gap-2">
                {med.schedules.map((s) => (
                  <span
                    key={s.id}
                    className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 bg-white/70 dark:bg-white/10 rounded-full border border-slate-200/60 dark:border-white/10 text-slate-900 dark:text-white tabular-nums"
                  >
                    <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    <span>{formatTime24to12(s.timeOfDay)}</span>
                    <span className="text-slate-500 dark:text-slate-400">({s.doseQuantity})</span>
                  </span>
                ))}
              </div>

              {med.instructions && (
                <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                  <strong className="text-slate-900 dark:text-white font-bold">{t("instructionsLabel")}: </strong>
                  <span>{med.instructions}</span>
                </div>
              )}

              {med.warnings && (
                <div className="p-3 bg-amber-50/90 dark:bg-amber-950/40 border border-amber-300/60 dark:border-amber-700/40 rounded-2xl flex items-start gap-2.5 text-xs sm:text-sm text-slate-900 dark:text-slate-100">
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-bold text-amber-800 dark:text-amber-300">{t("warningLabel")}: </strong>
                    <span className="font-semibold">{med.warnings}</span>
                  </div>
                </div>
              )}
            </GlassPanel>
          );
        })}

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
