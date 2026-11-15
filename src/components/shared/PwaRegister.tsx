"use client";

import { useEffect } from "react";

export function PwaRegister() {
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      process.env.NODE_ENV === "production"
    ) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((registration) => {
            console.log("Smriti PWA Service Worker registered:", registration.scope);
          })
          .catch((error) => {
            console.error("Smriti PWA Service Worker registration failed:", error);
          });
      });
    }
  }, []);

  return null;
}
