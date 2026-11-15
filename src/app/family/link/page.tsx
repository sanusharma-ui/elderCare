"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { apiClient, ApiError } from "@/lib/api-client";
import { KeyRound, ArrowRight, ShieldCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";

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
      toast.success("बुजुर्ग के साथ सफलतापूर्वक जुड़ गए!");
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
    <div className="p-4 sm:p-6 space-y-6 flex flex-col justify-center">
      <div className="bg-surface border border-line rounded-3xl p-6 sm:p-8 shadow-smriti text-center">
        <div className="w-14 h-14 bg-forest-soft rounded-2xl flex items-center justify-center text-forest mx-auto mb-4">
          <KeyRound className="w-7 h-7" />
        </div>

        <h1 className="font-displayDeva text-2xl font-bold text-ink mb-1">
          {t("linkElder")}
        </h1>
        <p className="text-xs text-ink-muted mb-6 leading-relaxed">
          बुजुर्ग या उनके केयरटेकर द्वारा दिया गया 9-अक्षरों का पासकोड दर्ज करें।
        </p>

        {errorMessage && (
          <div className="mb-5 p-3.5 bg-brick-soft border border-brick/30 rounded-xl text-brick text-xs font-semibold text-left">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-2 text-left">
              {t("enterPasscode")}
            </label>
            <input
              type="text"
              required
              maxLength={9}
              value={code}
              onChange={handleCodeChange}
              placeholder={t("passcodePlaceholder")}
              className="w-full min-h-[58px] text-center font-mono text-2xl sm:text-3xl font-extrabold tracking-widest uppercase bg-paper border-2 border-line focus:border-forest rounded-2xl text-forest placeholder:text-ink-muted/30 transition-all select-all"
            />
          </div>

          <button
            type="submit"
            disabled={redeemMutation.isPending || code.length < 9}
            className="w-full min-h-[52px] bg-forest hover:bg-forest-hover active:scale-95 text-surface font-bold text-base rounded-xl flex items-center justify-center gap-2 shadow-xs transition-all disabled:opacity-50"
          >
            {redeemMutation.isPending ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>सत्यापित हो रहा है... • Verifying</span>
              </>
            ) : (
              <>
                <span>{t("linkBtn")}</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-line text-xs text-ink-muted flex items-center justify-center gap-2">
          <ShieldCheck className="w-4 h-4 text-ok" />
          <span>सिंगल-यूज़ पासकोड सुरक्षित एक्सेस सुनिश्चित करता है।</span>
        </div>
      </div>
    </div>
  );
}
