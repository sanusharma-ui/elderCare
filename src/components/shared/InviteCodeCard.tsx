"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { Copy, Check, Share2, Clock } from "lucide-react";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { PrimaryButton } from "@/components/ui/PrimaryButton";

export function InviteCodeCard({
  code,
  expiresAt,
  role,
}: {
  code: string;
  expiresAt?: string;
  role?: string;
}) {
  const t = useTranslations("common");
  const tRoles = useTranslations("roles");
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const shareText = encodeURIComponent(
    t("shareWhatsAppText", { code })
  );
  const waUrl = `https://wa.me/?text=${shareText}`;

  return (
    <GlassPanel variant="default" className="rounded-3xl p-6 text-center relative overflow-hidden space-y-4">
      {role && (
        <span className="inline-block px-3.5 py-1 bg-accent-blue/15 text-accent-blue text-xs font-bold uppercase rounded-full border border-accent-blue/20">
          {tRoles(role as any)} Passcode
        </span>
      )}

      <div className="py-3 px-6 bg-white/70 dark:bg-white/[0.05] border border-white/60 dark:border-white/10 rounded-2xl inline-block shadow-inner">
        <span className="font-mono text-3xl sm:text-4xl font-black tracking-widest text-ink select-all">
          {code}
        </span>
      </div>

      {expiresAt && (
        <p className="text-xs font-semibold text-ink-muted flex items-center justify-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-amber-500" />
          <span>Valid for 48 hours</span>
        </p>
      )}

      <div className="grid grid-cols-2 gap-3 pt-2">
        <button
          onClick={handleCopy}
          className="flex items-center justify-center gap-2 py-3 px-4 bg-white/60 dark:bg-white/[0.06] hover:bg-white/80 dark:hover:bg-white/10 border border-white/60 dark:border-white/10 rounded-full text-xs sm:text-sm font-bold text-ink active:scale-95 transition-all shadow-xs"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-emerald-500" />
              <span>{t("copied")}</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 text-accent-blue" />
              <span>{t("copy")}</span>
            </>
          )}
        </button>

        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 py-3 px-4 bg-[#25D366] text-white rounded-full text-xs sm:text-sm font-bold hover:opacity-95 active:scale-95 transition-all shadow-sm"
        >
          <Share2 className="w-4 h-4" />
          <span>{t("shareWhatsApp")}</span>
        </a>
      </div>
    </GlassPanel>
  );
}
