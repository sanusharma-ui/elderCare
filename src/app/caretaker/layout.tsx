"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { MobileShell } from "@/components/shared/MobileShell";
import { BottomNav, NavItem } from "@/components/shared/BottomNav";
import { CaretakerProvider } from "@/components/caretaker/CaretakerContext";
import { useAuth } from "@/hooks/use-auth";
import { useTranslations } from "next-intl";

export default function CaretakerLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const t = useTranslations("caretakerNav");
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

  const navItems: NavItem[] = [
    { key: "today", href: "/caretaker/today", label: t("today"), icon: "today" },
    { key: "medicines", href: "/caretaker/medicines", label: t("medicines"), icon: "medicines" },
    { key: "notes", href: "/caretaker/notes", label: t("notes"), icon: "notes" },
    { key: "me", href: "/caretaker/me", label: t("me"), icon: "me" },
  ];

  return (
    <CaretakerProvider>
      <MobileShell
        roleBadge={t("role")}
        bottomNav={<BottomNav items={navItems} />}
      >
        {children}
      </MobileShell>
    </CaretakerProvider>
  );
}
