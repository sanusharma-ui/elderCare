"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useAuth } from "@/hooks/use-auth";
import { apiClient } from "@/lib/api-client";
import { EmptyState } from "@/components/shared/EmptyState";
import { SkeletonCard } from "@/components/shared/Skeleton";
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
    <div className="p-4 sm:p-5 space-y-4">
      <div>
        <h1 className="font-displayDeva text-2xl font-bold text-ink">
          {t("medicinesTitle")}
        </h1>
        <p className="text-xs text-ink-muted mt-0.5">
          डॉक्टर द्वारा निर्धारित आपकी सभी सक्रिय दवाइयां
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
          <div
            key={med.id}
            className="bg-surface border border-line rounded-2xl p-4 sm:p-5 shadow-xs relative overflow-hidden"
          >
            {/* Top Row */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-forest-soft flex items-center justify-center shrink-0 mt-0.5">
                  <Pill className="w-5 h-5 text-forest" />
                </div>
                <div>
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <h3 className="font-bold text-ink text-lg sm:text-xl">
                      {med.name}
                    </h3>
                    {med.nameLocal && (
                      <span className="font-displayDeva text-base font-semibold text-forest">
                        ({med.nameLocal})
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-xs text-ink-muted">
                    <span className="font-semibold text-ink px-2 py-0.5 bg-paper-2 rounded-md">
                      {med.dosage} • {med.form}
                    </span>
                    <span className="flex items-center gap-1">
                      <Utensils className="w-3.5 h-3.5 text-forest" />
                      <span>{tFood(med.foodRelation as any)}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Stock info if tracked */}
              {med.stockCount !== null && (
                <div className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 bg-paper-2 rounded-lg border border-line">
                  <Package className="w-3.5 h-3.5 text-forest" />
                  <span>{med.stockCount} बाकी</span>
                </div>
              )}
            </div>

            {/* Timings / Schedules */}
            <div className="mt-3.5 pt-3 border-t border-line/60">
              <span className="text-xs font-semibold text-ink-muted block mb-1.5">
                खुराक का समय • Timings:
              </span>
              <div className="flex flex-wrap gap-2">
                {med.schedules.map((sch) => (
                  <span
                    key={sch.id}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-paper-2 border border-line rounded-lg text-xs font-semibold text-ink"
                  >
                    <Clock className="w-3 h-3 text-forest" />
                    <span>{formatTime24to12(sch.timeOfDay)}</span>
                    <span className="text-ink-muted">({sch.doseQuantity})</span>
                  </span>
                ))}
              </div>
            </div>

            {/* Instructions */}
            {med.instructions && (
              <div className="mt-3 text-xs text-ink-muted">
                <strong className="text-ink">निर्देश: </strong>
                <span>{med.instructions}</span>
              </div>
            )}

            {/* PROMINENT WARNINGS ("what NOT to do") */}
            {med.warnings && (
              <div className="mt-3 p-3 bg-saffron-soft/70 border border-saffron/40 rounded-xl flex items-start gap-2.5 text-ink text-xs sm:text-sm">
                <AlertTriangle className="w-4 h-4 text-saffron shrink-0 mt-0.5" />
                <div>
                  <strong className="font-bold text-ink">ज़रूरी सावधानी: </strong>
                  <span>{med.warnings}</span>
                </div>
              </div>
            )}
          </div>
        )))}

        {medicines.length === 0 && !isLoading && (
          <EmptyState
            title="कोई दवा नहीं मिली"
            description="आपके खाते में अभी कोई दवा पंजीकृत नहीं है।"
          />
        )}
      </div>
    </div>
  );
}
