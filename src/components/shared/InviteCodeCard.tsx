"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { Copy, Check, Share2, Clock } from "lucide-react";

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
    <div className="bg-surface border-2 border-forest/30 rounded-2xl p-5 shadow-smriti text-center relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-forest" />

      {role && (
        <span className="inline-block px-3 py-1 bg-forest-soft text-forest text-xs font-bold uppercase rounded-full mb-3">
          {tRoles(role as any)} Passcode
        </span>
      )}

      <div className="my-2 py-3 px-4 bg-paper-2 border border-line rounded-xl inline-block">
        <span className="font-mono text-3xl font-extrabold tracking-widest text-forest select-all">
          {code}
        </span>
      </div>

      {expiresAt && (
        <p className="text-xs text-ink-muted flex items-center justify-center gap-1.5 mt-2">
          <Clock className="w-3.5 h-3.5 text-saffron" />
          <span>Valid for 48 hours</span>
        </p>
      )}

      <div className="mt-5 grid grid-cols-2 gap-3">
        <button
          onClick={handleCopy}
          className="flex items-center justify-center gap-2 py-2.5 px-4 bg-surface border border-line hover:bg-paper rounded-xl text-sm font-semibold text-ink active:scale-95 transition-all"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-ok" />
              <span>{t("copied")}</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 text-forest" />
              <span>{t("copy")}</span>
            </>
          )}
        </button>

        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 py-2.5 px-4 bg-[#25D366] text-white rounded-xl text-sm font-semibold hover:opacity-95 active:scale-95 transition-all shadow-xs"
        >
          <Share2 className="w-4 h-4" />
          <span>{t("shareWhatsApp")}</span>
        </a>
      </div>
    </div>
  );
}
