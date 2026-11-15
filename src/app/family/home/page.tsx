"use client";

import React from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { apiClient } from "@/lib/api-client";
import { EmptyState } from "@/components/shared/EmptyState";
import { InstallPrompt } from "@/components/shared/InstallPrompt";
import { SkeletonCard } from "@/components/shared/Skeleton";
import {
  Users,
  ShieldAlert,
  Bell,
  PhoneCall,
  Clock,
  PlusCircle,
  Unlink,
} from "lucide-react";
import { toast } from "sonner";

interface LinkedElder {
  id: string;
  name: string;
  relation: string;
}

interface NotificationItem {
  id: string;
  elderId?: string | null;
  type: string;
  title: string;
  body: string;
  data: any;
  createdAt: string;
  readAt: string | null;
}

export default function FamilyHomePage() {
  const t = useTranslations("family");
  const queryClient = useQueryClient();

  // Fetch linked elders
  const { data: eldersData, isLoading: eldersLoading } = useQuery<LinkedElder[]>({
    queryKey: ["family-elders"],
    queryFn: () => apiClient<LinkedElder[]>("/api/me/elders"),
  });

  // Fetch in-app notifications / alerts
  const { data: alertsData, isLoading: alertsLoading } = useQuery<{ items: NotificationItem[] }>({
    queryKey: ["family-alerts"],
    queryFn: () => apiClient<{ items: NotificationItem[] }>("/api/notifications?limit=20"),
    refetchInterval: 30000,
  });

  // Unlink Mutation
  const unlinkMutation = useMutation({
    mutationFn: (elderId: string) =>
      apiClient(`/api/me/links/${elderId}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["family-elders"] });
      queryClient.invalidateQueries({ queryKey: ["family-alerts"] });
      toast.success("संबद्धता हटा दी गई");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to unlink");
    },
  });

  const elders = eldersData || [];
  const alerts = alertsData?.items || [];

  return (
    <div className="p-4 sm:p-5 space-y-6">
      {/* Header Banner */}
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">
          {t("title")}
        </h1>
        <p className="text-xs text-ink-muted mt-0.5">
          {t("subtitle")}
        </p>
      </div>

      {/* Linked Elders Section */}
      <div className="bg-surface border border-line rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-sm text-ink uppercase tracking-wider flex items-center gap-1.5">
            <Users className="w-4 h-4 text-forest" />
            <span>{t("linkedElders")} ({elders.length})</span>
          </h2>
          <Link
            href="/family/link"
            className="text-xs font-bold text-forest hover:underline flex items-center gap-1"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>{t("linkElder")}</span>
          </Link>
        </div>

        <div className="space-y-2">
          {eldersLoading ? (
            <SkeletonCard lines={1} />
          ) : (
            elders.map((elder) => (
            <div
              key={elder.id}
              className="p-3 bg-paper rounded-xl border border-line flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-forest-soft text-forest font-bold flex items-center justify-center text-sm">
                  {elder.name[0]}
                </div>
                <div>
                  <span className="font-bold text-ink text-sm block">
                    {elder.name}
                  </span>
                  <span className="text-[11px] text-ok font-semibold">
                    ✓ केयर सर्कल में जुड़े हैं
                  </span>
                </div>
              </div>

              <button
                onClick={() => {
                  if (confirm(t("unlinkConfirm", { name: elder.name }))) {
                    unlinkMutation.mutate(elder.id);
                  }
                }}
                className="text-xs text-ink-muted hover:text-brick p-1 rounded-lg"
                title="Unlink"
              >
                <Unlink className="w-4 h-4" />
              </button>
            </div>
          ))
        )}

          {elders.length === 0 && !eldersLoading && (
            <div className="text-center py-6">
              <p className="text-xs text-ink-muted mb-3">
                आपने अभी किसी बुजुर्ग को लिंक नहीं किया है।
              </p>
              <Link
                href="/family/link"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-forest text-surface text-xs font-bold rounded-xl"
              >
                <PlusCircle className="w-4 h-4" />
                <span>पासकोड से लिंक करें</span>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Proactive Alerts Feed */}
      <div className="space-y-3">
        <h2 className="font-bold text-base text-ink px-1 flex items-center gap-1.5">
          <Bell className="w-4 h-4 text-forest" />
          <span>{t("alertFeed")}</span>
        </h2>

        {alertsLoading ? (
          <>
            <SkeletonCard lines={2} />
            <SkeletonCard lines={2} />
          </>
        ) : (
          alerts.map((alert) => (
          <div
            key={alert.id}
            className={`p-4 rounded-2xl border shadow-xs transition-all ${
              alert.type === "MISSED_DOSE"
                ? "bg-brick-soft/60 border-brick/40"
                : "bg-surface border-line"
            }`}
          >
            <div className="flex items-start justify-between gap-2 mb-1">
              <span className="font-bold text-sm text-ink flex items-center gap-1.5">
                {alert.type === "MISSED_DOSE" && (
                  <ShieldAlert className="w-4 h-4 text-brick shrink-0" />
                )}
                <span>{alert.title}</span>
              </span>
              <span className="text-[11px] text-ink-muted shrink-0 tabular-nums">
                {new Date(alert.createdAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>

            <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">
              {alert.body}
            </p>

            {alert.type === "MISSED_DOSE" && (
              <div className="mt-3 pt-2.5 border-t border-brick/20 flex items-center justify-between text-xs text-brick font-semibold">
                <span className="flex items-center gap-1.5">
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span>{t("callSuggestion")}</span>
                </span>
              </div>
            )}
          </div>
        ))
      )}

        {alerts.length === 0 && !alertsLoading && (
          <EmptyState
            title="सब कुछ सामान्य है"
            description={t("noAlerts")}
          />
        )}
      </div>

      <InstallPrompt />
    </div>
  );
}
