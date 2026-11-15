"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { apiClient, ApiError } from "@/lib/api-client";
import { KeyRound, ArrowRight, ShieldCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { PrimaryButton } from "@/components/ui/PrimaryButton";

export default function FamilyLinkElderPage() {
  const t = useTranslations("family");
  const router = useRouter();
  const queryClient = useQueryClient();

  const [code, setCode] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Format input: Auto uppercase, auto hyphen after 4 chars
  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (raw.length > 8) raw = raw.slice(0, 8);
    if (raw.length > 4) {
      setCode(`${raw.slice(0, 4)}-${raw.slice(4)}`);
    } else {
      setCode(raw);
    }
    setErrorMessage("");
  };

  const redeemMutation = useMutation({
    mutationFn: (passcode: string) =>
      apiClient("/api/invites/redeem", {
        method: "POST",
        body: JSON.stringify({ code: passcode }),
      }),
    onSuccess: (result: any) => {
      queryClient.invalidateQueries({ queryKey: ["family-elders"] });
      queryClient.invalidateQueries({ queryKey: ["family-alerts"] });
      toast.success(t("linkedSuccess"));
      router.push("/family/home");
    },
    onError: (err: any) => {
      if (err instanceof ApiError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("Invalid passcode or redemption failed.");
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || code.length < 9) {
      setErrorMessage("Please enter a valid 9-character passcode (e.g. K7QD-9M2X)");
      return;
    }
    redeemMutation.mutate(code);
  };

  return (
    <div className="p-4 sm:p-6 max-w-md mx-auto w-full my-auto space-y-6">
      <GlassPanel variant="default" className="p-6 sm:p-8 text-center rounded-[32px]">
        <div className="w-14 h-14 bg-accent-blue/15 text-accent-blue rounded-2xl flex items-center justify-center mx-auto mb-4 border border-accent-blue/20">
          <KeyRound className="w-7 h-7" />
        </div>

        <span className="text-[11px] font-bold uppercase tracking-wider text-accent-blue">
          Care Circle Connect
        </span>
        <h1 className="text-2xl font-black text-ink mt-1 mb-2">
          {t("linkElder")}
        </h1>
        <p className="text-xs sm:text-sm text-ink-muted mb-6 leading-relaxed">
          {t("linkDescription")}
        </p>

        {errorMessage && (
          <div className="mb-5 p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-500 text-xs font-bold text-left">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="text-left">
            <label className="block text-xs font-bold text-ink-muted uppercase tracking-wider mb-2">
              {t("enterPasscode")}
            </label>
            <input
              type="text"
              required
              maxLength={9}
              value={code}
              onChange={handleCodeChange}
              placeholder={t("passcodePlaceholder")}
              className="w-full min-h-[58px] text-center font-mono text-2xl sm:text-3xl font-extrabold tracking-widest uppercase bg-white/70 dark:bg-white/[0.05] border border-white/60 dark:border-white/10 focus:border-accent-blue rounded-2xl text-ink placeholder:text-ink-muted/30 focus:outline-none transition-all select-all shadow-inner"
            />
          </div>

          <PrimaryButton
            type="submit"
            size="lg"
            fullWidth
            disabled={redeemMutation.isPending || code.length < 9}
            loading={redeemMutation.isPending}
            icon={<ArrowRight className="w-5 h-5" />}
          >
            {t("linkBtn")}
          </PrimaryButton>
        </form>

        <div className="mt-6 pt-5 border-t border-white/40 dark:border-white/10 text-xs font-semibold text-ink-muted flex items-center justify-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>{t("secureAccess")}</span>
        </div>
      </GlassPanel>
    </div>
  );
}
