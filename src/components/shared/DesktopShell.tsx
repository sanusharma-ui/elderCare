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
      icon: <LayoutDashboard className="w-4 h-4" />,
    },
    {
      href: "/doctor/patients",
      label: "Patients Directory",
      icon: <Users className="w-4 h-4" />,
    },
    {
      href: "/doctor/appointments",
      label: "Appointments",
      icon: <Calendar className="w-4 h-4" />,
    },
  ];

  return (
    <div className="min-h-screen bg-transparent flex flex-col">
      {/* Top Glass Header */}
      <header className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3.5 flex items-center justify-between sticky top-0 z-40 shadow-sm">
        <div className="flex items-center gap-6">
          <BrandLogo size="md" href="/doctor/dashboard" />
          <div className="hidden md:flex items-center gap-2 pl-4 border-l border-white/40 dark:border-white/10 text-xs">
            <span className="font-bold text-accent-blue flex items-center gap-1.5 bg-accent-blue/10 px-2.5 py-1 rounded-full border border-accent-blue/20">
              <Stethoscope className="w-3.5 h-3.5" />
              <span>Doctor Console</span>
            </span>
            {clinicName && (
              <span className="text-ink-muted font-semibold truncate max-w-[200px]">
                {clinicName}
              </span>
            )}
          </div>
        </div>

        {/* Desktop Nav Items in Frosted Glass Pills */}
        <nav className="hidden lg:flex items-center gap-1 rounded-2xl border border-slate-200 bg-slate-50 p-1">
          {navLinks.map((link) => {
            const isActive = pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all",
                  isActive
                    ? "bg-slate-900 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-950 hover:bg-white"
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
            <div className="hidden sm:flex flex-col text-right pl-3 border-l border-white/40 dark:border-white/10">
              <span className="text-sm font-black text-ink leading-tight">
                {doctorName}
              </span>
              <span className="text-xs font-semibold text-ink-muted leading-tight">
                Senior Physician
              </span>
            </div>
          )}

          <button
            onClick={handleLogout}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-ink-muted hover:text-rose-500 rounded-full hover:bg-white/40 dark:hover:bg-white/10 transition-all active:scale-95"
            title="Log out"
          >
            <LogOut className="w-4 h-4" />
            <span>Exit</span>
          </button>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-slate-900 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-slate-200 px-4 sm:px-6 py-4 flex flex-col gap-2.5 shadow-xl">
          {navLinks.map((link) => {
            const isActive = pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold",
                  isActive
                    ? "bg-slate-900 text-white shadow-xs"
                    : "text-slate-700 hover:bg-slate-100"
                )}
              >
                {link.icon}
                <span>{link.label}</span>
              </Link>
            );
          })}
          <div className="pt-3 border-t border-white/40 dark:border-white/10 flex items-center justify-between">
            <span className="text-xs font-bold text-ink-muted">{doctorName}</span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-xs text-rose-500 font-bold py-1 px-3"
            >
              <LogOut className="w-4 h-4" />
              <span>Log out</span>
            </button>
          </div>
        </div>
      )}

      {/* Desktop Main Content Canvas (Cardless open layout directly on ambient background) */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}
