"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { MobileShell } from "@/components/shared/MobileShell";
import { BottomNav, NavItem } from "@/components/shared/BottomNav";
import { useAuth } from "@/hooks/use-auth";
import { useTranslations } from "next-intl";

export default function ElderLayout({ children }: { children: React.ReactNode }) {
  const t = useTranslations("elder.tabs");
  const tRoles = useTranslations("roles");
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.replace("/login");
      } else if (user?.mustChangePassword) {
        router.replace("/me/change-password");
      }
    }
  }, [isLoading, isAuthenticated, user, router]);

  // Set large text mode attribute on body if elder profile has largeTextMode
  useEffect(() => {
    if (user?.elderProfile?.largeTextMode) {
      document.body.setAttribute("data-text-size", "large");
    } else {
      document.body.removeAttribute("data-text-size");
    }
  }, [user]);

  const navItems: NavItem[] = [
    { key: "today", href: "/elder/today", label: t("today"), icon: "today" },
    { key: "medicines", href: "/elder/medicines", label: t("medicines"), icon: "medicines" },
    { key: "appointments", href: "/elder/appointments", label: t("appointments"), icon: "doctor" },
    { key: "me", href: "/elder/me", label: t("me"), icon: "me" },
  ];

  return (
    <MobileShell
      roleBadge={tRoles("ELDER")}
      bottomNav={<BottomNav items={navItems} />}
    >
      {children}
    </MobileShell>
  );
}
