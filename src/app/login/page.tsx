"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { BrandLogo } from "@/components/shared/BrandLogo";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { apiClient, ApiError } from "@/lib/api-client";
import { getRoleHome } from "@/lib/routes";
import { ArrowRight, Lock, User, Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const dynamic = "force-dynamic";

function LoginForm() {
  const t = useTranslations("auth");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect");

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeDemo, setActiveDemo] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const executeLogin = async (idToUse: string, passToUse: string) => {
    if (!idToUse || !passToUse) return;

    setLoading(true);
    setErrorMessage("");

    try {
      const result = await apiClient<{
        user: { role: "ELDER" | "CARETAKER" | "FAMILY" | "DOCTOR"; mustChangePassword: boolean };
      }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ identifier: idToUse.trim(), password: passToUse }),
      });

      toast.success(t("loginSuccess"));

      if (result.user.mustChangePassword) {
        router.push("/me/change-password");
      } else if (redirectUrl) {
        router.push(redirectUrl);
      } else {
        router.push(getRoleHome(result.user.role));
      }
    } catch (err: any) {
      if (err instanceof ApiError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage(t("loginFailed"));
      }
    } finally {
      setLoading(false);
      setActiveDemo(null);
    }
  };

  const handleLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    executeLogin(identifier, password);
  };

  const handleDemoLogin = (demoId: string, demoPass: string, roleKey: string) => {
    setActiveDemo(roleKey);
    setIdentifier(demoId);
    setPassword(demoPass);
    executeLogin(demoId, demoPass);
  };

  return (
    <GlassPanel variant="default" className="w-full max-w-md rounded-[32px] p-7 sm:p-9 shadow-2xl">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          {t("login")}
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          {t("loginSubtitle")}
        </p>
      </div>

      {errorMessage && (
        <div className="mb-5 p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/40 rounded-2xl text-rose-600 dark:text-rose-400 text-sm font-bold">
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
            {t("identifierLabel")}
          </label>
          <div className="relative">
            <input
              type="text"
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder={t("identifierPlaceholder")}
              className="w-full min-h-[50px] pl-12 pr-4 bg-white/60 dark:bg-white/5 border border-slate-200/70 dark:border-white/10 rounded-2xl text-base text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            />
            <User className="w-5 h-5 text-blue-600 dark:text-blue-400 absolute left-4 top-3.5 pointer-events-none" />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
              {t("passwordLabel")}
            </label>
          </div>
          <div className="relative">
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t("passwordPlaceholder")}
              className="w-full min-h-[50px] pl-12 pr-4 bg-white/60 dark:bg-white/5 border border-slate-200/70 dark:border-white/10 rounded-2xl text-base text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            />
            <Lock className="w-5 h-5 text-blue-600 dark:text-blue-400 absolute left-4 top-3.5 pointer-events-none" />
          </div>
        </div>

        <PrimaryButton
          type="submit"
          variant="primary"
          size="lg"
          disabled={loading}
          className="w-full mt-3 gap-2"
        >
          {loading && !activeDemo ? (
            <div className="flex items-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>{tCommon("loading")}...</span>
            </div>
          ) : (
            <>
              <span>{t("login")}</span>
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </PrimaryButton>
      </form>

      {/* Quick Demo One-Tap Bar */}
      {process.env.NEXT_PUBLIC_DEMO_MODE !== "false" && (
        <div className="mt-7 pt-5 border-t border-slate-200/50 dark:border-white/10">
          <div className="flex items-center justify-between text-xs font-bold text-blue-600 dark:text-blue-400 mb-3">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400 animate-pulse" />
              <span>{t("demoTitle")}</span>
            </span>
            <span className="text-[11px] text-slate-400 dark:text-slate-500">{t("instantLogin")}</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              disabled={loading}
              onClick={() =>
                handleDemoLogin(
                  process.env.NEXT_PUBLIC_DEMO_DOCTOR_ID || "dr.anjali@caresaathi.app",
                  process.env.NEXT_PUBLIC_DEMO_DOCTOR_PASS || "Password@123",
                  "DOCTOR"
                )
              }
              className={`p-3 border rounded-2xl font-bold text-left transition-all active:scale-95 disabled:opacity-70 ${
                activeDemo === "DOCTOR"
                  ? "bg-blue-50 dark:bg-blue-950/60 border-blue-500 text-blue-600 dark:text-blue-400 shadow-sm"
                  : "bg-white/50 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 text-slate-800 dark:text-slate-200 border-slate-200/60 dark:border-white/10"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-blue-600 dark:text-blue-400">{t("doctorDemo")}</span>
                {activeDemo === "DOCTOR" && <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />}
              </div>
              <div className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5">dr.anjali@caresaathi.app</div>
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={() =>
                handleDemoLogin(
                  process.env.NEXT_PUBLIC_DEMO_ELDER_ID || "+919811122332",
                  process.env.NEXT_PUBLIC_DEMO_ELDER_PASS || "Password@123",
                  "ELDER"
                )
              }
              className={`p-3 border rounded-2xl font-bold text-left transition-all active:scale-95 disabled:opacity-70 ${
                activeDemo === "ELDER"
                  ? "bg-blue-50 dark:bg-blue-950/60 border-blue-500 text-blue-600 dark:text-blue-400 shadow-sm"
                  : "bg-white/50 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 text-slate-800 dark:text-slate-200 border-slate-200/60 dark:border-white/10"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-blue-600 dark:text-blue-400">{t("elderDemo")}</span>
                {activeDemo === "ELDER" && <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />}
              </div>
              <div className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5">+919811122332</div>
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={() =>
                handleDemoLogin(
                  process.env.NEXT_PUBLIC_DEMO_CARETAKER_ID || "pooja.sawant@care.in",
                  process.env.NEXT_PUBLIC_DEMO_CARETAKER_PASS || "Password@123",
                  "CARETAKER"
                )
              }
              className={`p-3 border rounded-2xl font-bold text-left transition-all active:scale-95 disabled:opacity-70 ${
                activeDemo === "CARETAKER"
                  ? "bg-blue-50 dark:bg-blue-950/60 border-blue-500 text-blue-600 dark:text-blue-400 shadow-sm"
                  : "bg-white/50 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 text-slate-800 dark:text-slate-200 border-slate-200/60 dark:border-white/10"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-blue-600 dark:text-blue-400">{t("caretakerDemo")}</span>
                {activeDemo === "CARETAKER" && <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />}
              </div>
              <div className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5">pooja.sawant@care.in</div>
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={() =>
                handleDemoLogin(
                  process.env.NEXT_PUBLIC_DEMO_FAMILY_ID || "amit.sharma@family.com",
                  process.env.NEXT_PUBLIC_DEMO_FAMILY_PASS || "Password@123",
                  "FAMILY"
                )
              }
              className={`p-3 border rounded-2xl font-bold text-left transition-all active:scale-95 disabled:opacity-70 ${
                activeDemo === "FAMILY"
                  ? "bg-blue-50 dark:bg-blue-950/60 border-blue-500 text-blue-600 dark:text-blue-400 shadow-sm"
                  : "bg-white/50 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 text-slate-800 dark:text-slate-200 border-slate-200/60 dark:border-white/10"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-blue-600 dark:text-blue-400">{t("familyDemo")}</span>
                {activeDemo === "FAMILY" && <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />}
              </div>
              <div className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5">amit.sharma@family.com</div>
            </button>
          </div>
        </div>
      )}

      <div className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">
        <span>{t("dontHaveAccount")} </span>
        <Link href="/register" className="font-bold text-blue-600 dark:text-blue-400 hover:underline">
          {t("register")}
        </Link>
      </div>
    </GlassPanel>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-transparent flex flex-col justify-center items-center p-4 sm:p-6">
      {/* Header Bar */}
      <div className="w-full max-w-md flex items-center justify-between mb-6">
        <BrandLogo size="md" href="/" />
        <div className="flex items-center gap-2">
          <LanguageSwitcher compact />
        </div>
      </div>

      <Suspense fallback={<div className="w-full max-w-md h-96 bg-white/40 dark:bg-white/5 rounded-3xl animate-pulse" />}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
