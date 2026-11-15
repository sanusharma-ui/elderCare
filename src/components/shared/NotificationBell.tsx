"use client";

import React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import { apiClient } from "@/lib/api-client";

export function NotificationBell({ href = "/notifications" }: { href?: string }) {
  const { data } = useQuery<{ unreadCount: number }>({
    queryKey: ["notifications-unread-count"],
    queryFn: () => apiClient<{ unreadCount: number }>("/api/notifications/unread-count"),
    refetchInterval: 30000, // Poll every 30s
  });

  const count = data?.unreadCount || 0;

  return (
    <Link
      href={href}
      className="relative p-2.5 rounded-xl bg-surface border border-line text-ink hover:bg-paper active:scale-95 transition-all flex items-center justify-center shadow-xs"
      aria-label={`Notifications ${count > 0 ? `(${count} unread)` : ""}`}
    >
      <Bell className="w-5 h-5 text-forest" />
      {count > 0 && (
        <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-brick text-surface text-[11px] font-bold rounded-full flex items-center justify-center border-2 border-surface">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </Link>
  );
}
