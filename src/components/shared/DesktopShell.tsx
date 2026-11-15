"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BrandLogo } from "./BrandLogo";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { NotificationBell } from "./NotificationBell";
import {
  LayoutDashboard,
  Users,
  Calendar,
  LogOut,
  Menu,
  X,
  Stethoscope,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { apiClient } from "@/lib/api-client";

export function DesktopShell({
  children,
  doctorName,
  clinicName,
}: {
  children: React.ReactNode;
  doctorName?: string;
  clinicName?: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await apiClient("/api/auth/logout", { method: "POST" });
    } finally {
      router.push("/login");
    }
  };

  const navLinks = [
    {
      href: "/doctor/dashboard",
      label: "Clinical Dashboard",
      icon: <LayoutDashboard className="w-5 h-5" />,
    },
    {
      href: "/doctor/patients",
      label: "Patients Directory",
      icon: <Users className="w-5 h-5" />,
    },
    {
      href: "/doctor/appointments",
      label: "Appointments",
      icon: <Calendar className="w-5 h-5" />,
    },
  ];

  return (
    <div className="min-h-screen bg-transparent flex flex-col">
      {/* Top Ledger Header */}
      <header className="bg-surface/90 backdrop-blur-md border-b border-line px-6 py-3.5 flex items-center justify-between sticky top-0 z-40 shadow-xs">
        <div className="flex items-center gap-6">
          <BrandLogo size="md" href="/doctor/dashboard" />
          <div className="hidden md:flex items-center gap-2 pl-4 border-l border-line text-xs">
            <span className="font-semibold text-forest flex items-center gap-1.5 bg-forest-soft px-2.5 py-1 rounded-full">
              <Stethoscope className="w-3.5 h-3.5" />
              <span>Doctor Console</span>
            </span>
            {clinicName && (
              <span className="text-ink-muted truncate max-w-[200px]">
                {clinicName}
              </span>
            )}
          </div>
        </div>

        {/* Desktop Nav Items */}
        <nav className="hidden lg:flex items-center gap-2">
          {navLinks.map((link) => {
            const isActive = pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all",
                  isActive
                    ? "bg-forest text-surface shadow-xs"
                    : "text-ink-muted hover:text-ink hover:bg-paper"
                )}
              >
                {link.icon}
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Actions & Controls */}
        <div className="flex items-center gap-3">
          <LanguageSwitcher compact />
          <NotificationBell />

          {/* Doctor Profile Info */}
          {doctorName && (
            <div className="hidden sm:flex flex-col text-right pl-3 border-l border-line">
              <span className="text-sm font-bold text-ink leading-tight">
                {doctorName}
              </span>
              <span className="text-xs text-ink-muted leading-tight">
                Senior Physician
              </span>
            </div>
          )}

          <button
            onClick={handleLogout}
            className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-sm text-ink-muted hover:text-brick rounded-xl hover:bg-paper border border-transparent hover:border-line transition-all active:scale-95"
            title="Log out"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-xs font-semibold">Exit</span>
          </button>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-ink rounded-xl border border-line bg-surface"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-surface border-b border-line px-6 py-4 flex flex-col gap-3 shadow-smriti-float">
          {navLinks.map((link) => {
            const isActive = pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium",
                  isActive
                    ? "bg-forest text-surface font-semibold"
                    : "text-ink hover:bg-paper"
                )}
              >
                {link.icon}
                <span>{link.label}</span>
              </Link>
            );
          })}
          <div className="pt-3 border-t border-line flex items-center justify-between">
            <span className="text-sm text-ink-muted">{doctorName}</span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-sm text-brick font-semibold py-1 px-3"
            >
              <LogOut className="w-4 h-4" />
              <span>Log out</span>
            </button>
          </div>
        </div>
      )}

      {/* Desktop Main Content Canvas */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}
