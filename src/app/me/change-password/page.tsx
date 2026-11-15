"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { apiClient, ApiError } from "@/lib/api-client";
import { useAuth } from "@/hooks/use-auth";
import { getRoleHome } from "@/lib/routes";
import { Lock, ArrowRight, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { PrimaryButton } from "@/components/ui/PrimaryButton";

export default function ChangePasswordPage() {
  const t = useTranslations("auth");
  const { user, refetch } = useAuth();
  const router = useRouter();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) return;

    if (newPassword.length < 8) {
      setErrorMessage("New password must be at least 8 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage("New passwords do not match");
      return;
    }

    setLoading(true);
    setErrorMessage("");

    try {
      await apiClient("/api/me/change-password", {
        method: "POST",
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      toast.success("Password updated successfully!");
      await refetch();
      if (user) {
        router.push(getRoleHome(user.role));
      } else {
        router.push("/");
      }
    } catch (err: any) {
      if (err instanceof ApiError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("Failed to update password. Verify current password.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-transparent flex flex-col justify-center items-center p-4 relative">
      <div className="w-full max-w-md">
        <GlassPanel variant="default" className="p-6 sm:p-8 rounded-[32px] text-center">
          <div className="flex justify-center mb-4">
            <div className="w-14 h-14 bg-accent-blue/15 text-accent-blue rounded-2xl flex items-center justify-center border border-accent-blue/20">
              <ShieldCheck className="w-7 h-7" />
            </div>
          </div>

          <span className="text-[11px] font-bold uppercase tracking-wider text-accent-blue">
            Security & Access
          </span>
          <h1 className="text-2xl font-black text-ink mt-1 mb-2">
            {t("changePasswordTitle")}
          </h1>
          <p className="text-xs sm:text-sm text-ink-muted mb-6 leading-relaxed">
            {t("changePasswordSubtitle")}
          </p>

          {errorMessage && (
            <div className="mb-5 p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-500 text-xs font-bold text-left">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-left">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-1.5">
                {t("currentPassword")}
              </label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className="w-full min-h-[50px] px-4 bg-white/70 dark:bg-white/[0.05] border border-white/60 dark:border-white/10 focus:border-accent-blue rounded-2xl text-sm font-semibold text-ink placeholder:text-ink-muted/40 focus:outline-none transition-all shadow-inner"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-1.5">
                {t("newPassword")} (min 8 characters)
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new strong password"
                className="w-full min-h-[50px] px-4 bg-white/70 dark:bg-white/[0.05] border border-white/60 dark:border-white/10 focus:border-accent-blue rounded-2xl text-sm font-semibold text-ink placeholder:text-ink-muted/40 focus:outline-none transition-all shadow-inner"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-1.5">
                {t("confirmPassword")}
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="w-full min-h-[50px] px-4 bg-white/70 dark:bg-white/[0.05] border border-white/60 dark:border-white/10 focus:border-accent-blue rounded-2xl text-sm font-semibold text-ink placeholder:text-ink-muted/40 focus:outline-none transition-all shadow-inner"
              />
            </div>

            <div className="pt-2">
              <PrimaryButton
                type="submit"
                size="lg"
                fullWidth
                disabled={loading}
                loading={loading}
                icon={<ArrowRight className="w-5 h-5" />}
              >
                {t("updatePasswordBtn")}
              </PrimaryButton>
            </div>
          </form>
        </GlassPanel>
      </div>
    </div>
  );
}
