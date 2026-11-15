"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { DesktopShell } from "@/components/shared/DesktopShell";
import { useAuth } from "@/hooks/use-auth";

export default function DoctorLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.replace("/login");
      } else if (user?.role !== "DOCTOR") {
        router.replace("/");
      } else if (user?.mustChangePassword) {
        router.replace("/me/change-password");
      }
    }
  }, [isLoading, isAuthenticated, user, router]);

  return (
    <DesktopShell
      doctorName={user?.name}
      clinicName={user?.doctorProfile?.clinicName}
    >
      {children}
    </DesktopShell>
  );
}
