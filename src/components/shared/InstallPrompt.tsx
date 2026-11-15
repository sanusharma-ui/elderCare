"use client";

import React, { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Download, X, Share } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallPrompt() {
  const t = useTranslations("pwa");
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIos, setIsIos] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    // Check if already in standalone mode
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(standalone);

    // Check if user previously dismissed
    const wasDismissed = localStorage.getItem("smriti_pwa_dismissed") === "true";
    if (!standalone && !wasDismissed) {
      setDismissed(false);
    }

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIos(isIosDevice);

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      if (!wasDismissed) setDismissed(false);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setDeferredPrompt(null);
      setDismissed(true);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem("smriti_pwa_dismissed", "true");
  };

  if (isStandalone || dismissed) return null;

  return (
    <div className="mx-4 my-3 p-4 bg-surface border border-line rounded-2xl shadow-smriti relative overflow-hidden transition-all">
      <button
        onClick={handleDismiss}
        className="absolute top-3 right-3 text-ink-muted hover:text-ink p-1 rounded-full active:bg-paper-2"
        aria-label="Dismiss install prompt"
      >
        <X className="w-5 h-5" />
      </button>

      <div className="flex items-start gap-3.5 pr-6">
        <div className="w-10 h-10 rounded-xl bg-forest-soft text-forest flex items-center justify-center shrink-0">
          <Download className="w-5 h-5" />
        </div>
        <div>
          <h4 className="font-semibold text-ink text-base leading-tight">
            {t("installTitle")}
          </h4>
          <p className="text-ink-muted text-sm mt-1 leading-snug">
            {isIos ? t("iosInstructions") : t("installDesc")}
          </p>

          <div className="mt-3 flex items-center gap-3">
            {!isIos && deferredPrompt && (
              <button
                onClick={handleInstallClick}
                className="px-4 py-2 bg-forest text-surface text-sm font-semibold rounded-xl hover:bg-forest-hover active:scale-95 transition-all shadow-sm"
              >
                {t("installBtn")}
              </button>
            )}
            {isIos && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-paper-2 text-ink text-xs font-medium rounded-lg">
                <Share className="w-3.5 h-3.5" />
                <span>Share &gt; Add to Home Screen</span>
              </span>
            )}
            <button
              onClick={handleDismiss}
              className="text-xs font-medium text-ink-muted hover:text-ink underline py-1"
            >
              {t("dismiss")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
