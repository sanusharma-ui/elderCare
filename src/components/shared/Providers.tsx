"use client";

import React, { useState, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { I18nProvider } from "@/lib/i18n-provider";
import { PwaRegister } from "@/components/shared/PwaRegister";
import { Toaster } from "sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Instant client-side restoration of large text preference from localStorage (0ms DB delay)
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
            refetchOnWindowFocus: false, // Prevents background fetch storms on every tab click
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <PwaRegister />
        {children}
        <Toaster
          position="top-center"
          richColors={false}
          toastOptions={{
            style: {
              background: "#FFFDF7",
              color: "#1E2B25",
              border: "1px solid #E2D8C3",
              borderRadius: "14px",
              fontFamily: "var(--font-mukta)",
              fontSize: "16px",
              boxShadow: "0 8px 24px -4px rgba(30, 43, 37, 0.12)",
            },
          }}
        />
      </I18nProvider>
    </QueryClientProvider>
  );
}
