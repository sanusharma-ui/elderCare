"use client";

import React from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { apiClient } from "@/lib/api-client";
import { EmptyState } from "@/components/shared/EmptyState";
import { InstallPrompt } from "@/components/shared/InstallPrompt";
import { SkeletonCard } from "@/components/shared/Skeleton";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
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
      toast.success(t("unlinkElder"));
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to unlink");
    },
  });

  const elders = eldersData || [];
  const alerts = alertsData?.items || [];

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-2xl mx-auto">
      {/* Header Banner */}
      <div>
        <span className="text-xs uppercase font-extrabold tracking-wider text-blue-600 dark:text-blue-400 block mb-1">
          Family Portal
        </span>
        <h1 className="font-display text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
          {t("title")}
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          {t("subtitle")}
        </p>
      </div>

      {/* Linked Elders Section */}
      <GlassPanel variant="default" className="rounded-[32px] p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span>{t("linkedElders")} ({elders.length})</span>
          </h2>
          <Link href="/family/link">
            <PrimaryButton variant="ghost" size="sm" className="gap-1.5 text-blue-600 dark:text-blue-400">
              <PlusCircle className="w-4 h-4" />
              <span>{t("linkElder")}</span>
            </PrimaryButton>
          </Link>
        </div>

        <div className="space-y-3">
          {eldersLoading ? (
            <SkeletonCard lines={1} />
          ) : (
            elders.map((elder) => (
              <div
                key={elder.id}
                className="p-4 bg-white/50 dark:bg-white/5 rounded-2xl border border-white/60 dark:border-white/10 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 font-black flex items-center justify-center text-base">
                    {elder.name[0]}
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white text-base block">
                      {elder.name}
                    </span>
                    <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                      ✓ {t("linkedStatus")}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    if (confirm(t("unlinkConfirm", { name: elder.name }))) {
                      unlinkMutation.mutate(elder.id);
                    }
                  }}
                  className="p-2 text-slate-400 hover:text-rose-600 rounded-full hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                  title="Unlink"
                >
                  <Unlink className="w-4 h-4" />
                </button>
              </div>
            ))
          )}

          {elders.length === 0 && !eldersLoading && (
            <div className="text-center py-8 bg-white/40 dark:bg-white/5 rounded-2xl space-y-3">
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                {t("notLinked")}
              </p>
              <Link href="/family/link">
                <PrimaryButton variant="primary" size="md">
                  <PlusCircle className="w-4 h-4 mr-2" />
                  <span>{t("linkWithPasscode")}</span>
                </PrimaryButton>
              </Link>
            </div>
          )}
        </div>
      </GlassPanel>

      {/* Proactive Alerts Feed */}
      <div className="space-y-4">
        <h2 className="font-bold text-lg text-slate-900 dark:text-white px-1 flex items-center gap-2">
          <Bell className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <span>{t("alertFeed")}</span>
        </h2>

        {alertsLoading ? (
          <>
            <SkeletonCard lines={2} />
            <SkeletonCard lines={2} />
          </>
        ) : (
          alerts.map((alert) => (
            <GlassPanel
              key={alert.id}
              variant="default"
              className={`rounded-[28px] p-5 space-y-2.5 ${
                alert.type === "MISSED_DOSE"
                  ? "border-rose-400/60 dark:border-rose-800/40 bg-rose-50/20"
                  : ""
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  {alert.type === "MISSED_DOSE" && (
                    <ShieldAlert className="w-5 h-5 text-rose-500 shrink-0" />
                  )}
                  <span>{alert.title}</span>
                </span>
                <span className="text-xs text-slate-400 dark:text-slate-500 shrink-0 tabular-nums">
                  {new Date(alert.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>

              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {alert.body}
              </p>

              {alert.type === "MISSED_DOSE" && (
                <div className="pt-2.5 border-t border-rose-200/50 dark:border-rose-900/30 flex items-center justify-between text-xs text-rose-600 dark:text-rose-400 font-bold">
                  <span className="flex items-center gap-1.5">
                    <PhoneCall className="w-4 h-4" />
                    <span>{t("callSuggestion")}</span>
                  </span>
                </div>
              )}
            </GlassPanel>
          ))
        )}

        {alerts.length === 0 && !alertsLoading && (
          <EmptyState
            title={t("allNormal")}
            description={t("noAlerts")}
          />
        )}
      </div>

      <InstallPrompt />
    </div>
  );
}
