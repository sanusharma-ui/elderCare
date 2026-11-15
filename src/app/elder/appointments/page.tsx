"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useAuth } from "@/hooks/use-auth";
import { apiClient } from "@/lib/api-client";
import { EmptyState } from "@/components/shared/EmptyState";
import { SkeletonCard } from "@/components/shared/Skeleton";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { Calendar, MapPin, Stethoscope, Clock } from "lucide-react";

interface AppointmentItem {
  id: string;
  doctorName?: string;
  doctorSpecialization?: string;
  doctorClinic?: string;
  scheduledAt: string;
  status: "SCHEDULED" | "COMPLETED" | "CANCELLED";
  location?: string | null;
  notes?: string | null;
}

export default function ElderAppointmentsPage() {
  const t = useTranslations("elder");
  const { user } = useAuth();

  const { data, isLoading } = useQuery<{ items: AppointmentItem[] }>({
    queryKey: ["elder-appointments", user?.id],
    queryFn: () => apiClient<{ items: AppointmentItem[] }>(`/api/elders/${user?.id}/appointments`),
    enabled: !!user?.id,
  });

  const appointments = data?.items || [];

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-2xl mx-auto">
      <div>
        <span className="text-xs uppercase font-extrabold tracking-wider text-blue-600 dark:text-blue-400 block mb-1">
          Visits
        </span>
        <h1 className="font-displayDeva text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
          {t("appointmentsTitle")}
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          {t("appointmentsSubtitle")}
        </p>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <>
            <SkeletonCard lines={2} />
            <SkeletonCard lines={2} />
          </>
        ) : (
          appointments.map((apt) => {
            const aptDate = new Date(apt.scheduledAt);

            return (
              <GlassPanel
                key={apt.id}
                variant="elder"
                className="rounded-[28px] p-5 sm:p-6 space-y-3"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                    <Stethoscope className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-lg sm:text-xl leading-snug">
                      {apt.doctorName || "Doctor Visit"}
                    </h3>
                    {apt.doctorSpecialization && (
                      <span className="text-xs sm:text-sm font-bold text-blue-600 dark:text-blue-400 block mt-0.5">
                        {apt.doctorSpecialization}
                      </span>
                    )}

                    <div className="flex flex-wrap items-center gap-2 mt-2.5 text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 bg-white/70 dark:bg-white/10 px-3.5 py-1.5 rounded-full border border-slate-200/60 dark:border-white/10 tabular-nums">
                      <span className="inline-flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        <span>
                          {aptDate.toLocaleDateString("en-IN", {
                            weekday: "short",
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </span>
                      <span>•</span>
                      <span className="inline-flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        <span>
                          {aptDate.toLocaleTimeString("en-IN", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </span>
                    </div>

                    {(apt.location || apt.doctorClinic) && (
                      <div className="flex items-center gap-1.5 mt-2.5 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                        <MapPin className="w-4 h-4 text-amber-500 shrink-0" />
                        <span>{apt.location || apt.doctorClinic}</span>
                      </div>
                    )}

                    {apt.notes && (
                      <div className="mt-3 text-xs sm:text-sm text-slate-600 dark:text-slate-300 p-3 bg-white/50 dark:bg-white/5 rounded-2xl border border-white/60 dark:border-white/10">
                        <strong className="text-slate-900 dark:text-white font-bold">{t("noteLabel")}: </strong>
                        <span>{apt.notes}</span>
                      </div>
                    )}
                  </div>
                </div>
              </GlassPanel>
            );
          })
        )}

        {appointments.length === 0 && !isLoading && (
          <EmptyState
            title={t("noAppointments")}
            description={t("noAppointments")}
          />
        )}
      </div>
    </div>
  );
}
