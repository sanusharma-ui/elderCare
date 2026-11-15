"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { MobileShell } from "@/components/shared/MobileShell";
import { BottomNav, NavItem } from "@/components/shared/BottomNav";
import { useAuth } from "@/hooks/use-auth";
import { useTranslations } from "next-intl";

export default function FamilyLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const t = useTranslations("family");
  const tRoles = useTranslations("roles");
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
    { key: "home", href: "/family/home", label: t("title"), icon: "home" },
    { key: "link", href: "/family/link", label: t("linkElder"), icon: "link" },
    { key: "me", href: "/family/me", label: t("title"), icon: "me" },
  ];

  return (
    <MobileShell
      roleBadge={tRoles("FAMILY")}
      bottomNav={<BottomNav items={navItems} />}
    >
      {children}
    </MobileShell>
  );
}
