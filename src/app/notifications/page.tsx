"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { EmptyState } from "@/components/shared/EmptyState";
import { useAuth } from "@/hooks/use-auth";
import { getRoleHome } from "@/lib/routes";
import {
  Bell,
  CheckCheck,
  ArrowLeft,
  Loader2,
  Calendar,
  Pill,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { PrimaryButton } from "@/components/ui/PrimaryButton";

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string;
  data: any;
  readAt: string | null;
  createdAt: string;
}

export default function NotificationsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<{ items: NotificationItem[] }>({
    queryKey: ["all-notifications"],
    queryFn: () => apiClient<{ items: NotificationItem[] }>("/api/notifications?limit=50"),
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => apiClient("/api/notifications/read-all", { method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-unread-count"] });
      toast.success("सभी सूचनाएं पढ़ी हुई मार्क की गईं!");
    },
  });

  const markSingleReadMutation = useMutation({
    mutationFn: (id: string) =>
      apiClient(`/api/notifications/${id}/read`, { method: "PATCH" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-unread-count"] });
    },
  });

  const notifications = data?.items || [];
  const unreadCount = notifications.filter((n) => !n.readAt).length;

  return (
    <div className="min-h-screen bg-transparent p-4 sm:p-6 lg:p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Navigation Bar */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => {
              if (user) router.push(getRoleHome(user.role));
              else router.back();
            }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/60 dark:bg-white/[0.05] border border-white/60 dark:border-white/10 text-xs font-bold text-ink hover:bg-white/90 dark:hover:bg-white/10 transition-all shadow-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>वापस • Go Back</span>
          </button>

          {unreadCount > 0 && (
            <button
              onClick={() => markAllReadMutation.mutate()}
              disabled={markAllReadMutation.isPending}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-accent-blue/15 border border-accent-blue/20 text-xs font-bold text-accent-blue hover:bg-accent-blue/25 transition-all disabled:opacity-50"
            >
              {markAllReadMutation.isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <CheckCheck className="w-3.5 h-3.5" />
              )}
              <span>सभी को पढ़ा हुआ मार्क करें • Mark All Read</span>
            </button>
          )}
        </div>

        {/* Title Header */}
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-accent-blue">
            Notification Center
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-ink flex items-center gap-3 mt-1">
            <Bell className="w-6 h-6 text-accent-blue" />
            <span>सूचनाएं एवं अलर्ट • Notifications</span>
          </h1>
          <p className="text-xs sm:text-sm text-ink-muted mt-1">
            दवाओं, अपॉइंटमेंट्स और स्वास्थ्य नोट्स से संबंधित सभी अलर्ट
          </p>
        </div>

        {/* Feed */}
        <div className="space-y-3">
          {notifications.map((notif) => {
            const isUnread = !notif.readAt;

            return (
              <GlassPanel
                key={notif.id}
                variant={isUnread ? "default" : "subtle"}
                onClick={() => {
                  if (isUnread) markSingleReadMutation.mutate(notif.id);
                }}
                className={`p-4 sm:p-5 rounded-2xl transition-all cursor-pointer ${
                  isUnread
                    ? "border-accent-blue/30 dark:border-accent-blue/40 ring-1 ring-accent-blue/10"
                    : "opacity-80"
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-1.5">
                  <div className="flex items-center gap-2.5">
                    {isUnread && (
                      <span className="w-2.5 h-2.5 rounded-full bg-accent-blue shrink-0 shadow-xs animate-pulse" />
                    )}
                    <h3 className="font-bold text-sm sm:text-base text-ink">
                      {notif.title}
                    </h3>
                  </div>

                  <span className="text-[11px] font-semibold text-ink-muted shrink-0 tabular-nums">
                    {new Date(notif.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-ink-muted leading-relaxed pl-5">
                  {notif.body}
                </p>
              </GlassPanel>
            );
          })}

          {notifications.length === 0 && !isLoading && (
            <GlassPanel variant="subtle" className="p-8 text-center rounded-3xl">
              <EmptyState
                title="कोई सूचना नहीं है"
                description="इस समय आपके लिए कोई नई सूचना या अलर्ट नहीं है।"
              />
            </GlassPanel>
          )}
        </div>
      </div>
    </div>
  );
}
