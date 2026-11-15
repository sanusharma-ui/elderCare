"use client";

import React, { useState, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { I18nProvider } from "@/lib/i18n-provider";
import { PwaRegister } from "@/components/shared/PwaRegister";
import { ThemeProvider } from "@/components/shared/ThemeProvider";
import { Toaster } from "sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Instant client-side restoration of large text preference from localStorage
    if (typeof window !== "undefined") {
      const isLarge = localStorage.getItem("smriti_large_text") === "true";
      if (isLarge) {
        document.documentElement.setAttribute("data-text-size", "large");
        document.body.setAttribute("data-text-size", "large");
      }
    }
  }, []);

  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60, // 1 minute
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <I18nProvider>
          <PwaRegister />
          {children}
          <Toaster
            position="top-center"
            richColors={false}
            toastOptions={{
              className: "glass-pill !text-ink !border-white/60 dark:!border-white/10 !shadow-lg",
              style: {
                fontFamily: "var(--font-mukta)",
                fontSize: "15px",
                fontWeight: 600,
              },
            }}
          />
        </I18nProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
