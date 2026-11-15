"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { BrandLogo } from "@/components/shared/BrandLogo";
import { apiClient, ApiError } from "@/lib/api-client";
import { useAuth } from "@/hooks/use-auth";
import { getRoleHome } from "@/lib/routes";
import { Lock, ArrowRight, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

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
    <div className="min-h-screen bg-transparent flex flex-col justify-center items-center p-4 selection:bg-forest-soft">
      <div className="w-full max-w-md bg-surface border border-line rounded-3xl p-6 sm:p-8 shadow-smriti">
        <div className="flex justify-center mb-4">
          <div className="w-12 h-12 bg-forest-soft rounded-2xl flex items-center justify-center text-forest">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>

        <h1 className="font-display text-2xl font-bold text-center text-ink mb-1">
          {t("changePasswordTitle")}
        </h1>
        <p className="text-xs text-center text-ink-muted mb-6">
          {t("changePasswordSubtitle")}
        </p>

        {errorMessage && (
          <div className="mb-5 p-3.5 bg-brick-soft border border-brick/30 rounded-xl text-brick text-sm font-medium">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-ink mb-1">
              {t("currentPassword")}
            </label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
              className="w-full min-h-[48px] px-4 bg-paper border border-line rounded-xl text-base text-ink"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-ink mb-1">
              {t("newPassword")} (min 8 characters)
            </label>
            <input
              type="password"
              required
              minLength={8}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new strong password"
              className="w-full min-h-[48px] px-4 bg-paper border border-line rounded-xl text-base text-ink"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-ink mb-1">
              {t("confirmPassword")}
            </label>
            <input
              type="password"
              required
              minLength={8}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter new password"
              className="w-full min-h-[48px] px-4 bg-paper border border-line rounded-xl text-base text-ink"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full min-h-[52px] mt-4 bg-forest hover:bg-forest-hover active:scale-95 text-surface font-bold text-base rounded-xl flex items-center justify-center gap-2 shadow-xs transition-all disabled:opacity-60"
          >
            {loading ? "Updating..." : t("updatePasswordBtn")}
          </button>
        </form>
      </div>
    </div>
  );
}
