"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { BrandLogo } from "@/components/shared/BrandLogo";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
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

      toast.success("सफलतापूर्वक लॉग इन हुआ! • Welcome back!");

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
        setErrorMessage("लॉग इन विफल हुआ। कृपया क्रेडेंशियल जांचें।");
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
    <div className="w-full max-w-md bg-surface border border-line rounded-3xl p-6 sm:p-8 shadow-smriti">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-ink">
          {t("login")}
        </h1>
        <p className="text-sm text-ink-muted mt-1">
          {t("loginSubtitle")}
        </p>
      </div>

      {errorMessage && (
        <div className="mb-5 p-3.5 bg-brick-soft border border-brick/30 rounded-xl text-brick text-sm font-medium">
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-ink mb-1.5">
            {t("identifierLabel")}
          </label>
          <div className="relative">
            <input
              type="text"
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder={t("identifierPlaceholder")}
              className="w-full min-h-[50px] pl-11 pr-4 bg-paper border border-line rounded-xl text-base text-ink placeholder:text-ink-muted/60 focus:bg-surface focus:border-forest transition-colors"
            />
            <User className="w-5 h-5 text-forest absolute left-3.5 top-3.5 pointer-events-none" />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-sm font-semibold text-ink">
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
              className="w-full min-h-[50px] pl-11 pr-4 bg-paper border border-line rounded-xl text-base text-ink placeholder:text-ink-muted/60 focus:bg-surface focus:border-forest transition-colors"
            />
            <Lock className="w-5 h-5 text-forest absolute left-3.5 top-3.5 pointer-events-none" />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full min-h-[54px] mt-2 bg-forest hover:bg-forest-hover active:scale-[0.98] text-surface font-bold text-base rounded-xl flex items-center justify-center gap-2 shadow-xs transition-all disabled:opacity-75"
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
        </button>
      </form>

      {/* Quick Demo One-Tap Bar */}
      {process.env.NEXT_PUBLIC_DEMO_MODE !== "false" && (
        <div className="mt-6 pt-5 border-t border-line">
          <div className="flex items-center justify-between text-xs font-semibold text-forest mb-2.5">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-saffron" />
              <span>{t("demoTitle")}</span>
            </span>
            <span className="text-[10px] text-ink-muted">1-Tap Instant Login</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              disabled={loading}
              onClick={() =>
                handleDemoLogin(
                  process.env.NEXT_PUBLIC_DEMO_DOCTOR_ID || "dr.anjali@smriti.app",
                  process.env.NEXT_PUBLIC_DEMO_DOCTOR_PASS || "Password@123",
                  "DOCTOR"
                )
              }
              className={`p-2.5 border rounded-xl font-medium text-left transition-all active:scale-95 disabled:opacity-70 ${
                activeDemo === "DOCTOR"
                  ? "bg-forest-soft border-forest text-forest shadow-sm"
                  : "bg-paper-2 hover:bg-forest-soft hover:text-forest text-ink border-line"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-forest">डॉक्टर • Doctor</span>
                {activeDemo === "DOCTOR" && <Loader2 className="w-3.5 h-3.5 animate-spin text-forest" />}
              </div>
              <div className="text-[10px] text-ink-muted truncate">dr.anjali@smriti.app</div>
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
              className={`p-2.5 border rounded-xl font-medium text-left transition-all active:scale-95 disabled:opacity-70 ${
                activeDemo === "ELDER"
                  ? "bg-forest-soft border-forest text-forest shadow-sm"
                  : "bg-paper-2 hover:bg-forest-soft hover:text-forest text-ink border-line"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-forest">बुजुर्ग • Elder (Ramesh)</span>
                {activeDemo === "ELDER" && <Loader2 className="w-3.5 h-3.5 animate-spin text-forest" />}
              </div>
              <div className="text-[10px] text-ink-muted">+919811122332</div>
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
              className={`p-2.5 border rounded-xl font-medium text-left transition-all active:scale-95 disabled:opacity-70 ${
                activeDemo === "CARETAKER"
                  ? "bg-forest-soft border-forest text-forest shadow-sm"
                  : "bg-paper-2 hover:bg-forest-soft hover:text-forest text-ink border-line"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-forest">केयरटेकर • Caretaker</span>
                {activeDemo === "CARETAKER" && <Loader2 className="w-3.5 h-3.5 animate-spin text-forest" />}
              </div>
              <div className="text-[10px] text-ink-muted">pooja.sawant@care.in</div>
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
              className={`p-2.5 border rounded-xl font-medium text-left transition-all active:scale-95 disabled:opacity-70 ${
                activeDemo === "FAMILY"
                  ? "bg-forest-soft border-forest text-forest shadow-sm"
                  : "bg-paper-2 hover:bg-forest-soft hover:text-forest text-ink border-line"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-forest">परिवार • Family (Amit)</span>
                {activeDemo === "FAMILY" && <Loader2 className="w-3.5 h-3.5 animate-spin text-forest" />}
              </div>
              <div className="text-[10px] text-ink-muted">amit.sharma@family.com</div>
            </button>
          </div>
        </div>
      )}

      <div className="mt-6 text-center text-sm text-ink-muted">
        <span>{t("dontHaveAccount")} </span>
        <Link href="/register" className="font-bold text-forest hover:underline">
          {t("register")}
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-paper flex flex-col justify-center items-center p-4 sm:p-6 selection:bg-forest-soft">
      {/* Header Bar */}
      <div className="w-full max-w-md flex items-center justify-between mb-6">
        <BrandLogo size="md" href="/" />
        <LanguageSwitcher compact />
      </div>

      <Suspense fallback={<div className="w-full max-w-md h-96 bg-surface rounded-3xl animate-pulse" />}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
