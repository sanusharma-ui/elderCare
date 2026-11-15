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
    <div className="min-h-screen bg-transparent flex flex-col selection:bg-forest-soft">
      {/* 1. ULTRA-SLEEK, THIN STICKY HEADER */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-surface/90 border-b border-line/70 shadow-xs transition-all h-14 sm:h-16 flex items-center">
        <div className="max-w-6xl w-full mx-auto px-3.5 sm:px-6 flex items-center justify-between">
          <BrandLogo size="md" href="/" />

          {/* Desktop Nav Items */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-semibold text-ink-muted">
            <a
              href="#how-it-works"
              className="hover:text-forest transition-colors"
            >
              {t("howItWorks")}
            </a>
            <a href="#roles" className="hover:text-forest transition-colors">
              {locale === "en" ? "Roles" : locale === "hi" ? "भूमिकाएं" : "भूमिका"}
            </a>
            <a href="#features" className="hover:text-forest transition-colors">
              {locale === "en" ? "Features" : locale === "hi" ? "सुविधाएं" : "वैशिष्ट्ये"}
            </a>
          </nav>

          {/* Right Header Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            <LanguageSwitcher compact />

            {/* Desktop Only Buttons - Kept out of mobile to keep navbar thin & clean */}
            <Link
              href="/login"
              className="hidden md:inline-flex px-3.5 py-1.5 text-sm font-bold text-ink-muted hover:text-ink rounded-lg transition-all"
            >
              {t("login")}
            </Link>

            <Link
              href="/register"
              className="hidden md:inline-flex px-4 py-2 text-sm font-bold bg-[#0D4436] hover:bg-[#083026] text-white rounded-xl shadow-xs transition-all active:scale-95"
            >
              {t("startNow")}
            </Link>

            {/* Mobile Hamburger Toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden w-9 h-9 flex items-center justify-center text-ink hover:bg-paper rounded-xl border border-line/60 transition-colors"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Drawer Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden fixed top-14 left-0 right-0 bg-surface/98 backdrop-blur-2xl border-b border-line px-5 py-5 flex flex-col gap-3 shadow-smriti-float animate-slide-up z-50">
            <a
              href="#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2.5 text-base font-semibold text-ink hover:text-forest border-b border-line/30"
            >
              {t("howItWorks")}
            </a>
            <a
              href="#roles"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2.5 text-base font-semibold text-ink hover:text-forest border-b border-line/30"
            >
              {locale === "en" ? "Roles" : locale === "hi" ? "भूमिकाएं" : "भूमिका"}
            </a>
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2.5 text-base font-semibold text-ink hover:text-forest border-b border-line/30"
            >
              {locale === "en" ? "Features" : locale === "hi" ? "सुविधाएं" : "वैशिष्ट्ये"}
            </a>

            <div className="pt-2 flex flex-col gap-2.5">
              <Link
                href="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-3 text-sm font-bold bg-[#0D4436] text-white rounded-xl shadow-sm"
              >
                {t("startNow")}
              </Link>
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center py-2.5 text-sm font-bold text-slate-800 bg-white border border-slate-300 rounded-xl"
                >
                  {t("login")}
                </Link>
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center py-2.5 text-sm font-bold text-white bg-indigo-600 rounded-xl"
                >
                  {t("tryDemo")}
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* 2. HERO CONTAINER WITH SLIDE-IN HERO CARD & FADE-DOWN HEADINGS */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-14 flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Heading, Subtitle & Distinct CTA Buttons */}
          <div className="lg:col-span-7 flex flex-col">
            {/* Top Pill Tag - Clean, Trustworthy & No Sparkles/Emojis */}
            <Reveal direction="down" delay={0.05}>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-surface/90 backdrop-blur-md border border-forest/20 rounded-full text-xs font-bold text-forest mb-4 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-forest animate-pulse" />
                <span>{t("badge")}</span>
              </div>
            </Reveal>

            {/* Heading: Fade Down */}
            <Reveal direction="down" delay={0.15}>
              <h1 className="font-displayDeva text-4xl sm:text-5xl lg:text-6xl font-extrabold text-ink leading-[1.16] tracking-tight">
                {t("heroTitle")}
              </h1>
            </Reveal>

            {/* Subtitle: Fade Down */}
            <Reveal direction="down" delay={0.25}>
              <p className="mt-5 text-lg sm:text-xl text-ink-muted leading-relaxed font-normal max-w-xl">
                {t("heroSubtitle")}
              </p>
            </Reveal>

            {/* Action Buttons: Three Distinct, Purposeful Colors & Zero Emojis */}
            <Reveal direction="up" delay={0.35}>
              <div className="mt-8 flex flex-wrap items-center gap-3 sm:gap-4">
                {/* 1. Primary CTA: Deep Forest Emerald */}
                <Link
                  href="/register"
                  className="min-h-[50px] px-7 bg-[#0D4436] hover:bg-[#083026] text-white font-bold text-base rounded-xl flex items-center gap-2.5 shadow-sm transition-all active:scale-95"
                >
                  <span>{t("startNow")}</span>
                  <ArrowRight className="w-4 h-4 text-emerald-300" />
                </Link>

                {/* 2. Secondary CTA: Crisp Porcelain / Slate Glass */}
                <Link
                  href="/login"
                  className="min-h-[50px] px-6 bg-white/95 hover:bg-white text-slate-900 border border-slate-300 font-bold text-base rounded-xl flex items-center gap-2 shadow-xs transition-all active:scale-95 hover:border-slate-400"
                >
                  <LogIn className="w-4 h-4 text-slate-600" />
                  <span>{t("login")}</span>
                </Link>

                {/* 3. Demo Sandbox: Vibrant Royal Indigo */}
                <Link
                  href="/login"
                  className="min-h-[50px] px-5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-base rounded-xl flex items-center gap-2 shadow-sm transition-all active:scale-95"
                >
                  <PlayCircle className="w-4 h-4 text-indigo-200" />
                  <span>{t("tryDemo")}</span>
                </Link>
              </div>
            </Reveal>

            {/* Elder Friendly Audio & Vernacular Highlight */}
            <Reveal direction="up" delay={0.45}>
              <div className="mt-8 p-4 bg-surface/90 backdrop-blur-md border border-line/80 rounded-2xl flex items-start gap-3.5 shadow-smriti max-w-xl">
                <div className="w-10 h-10 rounded-xl bg-forest-soft text-forest flex items-center justify-center shrink-0 mt-0.5">
                  <Volume2 className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-ink">
                    {locale === "en"
                      ? "Vernacular Voice Reminders"
                      : locale === "hi"
                      ? "आवाज़ में याद दिलाने की सुविधा"
                      : "आवाजात आठवण करून देण्याची सोय"}
                  </p>
                  <p className="text-xs text-ink-muted leading-relaxed mt-0.5">
                    {t("builtForElders")}
                  </p>
                </div>
              </div>
            </Reveal>
          </div>

          {/* Right Column: Hero Graphic Slide in from Right */}
          <div className="lg:col-span-5 flex justify-center">
            <Reveal direction="right" delay={0.2} className="w-full max-w-md">
              <div className="bg-surface/90 backdrop-blur-xl border-2 border-forest/20 rounded-[32px] p-6 shadow-smriti-float relative overflow-hidden">
                {/* Background decorative glow */}
                <div className="absolute top-0 right-0 w-36 h-36 bg-forest-soft/60 rounded-bl-full pointer-events-none" />

                {/* Live Card Header */}
                <div className="flex items-center justify-between pb-4 border-b border-line/70">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-forest text-surface flex items-center justify-center font-bold text-sm">
                      RS
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-ink leading-tight">
                        Ramesh Sharma (72y)
                      </h4>
                      <span className="text-[11px] text-ink-muted">
                        Elder • New Delhi (Asia/Kolkata)
                      </span>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-ok-soft text-ok text-[11px] font-bold rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-ok animate-pulse" />
                    <span>Live Schedule</span>
                  </span>
                </div>

                {/* Current Active Dose (Mockup) */}
                <div className="mt-4 p-4 bg-paper/80 rounded-2xl border border-line">
                  <div className="flex items-center justify-between text-xs text-ink-muted mb-2">
                    <span className="flex items-center gap-1.5 font-bold text-forest">
                      <Clock className="w-3.5 h-3.5" />
                      <span>08:00 AM • Morning</span>
                    </span>
                    <span className="text-[11px] px-2 py-0.5 bg-forest-soft text-forest rounded-md font-semibold">
                      After Food
                    </span>
                  </div>

                  <div className="flex items-center justify-between bg-surface p-3.5 rounded-xl border border-line/80 shadow-xs">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <Pill className="w-4 h-4 text-forest" />
                        <span className="font-bold text-ink text-base">Metformin 500mg</span>
                      </div>
                      <span className="text-xs text-ink-muted mt-0.5 block">
                        Diabetes • 1 Tablet
                      </span>
                    </div>
                    <span className="px-3 py-1.5 bg-ok text-surface text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{locale === "en" ? "Taken" : "ले ली"}</span>
                    </span>
                  </div>
                </div>

                {/* Upcoming Next Dose */}
                <div className="mt-3 p-3 bg-surface/60 rounded-xl border border-line/60 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-saffron" />
                    <div>
                      <span className="font-semibold text-ink block">
                        Amlodipine 5mg • 01:30 PM
                      </span>
                      <span className="text-[11px] text-ink-muted">
                        After Lunch • Blood Pressure
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-saffron bg-saffron-soft px-2.5 py-1 rounded-lg">
                    Upcoming
                  </span>
                </div>

                {/* Proactive Notification Chip */}
                <div className="mt-4 p-3 bg-forest-soft/70 border border-forest/20 rounded-xl flex items-center gap-2.5 text-xs text-forest">
                  <BellRing className="w-4 h-4 shrink-0 text-forest" />
                  <span className="leading-tight">
                    <strong>Care Circle Alert:</strong> Family notified automatically when Papa took morning dose.
                  </span>
                </div>

                {/* Floating Metrics */}
                <div className="mt-4 pt-3 border-t border-line/60 grid grid-cols-2 gap-2 text-center text-xs">
                  <div className="p-2 bg-surface rounded-lg border border-line/60">
                    <span className="text-base font-extrabold text-forest block">98%</span>
                    <span className="text-[11px] text-ink-muted">On-Time Adherence</span>
                  </div>
                  <div className="p-2 bg-surface rounded-lg border border-line/60">
                    <span className="text-base font-extrabold text-saffron block">0 Delay</span>
                    <span className="text-[11px] text-ink-muted">Missed Dose Alerts</span>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>

        {/* 3. ROLES SECTION: CARDS FADE UP WITH STAGGERED DELAYS */}
        <section id="roles" className="mt-20 pt-14 border-t border-line/70">
          <div className="mb-10 text-center max-w-2xl mx-auto">
            <Reveal direction="down" delay={0.1}>
              <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-ink">
                {t("howItWorks")}
              </h2>
            </Reveal>
            <Reveal direction="down" delay={0.2}>
              <p className="text-base text-ink-muted mt-2">
                {t("howItWorksSubtitle")}
              </p>
            </Reveal>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
            {/* Card 1: Elder Diary (Span 7) - Fade up with delay 0.1 */}
            <div className="md:col-span-7">
              <Reveal direction="up" delay={0.1} className="h-full">
                <div className="h-full bg-surface/90 backdrop-blur-md border-2 border-forest/20 rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-smriti flex flex-col justify-between hover:shadow-smriti-float transition-all">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-forest-soft/40 rounded-bl-full pointer-events-none" />

                  <div>
                    <span className="inline-block px-3 py-1 bg-forest-soft text-forest text-xs font-bold rounded-full mb-3">
                      {locale === "en" ? "Elder Role • Center of Care" : "Elder Role • मुख्य केंद्र"}
                    </span>
                    <h3 className="font-displayDeva text-2xl font-bold text-ink">
                      {t("elderCardTitle")}
                    </h3>
                    <p className="text-ink-muted text-base mt-2.5 leading-relaxed">
                      {t("elderCardDesc")}
                    </p>
                  </div>

                  <div className="mt-6 p-4 bg-paper/90 rounded-2xl border border-line">
                    <div className="flex items-center justify-between text-xs text-ink-muted mb-2 font-medium">
                      <span>{locale === "en" ? "Morning Dose" : "सुबह की खुराक"}</span>
                      <span className="text-forest font-bold">08:00 AM</span>
                    </div>
                    <div className="flex items-center justify-between bg-surface p-3 rounded-xl border border-line">
                      <div>
                        <span className="font-bold text-ink text-base block">Metformin 500mg</span>
                        <span className="text-xs text-forest font-medium">
                          {locale === "en" ? "After Food" : "खाने के बाद"}
                        </span>
                      </div>
                      <span className="px-3 py-1.5 bg-forest text-surface text-xs font-bold rounded-lg flex items-center gap-1 shadow-xs">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{locale === "en" ? "Taken" : "ले ली"}</span>
                      </span>
                    </div>
                  </div>
                </div>
              </Reveal>
            </div>

            {/* Card 2: Doctor Console (Span 5) - Fade up with delay 0.2 */}
            <div className="md:col-span-5">
              <Reveal direction="up" delay={0.2} className="h-full">
                <div className="h-full bg-surface/90 backdrop-blur-md border border-line rounded-3xl p-6 sm:p-7 relative overflow-hidden shadow-smriti flex flex-col justify-between hover:shadow-smriti-float transition-all">
                  <div>
                    <span className="inline-block px-3 py-1 bg-saffron-soft text-ink text-xs font-bold rounded-full mb-3">
                      {locale === "en" ? "Doctor • Clinical Ledger" : "Doctor • क्लिनिकल लेजर"}
                    </span>
                    <h3 className="font-display text-xl sm:text-2xl font-bold text-ink">
                      {t("doctorCardTitle")}
                    </h3>
                    <p className="text-ink-muted text-sm sm:text-base mt-2 leading-relaxed">
                      {t("doctorCardDesc")}
                    </p>
                  </div>

                  <div className="mt-6 flex items-center gap-3 p-3 bg-paper-2 rounded-xl text-xs text-ink font-medium">
                    <Stethoscope className="w-5 h-5 text-forest shrink-0" />
                    <span>AI Clinical Digest &amp; Vision Prescription Scanning</span>
                  </div>
                </div>
              </Reveal>
            </div>

            {/* Card 3: Caretaker Care (Span 6) - Fade up with delay 0.3 */}
            <div className="md:col-span-6">
              <Reveal direction="up" delay={0.3} className="h-full">
                <div className="h-full bg-surface/90 backdrop-blur-md border border-line rounded-3xl p-6 sm:p-7 shadow-smriti flex flex-col justify-between hover:shadow-smriti-float transition-all">
                  <div>
                    <span className="inline-block px-3 py-1 bg-paper-2 text-ink text-xs font-bold rounded-full mb-3">
                      {locale === "en" ? "Caretaker • Daily Routine" : "Caretaker • दैनिक सेवा"}
                    </span>
                    <h3 className="font-displayDeva text-xl sm:text-2xl font-bold text-ink">
                      {t("caretakerCardTitle")}
                    </h3>
                    <p className="text-ink-muted text-sm sm:text-base mt-2 leading-relaxed">
                      {t("caretakerCardDesc")}
                    </p>
                  </div>

                  <div className="mt-6 flex items-center gap-2.5 text-xs text-ink-muted">
                    <HeartHandshake className="w-4 h-4 text-forest shrink-0" />
                    <span>
                      {locale === "en"
                        ? "Vitals, BP, and symptom notes sync immediately with the doctor ledger."
                        : "लक्षण व बीपी नोट्स सीधे डॉक्टर के खाते से जुड़े हैं।"}
                    </span>
                  </div>
                </div>
              </Reveal>
            </div>

            {/* Card 4: Family Reassurance (Span 6) - Fade up with delay 0.4 */}
            <div className="md:col-span-6">
              <Reveal direction="up" delay={0.4} className="h-full">
                <div className="h-full bg-surface/90 backdrop-blur-md border border-line rounded-3xl p-6 sm:p-7 shadow-smriti flex flex-col justify-between hover:shadow-smriti-float transition-all">
                  <div>
                    <span className="inline-block px-3 py-1 bg-brick-soft text-brick text-xs font-bold rounded-full mb-3">
                      {locale === "en" ? "Family • Peace of Mind" : "Family • शांति और विश्वास"}
                    </span>
                    <h3 className="font-display text-xl sm:text-2xl font-bold text-ink">
                      {t("familyCardTitle")}
                    </h3>
                    <p className="text-ink-muted text-sm sm:text-base mt-2 leading-relaxed">
                      {t("familyCardDesc")}
                    </p>
                  </div>

                  <div className="mt-6 flex items-center gap-2.5 text-xs text-brick font-medium">
                    <ShieldAlert className="w-4 h-4 shrink-0" />
                    <span>
                      {locale === "en"
                        ? "Instant missed-dose alerts sent so you can call right away."
                        : "दवा छूटने पर तुरंत अलर्ट, ताकि आप समय पर फोन कर सकें।"}
                    </span>
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* 4. KEY FEATURES SECTION */}
        <section id="features" className="mt-20 pt-14 border-t border-line/70">
          <div className="mb-10 text-center max-w-2xl mx-auto">
            <Reveal direction="down" delay={0.1}>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-ink">
                {locale === "en"
                  ? "Designed Specifically for Everyday Life in India"
                  : locale === "hi"
                  ? "भारतीय परिवारों के दैनिक जीवन के लिए तैयार"
                  : "भारतीय कुटुंबांच्या दैनंदिन जीवनासाठी रचना"}
              </h2>
            </Reveal>
            <Reveal direction="down" delay={0.2}>
              <p className="text-sm sm:text-base text-ink-muted mt-2">
                {locale === "en"
                  ? "Zero tech friction, respectful dignity for seniors, and actionable peace of mind."
                  : "बिना किसी तकनीकी झंझट के, बुजुर्गों के सम्मान और परिवार की शांति के लिए।"}
              </p>
            </Reveal>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Feature 1: Passcode Security */}
            <Reveal direction="up" delay={0.15}>
              <div className="p-5 bg-surface/80 backdrop-blur-md border border-line rounded-2xl shadow-xs hover:shadow-smriti transition-all">
                <div className="w-10 h-10 rounded-xl bg-forest-soft text-forest flex items-center justify-center mb-3">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-ink text-base">
                  {locale === "en"
                    ? "Passcode-Based Family Linking"
                    : "पासकोड आधारित फैमिली लिंकिंग"}
                </h3>
                <p className="text-xs text-ink-muted mt-1 leading-relaxed">
                  {locale === "en"
                    ? "No complex account setups for elders. Connect caretakers and family with a single-use 6-digit passcode."
                    : "बुजुर्गों के लिए कोई जटिल पासवर्ड नहीं। केवल 6-अंकों के पासकोड से केयरटेकर और बच्चों को जोड़ें।"}
                </p>
              </div>
            </Reveal>

            {/* Feature 2: Offline-First PWA */}
            <Reveal direction="up" delay={0.25}>
              <div className="p-5 bg-surface/80 backdrop-blur-md border border-line rounded-2xl shadow-xs hover:shadow-smriti transition-all">
                <div className="w-10 h-10 rounded-xl bg-forest-soft text-forest flex items-center justify-center mb-3">
                  <Smartphone className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-ink text-base">
                  {locale === "en"
                    ? "Installable Mobile PWA"
                    : "मोबाइल होम-स्क्रीन ऐप"}
                </h3>
                <p className="text-xs text-ink-muted mt-1 leading-relaxed">
                  {locale === "en"
                    ? "Feels like a native phone app. Instant loading, haptic buttons, and offline cached schedule view."
                    : "एक असली मोबाइल ऐप की तरह काम करता है। फोन के होम-स्क्रीन पर एक टैप में इंस्टॉल करें।"}
                </p>
              </div>
            </Reveal>

            {/* Feature 3: Multilingual Voice */}
            <Reveal direction="up" delay={0.35}>
              <div className="p-5 bg-surface/80 backdrop-blur-md border border-line rounded-2xl shadow-xs hover:shadow-smriti transition-all">
                <div className="w-10 h-10 rounded-xl bg-ok-soft text-ok flex items-center justify-center mb-3">
                  <Languages className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-ink text-base">
                  {locale === "en"
                    ? "Hindi, Marathi & English"
                    : "हिंदी, मराठी और अंग्रेजी"}
                </h3>
                <p className="text-xs text-ink-muted mt-1 leading-relaxed">
                  {locale === "en"
                    ? "Switch between languages seamlessly anytime. Clear typography with Mukta and Fraunces."
                    : "अपनी पसंदीदा भाषा में चलाएं। बड़े अक्षर, स्पष्ट रंग और बुजुर्गों के अनुकूल शांत इंटरफ़ेस।"}
                </p>
              </div>
            </Reveal>
          </div>
        </section>

        {/* 5. BOTTOM CTA BANNER */}
        <section className="mt-16 sm:mt-24">
          <Reveal direction="up" delay={0.2}>
            <div className="bg-[#0D4436] text-surface rounded-3xl p-8 sm:p-12 text-center relative overflow-hidden shadow-smriti-float">
              <div className="max-w-2xl mx-auto relative z-10">
                <h2 className="font-displayDeva text-3xl sm:text-4xl font-extrabold text-surface leading-tight">
                  {locale === "en"
                    ? "Give Your Loved Ones the Care They Deserve"
                    : "आज ही अपने परिवार के बुजुर्गों के लिए शुरू करें"}
                </h2>
                <p className="mt-3 text-surface/85 text-base sm:text-lg">
                  {locale === "en"
                    ? "Join thousands of families ensuring medication adherence with dignity."
                    : "दवा की हर खुराक समय पर। कोई चिंता नहीं, कोई चूक नहीं।"}
                </p>
                <div className="mt-8 flex flex-wrap justify-center items-center gap-3 sm:gap-4">
                  <Link
                    href="/register"
                    className="min-h-[48px] px-7 bg-white text-[#0D4436] hover:bg-emerald-50 font-bold rounded-xl flex items-center gap-2 shadow-sm transition-all active:scale-95"
                  >
                    <span>{t("startNow")}</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    href="/login"
                    className="min-h-[48px] px-6 bg-emerald-950/40 hover:bg-emerald-950/60 text-white border border-white/25 font-semibold rounded-xl flex items-center gap-2 transition-all active:scale-95"
                  >
                    <span>{t("login")}</span>
                  </Link>
                </div>
              </div>
            </div>
          </Reveal>
        </section>
      </main>

      {/* 6. FOOTER */}
      <footer className="border-t border-line/60 bg-surface/50 backdrop-blur-md py-6 px-6 text-center text-xs text-ink-muted mt-12">
        <p>© 2026 CareSaathi (केयर साथी). Built for Indian families with care and dignity.</p>
      </footer>
    </div>
  );
}
