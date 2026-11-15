"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useAuth } from "@/hooks/use-auth";
import { getRoleHome } from "@/lib/routes";
import {
  Bell,
  CheckCheck,
  ShieldAlert,
  Calendar,
  Pill,
  ArrowLeft,
  Clock,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

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
    <div className="min-h-screen bg-paper p-4 sm:p-6 lg:p-8 selection:bg-forest-soft">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Back Link */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => {
              if (user) router.push(getRoleHome(user.role));
              else router.back();
            }}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-forest hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>वापस • Go Back</span>
          </button>

          {unreadCount > 0 && (
            <button
              onClick={() => markAllReadMutation.mutate()}
              disabled={markAllReadMutation.isPending}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-forest hover:underline disabled:opacity-50"
            >
              {markAllReadMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCheck className="w-4 h-4" />
              )}
              <span>सभी को पढ़ा हुआ मार्क करें • Mark All Read</span>
            </button>
          )}
        </div>

        {/* Title */}
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink flex items-center gap-2.5">
            <Bell className="w-6 h-6 text-forest" />
            <span>सूचनाएं एवं अलर्ट • Notifications</span>
          </h1>
          <p className="text-xs text-ink-muted mt-1">
            दवाओं, अपॉइंटमेंट्स और स्वास्थ्य नोट्स से संबंधित सभी अलर्ट
          </p>
        </div>

        {/* Feed */}
        <div className="space-y-3">
          {notifications.map((notif) => {
            const isUnread = !notif.readAt;

            return (
              <div
                key={notif.id}
                onClick={() => {
                  if (isUnread) markSingleReadMutation.mutate(notif.id);
                }}
                className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer shadow-xs ${
                  isUnread
                    ? "bg-surface border-forest/30 ring-1 ring-forest/10"
                    : "bg-paper-2/60 border-line text-ink-muted"
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-1">
                  <div className="flex items-center gap-2">
                    {isUnread && (
                      <span className="w-2 h-2 rounded-full bg-forest shrink-0" />
                    )}
                    <h3 className="font-bold text-sm sm:text-base text-ink">
                      {notif.title}
                    </h3>
                  </div>

                  <span className="text-[11px] text-ink-muted shrink-0 tabular-nums">
                    {new Date(notif.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-ink-muted leading-relaxed mt-1">
                  {notif.body}
                </p>
              </div>
            );
          })}

          {notifications.length === 0 && !isLoading && (
            <EmptyState
              title="कोई सूचना नहीं है"
              description="इस समय आपके लिए कोई नई सूचना या अलर्ट नहीं है।"
            />
          )}
        </div>
      </div>
    </div>
  );
}
