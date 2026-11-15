"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useCaretaker } from "@/components/caretaker/CaretakerContext";
import { ElderSwitcher } from "@/components/caretaker/ElderSwitcher";
import { apiClient } from "@/lib/api-client";
import { EmptyState } from "@/components/shared/EmptyState";
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
    <div className="p-4 sm:p-5 space-y-4">
      <ElderSwitcher />

      {/* Low Stock Warning Banner if any */}
      {lowStockMedicines.length > 0 && (
        <div className="p-4 bg-saffron-soft border-2 border-saffron rounded-2xl flex items-start gap-3 shadow-xs">
          <AlertCircle className="w-5 h-5 text-saffron shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-ink text-sm">
              {t("lowStockTitle")}
            </h4>
            <p className="text-xs text-ink-muted mt-1">
              {t("lowStockDescription")}
            </p>
            <ul className="mt-2 space-y-1 text-xs font-semibold text-ink">
              {lowStockMedicines.map((m) => (
                <li key={m.id}>
                  • {m.name}: <strong>{t("remaining", { count: m.stockCount || 0, threshold: m.refillThreshold || 0 })}</strong>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Medicines List */}
      <div className="space-y-4 pt-1">
        <h2 className="font-bold text-lg text-ink px-1">
          {t("activePrescriptions")}
        </h2>

        {medicines.map((med) => {
          const isLow =
            med.stockCount !== null &&
            med.refillThreshold !== null &&
            med.stockCount <= med.refillThreshold;

          return (
            <div
              key={med.id}
              className="bg-surface border border-line rounded-2xl p-4 sm:p-5 shadow-xs relative overflow-hidden"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-forest-soft flex items-center justify-center shrink-0">
                    <Pill className="w-5 h-5 text-forest" />
                  </div>
                  <div>
                    <h3 className="font-bold text-ink text-lg leading-snug">
                      {med.name}
                    </h3>
                    {med.nameLocal && (
                      <span className="font-displayDeva text-sm font-semibold text-forest block">
                        {med.nameLocal}
                      </span>
                    )}
                    <span className="text-xs font-medium text-ink-muted mt-1 block">
                      {med.dosage} • {med.form} • {med.foodRelation}
                    </span>
                  </div>
                </div>

                {med.stockCount !== null && (
                  <div
                    className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg border ${
                      isLow
                        ? "bg-brick-soft text-brick border-brick/30"
                        : "bg-paper-2 text-ink border-line"
                    }`}
                  >
                    <Package className="w-3.5 h-3.5" />
                    <span>{t("remaining", { count: med.stockCount, threshold: med.refillThreshold || 0 })}</span>
                  </div>
                )}
              </div>

              {/* Schedules */}
              <div className="mt-3 pt-3 border-t border-line/60 flex flex-wrap gap-2">
                {med.schedules.map((s) => (
                  <span
                    key={s.id}
                    className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 bg-paper-2 rounded-md border border-line text-ink"
                  >
                    <Clock className="w-3 h-3 text-forest" />
                    <span>{formatTime24to12(s.timeOfDay)}</span>
                    <span className="text-ink-muted">({s.doseQuantity})</span>
                  </span>
                ))}
              </div>

              {med.instructions && (
                <div className="mt-2.5 text-xs text-ink-muted">
                  <strong>{t("instructionsLabel")}: </strong>
                  <span>{med.instructions}</span>
                </div>
              )}

              {med.warnings && (
                <div className="mt-2.5 p-2.5 bg-saffron-soft/70 border border-saffron/30 rounded-xl flex items-start gap-2 text-xs text-ink">
                  <AlertTriangle className="w-4 h-4 text-saffron shrink-0 mt-0.5" />
                  <div>
                    <strong>{t("warningLabel")}: </strong>
                    <span>{med.warnings}</span>
                  </div>
                </div>
              )}
            </div>
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
