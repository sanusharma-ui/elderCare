"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useAuth } from "@/hooks/use-auth";
import { apiClient } from "@/lib/api-client";
import { EmptyState } from "@/components/shared/EmptyState";
import { SkeletonCard } from "@/components/shared/Skeleton";
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
    <div className="p-4 sm:p-5 space-y-4">
      <div>
        <h1 className="font-displayDeva text-2xl font-bold text-ink">
          {t("appointmentsTitle")}
        </h1>
        <p className="text-xs text-ink-muted mt-0.5">
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
              <div
                key={apt.id}
                className="bg-surface border border-line rounded-2xl p-5 shadow-xs relative overflow-hidden"
              >
              <div className="flex items-start gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-forest-soft flex items-center justify-center shrink-0 text-forest">
                  <Stethoscope className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-ink text-lg leading-snug">
                    {apt.doctorName || "Doctor Visit"}
                  </h3>
                  {apt.doctorSpecialization && (
                    <span className="text-xs font-semibold text-forest block">
                      {apt.doctorSpecialization}
                    </span>
                  )}

                  <div className="flex items-center gap-2 mt-2 text-xs font-semibold text-ink bg-paper-2 px-3 py-1.5 rounded-xl border border-line inline-flex">
                    <Calendar className="w-4 h-4 text-forest" />
                    <span>
                      {aptDate.toLocaleDateString("en-IN", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                    <span>•</span>
                    <Clock className="w-3.5 h-3.5 text-forest" />
                    <span>
                      {aptDate.toLocaleTimeString("en-IN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  {(apt.location || apt.doctorClinic) && (
                    <div className="flex items-center gap-1.5 mt-2.5 text-xs text-ink-muted">
                      <MapPin className="w-4 h-4 text-saffron shrink-0" />
                      <span>{apt.location || apt.doctorClinic}</span>
                    </div>
                  )}

                  {apt.notes && (
                    <div className="mt-3 text-xs text-ink-muted p-2.5 bg-paper rounded-xl border border-line/60">
                      <strong className="text-ink">{t("noteLabel")}: </strong>
                      <span>{apt.notes}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        }))}

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
