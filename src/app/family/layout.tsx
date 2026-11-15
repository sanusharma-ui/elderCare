"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { MobileShell } from "@/components/shared/MobileShell";
import { BottomNav, NavItem } from "@/components/shared/BottomNav";
import { useAuth } from "@/hooks/use-auth";

export default function FamilyLayout({ children }: { children: React.ReactNode }) {
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

  const navItems: NavItem[] = [
    { key: "home", href: "/family/home", label: "होम • Home", icon: "home" },
    { key: "link", href: "/family/link", label: "जोड़ें • Link", icon: "link" },
    { key: "me", href: "/family/me", label: "मेरा • Me", icon: "me" },
  ];

  return (
    <MobileShell
      roleBadge="परिवार • Family"
      bottomNav={<BottomNav items={navItems} />}
    >
      {children}
    </MobileShell>
  );
}
