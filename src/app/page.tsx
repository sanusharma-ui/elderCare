"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { BrandLogo } from "@/components/shared/BrandLogo";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { Reveal } from "@/components/shared/Reveal";
import { useAuth } from "@/hooks/use-auth";
import { getRoleHome } from "@/lib/routes";
import { useI18n } from "@/lib/i18n-provider";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import {
  Calendar,
  Stethoscope,
  HeartHandshake,
  ShieldAlert,
  ArrowRight,
  LogIn,
  PlayCircle,
  Volume2,
  CheckCircle2,
  Menu,
  X,
  Clock,
  Pill,
  BellRing,
  Smartphone,
  ShieldCheck,
  Languages,
} from "lucide-react";

export default function HomePage() {
  const t = useTranslations("landing");
  const tCommon = useTranslations("common");
  const { locale } = useI18n();
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.mustChangePassword) {
        router.replace("/me/change-password");
      } else {
        router.replace(getRoleHome(user.role));
      }
    }
  }, [isAuthenticated, user, router]);

  return (
    <div className="min-h-screen bg-transparent flex flex-col selection:bg-blue-500/20">
      {/* 1. ULTRA-SLEEK, THIN STICKY HEADER */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm transition-all h-16 flex items-center">
        <div className="max-w-6xl w-full mx-auto px-4 sm:px-6 flex items-center justify-between">
          <BrandLogo size="md" href="/" />

          {/* Desktop Nav Items */}
          <nav className="hidden md:flex items-center gap-2 text-sm font-bold text-slate-600">
            <a
              href="#how-it-works"
              className="px-3 py-2 rounded-xl hover:text-blue-600 hover:bg-slate-50 transition-colors"
            >
              {t("howItWorks")}
            </a>
            <a
              href="#roles"
              className="px-3 py-2 rounded-xl hover:text-blue-600 hover:bg-slate-50 transition-colors"
            >
              {t("navRoles")}
            </a>
            <a
              href="#features"
              className="px-3 py-2 rounded-xl hover:text-blue-600 hover:bg-slate-50 transition-colors"
            >
              {t("navFeatures")}
            </a>
          </nav>

          {/* Right Header Actions */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <LanguageSwitcher compact />

            <Link href="/login" className="hidden md:inline-flex">
              <PrimaryButton variant="ghost" size="sm">
                {t("login")}
              </PrimaryButton>
            </Link>

            <Link href="/register" className="hidden md:inline-flex">
              <PrimaryButton variant="primary" size="sm">
                {t("startNow")}
              </PrimaryButton>
            </Link>

            {/* Mobile Hamburger Toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden w-10 h-10 flex items-center justify-center text-slate-800 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Drawer Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden fixed top-16 left-0 right-0 bg-white border-b border-slate-200 px-6 py-6 flex flex-col gap-4 shadow-xl animate-in slide-in-from-top-4 duration-200 z-50">
            <a
              href="#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2.5 text-base font-bold text-slate-800 dark:text-slate-200 hover:text-blue-600 border-b border-slate-200/50 dark:border-white/10"
            >
              {t("howItWorks")}
            </a>
            <a
              href="#roles"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2.5 text-base font-bold text-slate-800 dark:text-slate-200 hover:text-blue-600 border-b border-slate-200/50 dark:border-white/10"
            >
              {t("navRoles")}
            </a>
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2.5 text-base font-bold text-slate-800 dark:text-slate-200 hover:text-blue-600 border-b border-slate-200/50 dark:border-white/10"
            >
              {t("navFeatures")}
            </a>

            <div className="pt-2 flex flex-col gap-3">
              <Link
                href="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full"
              >
                <PrimaryButton variant="primary" size="lg" className="w-full">
                  {t("startNow")}
                </PrimaryButton>
              </Link>
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full"
                >
                  <PrimaryButton variant="secondary" size="md" className="w-full">
                    {t("login")}
                  </PrimaryButton>
                </Link>
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full"
                >
                  <PrimaryButton variant="secondary" size="md" className="w-full">
                    {t("tryDemo")}
                  </PrimaryButton>
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* 2. HERO CONTAINER */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-16 flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          {/* Left Column: Heading, Subtitle & Distinct CTA Buttons */}
          <div className="lg:col-span-7 flex flex-col">
            {/* Top Pill Tag */}
            <Reveal direction="down" delay={0.05}>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-blue-50/80 dark:bg-blue-950/50 backdrop-blur-md border border-blue-200/60 dark:border-blue-800/40 rounded-full text-xs font-black text-blue-600 dark:text-blue-400 mb-5 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400 animate-pulse" />
                <span>{t("badge")}</span>
              </div>
            </Reveal>

            {/* Heading: Fade Down */}
            <Reveal direction="down" delay={0.15}>
              <h1 className="font-displayDeva text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white leading-[1.15] tracking-tight">
                {t("heroTitle")}
              </h1>
            </Reveal>

            {/* Subtitle: Fade Down */}
            <Reveal direction="down" delay={0.25}>
              <p className="mt-5 text-lg sm:text-xl text-slate-600 dark:text-slate-300 leading-relaxed font-normal max-w-xl">
                {t("heroSubtitle")}
              </p>
            </Reveal>

            {/* Action Buttons: Solid Pill Primary Standard */}
            <Reveal direction="up" delay={0.35}>
              <div className="mt-8 flex flex-wrap items-center gap-3.5">
                <Link href="/register">
                  <PrimaryButton variant="primary" size="lg" className="gap-2.5">
                    <span>{t("startNow")}</span>
                    <ArrowRight className="w-4 h-4" />
                  </PrimaryButton>
                </Link>

                <Link href="/login">
                  <PrimaryButton variant="secondary" size="lg" className="gap-2">
                    <LogIn className="w-4 h-4" />
                    <span>{t("login")}</span>
                  </PrimaryButton>
                </Link>

                <Link href="/login">
                  <PrimaryButton variant="ghost" size="lg" className="gap-2">
                    <PlayCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span>{t("tryDemo")}</span>
                  </PrimaryButton>
                </Link>
              </div>
            </Reveal>

            {/* Elder Friendly Audio & Vernacular Highlight */}
            <Reveal direction="up" delay={0.45}>
              <GlassPanel variant="subtle" className="mt-8 p-5 rounded-2xl flex items-start gap-4 max-w-xl">
                <div className="w-11 h-11 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Volume2 className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                    {t("voiceTitle")}
                  </p>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed mt-1">
                    {t("builtForElders")}
                  </p>
                </div>
              </GlassPanel>
            </Reveal>
          </div>

          {/* Right Column: Hero Graphic Slide in from Right */}
          <div className="lg:col-span-5 flex justify-center">
            <Reveal direction="right" delay={0.2} className="w-full max-w-md">
              <GlassPanel variant="default" className="rounded-[36px] p-6 sm:p-7 relative overflow-hidden shadow-2xl">
                {/* Live Card Header */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-200/50 dark:border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-black text-sm shadow-md">
                      RS
                    </div>
                    <div>
                      <h4 className="text-sm sm:text-base font-black text-slate-900 dark:text-white leading-tight">
                        Ramesh Sharma (72y)
                      </h4>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        Elder • New Delhi (Asia/Kolkata)
                      </span>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-xs font-bold rounded-full border border-emerald-200/50 dark:border-emerald-800/40">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Live Schedule</span>
                  </span>
                </div>

                {/* Current Active Dose (Mockup) */}
                <div className="mt-5 p-4 bg-white/60 dark:bg-white/5 rounded-2xl border border-white/60 dark:border-white/10 space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1.5 font-bold text-blue-600 dark:text-blue-400">
                      <Clock className="w-3.5 h-3.5" />
                      <span>08:00 AM • Morning</span>
                    </span>
                    <span className="text-xs px-2.5 py-0.5 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-full font-bold">
                      After Food
                    </span>
                  </div>

                  <div className="flex items-center justify-between bg-white/80 dark:bg-white/10 p-3.5 rounded-xl border border-white/70 dark:border-white/10">
                    <div>
                      <div className="flex items-center gap-2">
                        <Pill className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        <span className="font-bold text-slate-900 dark:text-white text-base">Metformin 500mg</span>
                      </div>
                      <span className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 block">
                        Diabetes • 1 Tablet
                      </span>
                    </div>
                    <span className="px-3 py-1 bg-emerald-600 text-white text-xs font-black rounded-full flex items-center gap-1 shadow-xs">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{t("taken")}</span>
                    </span>
                  </div>
                </div>

                {/* Upcoming Next Dose */}
                <div className="mt-3 p-3.5 bg-white/40 dark:bg-white/5 rounded-2xl border border-white/40 dark:border-white/10 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white block text-sm">
                        Amlodipine 5mg • 01:30 PM
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        After Lunch • Blood Pressure
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-full border border-amber-200/50 dark:border-amber-800/40">
                    Upcoming
                  </span>
                </div>

                {/* Proactive Notification Chip */}
                <div className="mt-4 p-3.5 bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/50 dark:border-blue-800/40 rounded-2xl flex items-center gap-3 text-xs text-blue-700 dark:text-blue-300">
                  <BellRing className="w-4 h-4 shrink-0 text-blue-600 dark:text-blue-400" />
                  <span className="leading-tight">
                    <strong>Care Circle Alert:</strong> Family notified automatically when Papa took morning dose.
                  </span>
                </div>

                {/* Stats */}
                <div className="mt-4 pt-3 border-t border-slate-200/50 dark:border-white/10 grid grid-cols-2 gap-3 text-center text-xs">
                  <div className="p-3 bg-white/50 dark:bg-white/5 rounded-xl border border-white/60 dark:border-white/10">
                    <span className="text-xl font-black text-blue-600 dark:text-blue-400 block">98%</span>
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">On-Time Adherence</span>
                  </div>
                  <div className="p-3 bg-white/50 dark:bg-white/5 rounded-xl border border-white/60 dark:border-white/10">
                    <span className="text-xl font-black text-amber-500 block">0 Delay</span>
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Missed Dose Alerts</span>
                  </div>
                </div>
              </GlassPanel>
            </Reveal>
          </div>
        </div>

        {/* 3. ROLES SECTION: CARDS FADE UP WITH STAGGERED DELAYS */}
        <section id="roles" className="mt-20 pt-14 border-t border-slate-200/60 dark:border-white/10">
          <div className="mb-12 text-center max-w-2xl mx-auto">
            <Reveal direction="down" delay={0.1}>
              <h2 className="font-display text-3xl sm:text-4xl font-black text-slate-900 dark:text-white">
                {t("howItWorks")}
              </h2>
            </Reveal>
            <Reveal direction="down" delay={0.2}>
              <p className="text-base text-slate-600 dark:text-slate-300 mt-2">
                {t("howItWorksSubtitle")}
              </p>
            </Reveal>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Card 1: Elder Diary (Span 7) */}
            <div className="md:col-span-7">
              <Reveal direction="up" delay={0.1} className="h-full">
                <GlassPanel variant="default" className="rounded-[32px] p-7 sm:p-8 flex flex-col justify-between h-full space-y-6">
                  <div>
                    <span className="inline-block px-3 py-1 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 text-xs font-bold rounded-full mb-3 border border-blue-200/50 dark:border-blue-800/40">
                      {t("elderRole")}
                    </span>
                    <h3 className="font-displayDeva text-2xl font-black text-slate-900 dark:text-white">
                      {t("elderCardTitle")}
                    </h3>
                    <p className="text-slate-600 dark:text-slate-300 text-base mt-2 leading-relaxed">
                      {t("elderCardDesc")}
                    </p>
                  </div>

                  <div className="p-4 bg-white/60 dark:bg-white/5 rounded-2xl border border-white/60 dark:border-white/10 space-y-2.5">
                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-bold">
                      <span>{t("morningDose")}</span>
                      <span className="text-blue-600 dark:text-blue-400">08:00 AM</span>
                    </div>
                    <div className="flex items-center justify-between bg-white/80 dark:bg-white/10 p-3.5 rounded-xl border border-white/70 dark:border-white/10">
                      <div>
                        <span className="font-bold text-slate-900 dark:text-white text-base block">Metformin 500mg</span>
                        <span className="text-xs text-blue-600 dark:text-blue-400 font-bold">
                          {t("afterFood")}
                        </span>
                      </div>
                      <span className="px-3 py-1 bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-bold rounded-full flex items-center gap-1 shadow-xs">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{t("taken")}</span>
                      </span>
                    </div>
                  </div>
                </GlassPanel>
              </Reveal>
            </div>

            {/* Card 2: Doctor Console (Span 5) */}
            <div className="md:col-span-5">
              <Reveal direction="up" delay={0.2} className="h-full">
                <GlassPanel variant="default" className="rounded-[32px] p-7 sm:p-8 flex flex-col justify-between h-full space-y-6">
                  <div>
                    <span className="inline-block px-3 py-1 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 text-xs font-bold rounded-full mb-3 border border-amber-200/50 dark:border-amber-800/40">
                      {t("doctorRole")}
                    </span>
                    <h3 className="font-display text-2xl font-black text-slate-900 dark:text-white">
                      {t("doctorCardTitle")}
                    </h3>
                    <p className="text-slate-600 dark:text-slate-300 text-base mt-2 leading-relaxed">
                      {t("doctorCardDesc")}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 p-3.5 bg-white/60 dark:bg-white/5 rounded-2xl border border-white/60 dark:border-white/10 text-xs font-bold text-slate-800 dark:text-slate-200">
                    <Stethoscope className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
                    <span>AI Clinical Digest &amp; Vision Prescription Scanning</span>
                  </div>
                </GlassPanel>
              </Reveal>
            </div>

            {/* Card 3: Caretaker Care (Span 6) */}
            <div className="md:col-span-6">
              <Reveal direction="up" delay={0.3} className="h-full">
                <GlassPanel variant="default" className="rounded-[32px] p-7 sm:p-8 flex flex-col justify-between h-full space-y-6">
                  <div>
                    <span className="inline-block px-3 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-xs font-bold rounded-full mb-3 border border-emerald-200/50 dark:border-emerald-800/40">
                      {t("caretakerRole")}
                    </span>
                    <h3 className="font-displayDeva text-2xl font-black text-slate-900 dark:text-white">
                      {t("caretakerCardTitle")}
                    </h3>
                    <p className="text-slate-600 dark:text-slate-300 text-base mt-2 leading-relaxed">
                      {t("caretakerCardDesc")}
                    </p>
                  </div>

                  <div className="flex items-center gap-2.5 text-xs text-slate-600 dark:text-slate-300">
                    <HeartHandshake className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                    <span>{t("caretakerSync")}</span>
                  </div>
                </GlassPanel>
              </Reveal>
            </div>

            {/* Card 4: Family Reassurance (Span 6) */}
            <div className="md:col-span-6">
              <Reveal direction="up" delay={0.4} className="h-full">
                <GlassPanel variant="default" className="rounded-[32px] p-7 sm:p-8 flex flex-col justify-between h-full space-y-6">
                  <div>
                    <span className="inline-block px-3 py-1 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs font-bold rounded-full mb-3 border border-rose-200/50 dark:border-rose-800/40">
                      {t("familyRole")}
                    </span>
                    <h3 className="font-display text-2xl font-black text-slate-900 dark:text-white">
                      {t("familyCardTitle")}
                    </h3>
                    <p className="text-slate-600 dark:text-slate-300 text-base mt-2 leading-relaxed">
                      {t("familyCardDesc")}
                    </p>
                  </div>

                  <div className="flex items-center gap-2.5 text-xs text-rose-600 dark:text-rose-400 font-bold">
                    <ShieldAlert className="w-4 h-4 shrink-0" />
                    <span>{t("familyAlert")}</span>
                  </div>
                </GlassPanel>
              </Reveal>
            </div>
          </div>
        </section>

        {/* 4. KEY FEATURES SECTION */}
        <section id="features" className="mt-20 pt-14 border-t border-slate-200/60 dark:border-white/10">
          <div className="mb-12 text-center max-w-2xl mx-auto">
            <Reveal direction="down" delay={0.1}>
              <h2 className="font-display text-3xl sm:text-4xl font-black text-slate-900 dark:text-white">
                {t("indiaTitle")}
              </h2>
            </Reveal>
            <Reveal direction="down" delay={0.2}>
              <p className="text-base text-slate-600 dark:text-slate-300 mt-2">
                {t("indiaSubtitle")}
              </p>
            </Reveal>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <Reveal direction="up" delay={0.15}>
              <GlassPanel variant="default" className="p-6 rounded-[28px] space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white text-lg">
                  {t("passcodeFeature")}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {t("passcodeDescription")}
                </p>
              </GlassPanel>
            </Reveal>

            <Reveal direction="up" delay={0.25}>
              <GlassPanel variant="default" className="p-6 rounded-[28px] space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Smartphone className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white text-lg">
                  {t("pwaFeature")}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {t("pwaDescription")}
                </p>
              </GlassPanel>
            </Reveal>

            <Reveal direction="up" delay={0.35}>
              <GlassPanel variant="default" className="p-6 rounded-[28px] space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Languages className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white text-lg">
                  {t("languageFeature")}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {t("languageDescription")}
                </p>
              </GlassPanel>
            </Reveal>
          </div>
        </section>

        {/* 5. BOTTOM CTA BANNER */}
        <section className="mt-20">
          <Reveal direction="up" delay={0.2}>
            <GlassPanel variant="default" className="rounded-[36px] p-8 sm:p-14 text-center relative overflow-hidden shadow-2xl">
              <div className="max-w-2xl mx-auto space-y-4">
                <h2 className="font-displayDeva text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white leading-tight">
                  {t("ctaTitle")}
                </h2>
                <p className="text-slate-600 dark:text-slate-300 text-base sm:text-lg">
                  {t("ctaDescription")}
                </p>
                <div className="pt-4 flex flex-wrap justify-center items-center gap-4">
                  <Link href="/register">
                    <PrimaryButton variant="primary" size="lg" className="gap-2">
                      <span>{t("startNow")}</span>
                      <ArrowRight className="w-4 h-4" />
                    </PrimaryButton>
                  </Link>
                  <Link href="/login">
                    <PrimaryButton variant="secondary" size="lg">
                      <span>{t("login")}</span>
                    </PrimaryButton>
                  </Link>
                </div>
              </div>
            </GlassPanel>
          </Reveal>
        </section>
      </main>

      {/* 6. FOOTER */}
      <footer className="border-t border-slate-200/60 dark:border-white/10 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md py-8 px-6 text-center text-xs text-slate-500 dark:text-slate-400 mt-16">
        <p>© 2026 CareSaathi. Built for Indian families with care and dignity.</p>
      </footer>
    </div>
  );
}
