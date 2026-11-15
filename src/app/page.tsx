"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { BrandLogo } from "@/components/shared/BrandLogo";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { useAuth } from "@/hooks/use-auth";
import { getRoleHome } from "@/lib/routes";
import {
  Calendar,
  Stethoscope,
  HeartHandshake,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  Volume2,
  CheckCircle2,
} from "lucide-react";

export default function HomePage() {
  const t = useTranslations("landing");
  const tCommon = useTranslations("common");
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

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
    <div className="min-h-screen bg-paper flex flex-col selection:bg-forest-soft">
      {/* Top Navigation */}
      <header className="max-w-6xl w-full mx-auto px-6 py-4 flex items-center justify-between">
        <BrandLogo size="md" href="/" />

        <div className="flex items-center gap-3">
          <LanguageSwitcher compact />
          <Link
            href="/login"
            className="px-4 py-2 text-sm font-semibold text-forest hover:bg-forest-soft rounded-xl transition-all"
          >
            {tCommon("logout") ? "Sign In" : "लॉग इन"}
          </Link>
          <Link
            href="/register"
            className="px-4 py-2 text-sm font-semibold bg-forest text-surface hover:bg-forest-hover rounded-xl shadow-xs transition-all active:scale-95"
          >
            {t("startNow")}
          </Link>
        </div>
      </header>

      {/* Main Hero Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-8 sm:py-14 flex flex-col justify-center">
        {/* Hero Section */}
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-saffron-soft/80 border border-saffron/30 rounded-full text-xs font-bold text-ink mb-6">
            <Sparkles className="w-4 h-4 text-saffron" />
            <span>भारतीय परिवारों और बुजुर्गों के लिए विशेष स्वास्थ्य साथी</span>
          </div>

          <h1 className="font-displayDeva text-4xl sm:text-5xl lg:text-6xl font-extrabold text-ink leading-[1.18] tracking-tight">
            {t("heroTitle")}
          </h1>

          <p className="mt-5 text-lg sm:text-xl text-ink-muted leading-relaxed max-w-2xl font-normal">
            {t("heroSubtitle")}
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link
              href="/register"
              className="min-h-[54px] px-8 bg-forest hover:bg-forest-hover active:scale-95 text-surface font-bold text-lg rounded-2xl flex items-center gap-3 shadow-smriti transition-all"
            >
              <span>{t("startNow")}</span>
              <ArrowRight className="w-5 h-5" />
            </Link>

            <Link
              href="/login"
              className="min-h-[54px] px-7 bg-surface hover:bg-paper-2 border border-line text-ink font-semibold text-base rounded-2xl flex items-center gap-2 shadow-xs transition-all active:scale-95"
            >
              <span>{t("login")}</span>
            </Link>
          </div>

          {/* Calming Indian Elder Highlight Note */}
          <div className="mt-8 p-4 bg-surface border border-line rounded-2xl flex items-start gap-3.5 shadow-xs max-w-2xl">
            <div className="w-9 h-9 rounded-xl bg-forest-soft text-forest flex items-center justify-center shrink-0 mt-0.5">
              <Volume2 className="w-5 h-5" />
            </div>
            <p className="text-sm text-ink-muted leading-normal">
              {t("builtForElders")}
            </p>
          </div>
        </div>

        {/* Asymmetric Role Showcase (Not 4 identical cards) */}
        <section className="mt-16 pt-12 border-t border-line">
          <div className="mb-8">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-ink">
              {t("howItWorks")}
            </h2>
            <p className="text-sm text-ink-muted mt-1">
              चार अलग-अलग भूमिकाएं, एक साझा स्वास्थ्य लक्ष्य।
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
            {/* 1. Elder Diary (Prominent, Span 7) */}
            <div className="md:col-span-7 bg-surface border-2 border-forest/20 rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-sm flex flex-col justify-between">
              <div className="absolute top-0 right-0 w-32 h-32 bg-forest-soft/40 rounded-bl-full pointer-events-none" />

              <div>
                <span className="inline-block px-3 py-1 bg-forest-soft text-forest text-xs font-bold rounded-full mb-3">
                  Elder Role • मुख्य केंद्र
                </span>
                <h3 className="font-displayDeva text-2xl font-bold text-ink">
                  {t("elderCardTitle")}
                </h3>
                <p className="text-ink-muted text-base mt-2 leading-relaxed">
                  {t("elderCardDesc")}
                </p>
              </div>

              {/* Mini visual mockup inside card */}
              <div className="mt-6 p-4 bg-paper rounded-2xl border border-line">
                <div className="flex items-center justify-between text-xs text-ink-muted mb-2 font-medium">
                  <span>सुबह की खुराक</span>
                  <span className="text-forest font-bold">08:00 AM</span>
                </div>
                <div className="flex items-center justify-between bg-surface p-3 rounded-xl border border-line">
                  <div>
                    <span className="font-bold text-ink text-base block">Metformin 500mg</span>
                    <span className="text-xs text-forest font-medium">खाने के बाद</span>
                  </div>
                  <span className="px-3 py-1.5 bg-forest text-surface text-xs font-bold rounded-lg flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>ले ली</span>
                  </span>
                </div>
              </div>
            </div>

            {/* 2. Doctor Console (Span 5) */}
            <div className="md:col-span-5 bg-surface border border-line rounded-3xl p-6 relative overflow-hidden shadow-xs flex flex-col justify-between">
              <div>
                <span className="inline-block px-3 py-1 bg-saffron-soft text-ink text-xs font-bold rounded-full mb-3">
                  Doctor • क्लिनिकल लेजर
                </span>
                <h3 className="font-display text-xl font-bold text-ink">
                  {t("doctorCardTitle")}
                </h3>
                <p className="text-ink-muted text-sm mt-2 leading-relaxed">
                  {t("doctorCardDesc")}
                </p>
              </div>

              <div className="mt-6 flex items-center gap-3 p-3 bg-paper-2 rounded-xl text-xs text-ink">
                <Stethoscope className="w-5 h-5 text-forest shrink-0" />
                <span>AI Clinical Digest &amp; Vision Prescription Scanning</span>
              </div>
            </div>

            {/* 3. Caretaker Care (Span 6) */}
            <div className="md:col-span-6 bg-surface border border-line rounded-3xl p-6 shadow-xs flex flex-col justify-between">
              <div>
                <span className="inline-block px-3 py-1 bg-paper-2 text-ink text-xs font-bold rounded-full mb-3">
                  Caretaker • दैनिक सेवा
                </span>
                <h3 className="font-displayDeva text-xl font-bold text-ink">
                  {t("caretakerCardTitle")}
                </h3>
                <p className="text-ink-muted text-sm mt-2 leading-relaxed">
                  {t("caretakerCardDesc")}
                </p>
              </div>

              <div className="mt-4 flex items-center gap-2 text-xs text-ink-muted">
                <HeartHandshake className="w-4 h-4 text-forest" />
                <span>लक्षण व बीपी नोट्स सीधे डॉक्टर के खाते से जुड़े हैं।</span>
              </div>
            </div>

            {/* 4. Family Reassurance (Span 6) */}
            <div className="md:col-span-6 bg-surface border border-line rounded-3xl p-6 shadow-xs flex flex-col justify-between">
              <div>
                <span className="inline-block px-3 py-1 bg-brick-soft text-brick text-xs font-bold rounded-full mb-3">
                  Family • शांति और विश्वास
                </span>
                <h3 className="font-display text-xl font-bold text-ink">
                  {t("familyCardTitle")}
                </h3>
                <p className="text-ink-muted text-sm mt-2 leading-relaxed">
                  {t("familyCardDesc")}
                </p>
              </div>

              <div className="mt-4 flex items-center gap-2 text-xs text-brick font-medium">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>दवा छूटने पर तुरंत अलर्ट, ताकि आप समय पर फोन कर सकें।</span>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-line bg-surface/50 py-6 px-6 text-center text-xs text-ink-muted">
        <p>© 2026 स्मृति • Smriti Platform. Built for Indian families with care and dignity.</p>
      </footer>
    </div>
  );
}
