"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark" | "system";

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: "light" | "dark";
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("system");
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    // 1. Initial restoration from localStorage
    const saved = localStorage.getItem("caresaathi_theme") as Theme | null;
    const initialTheme: Theme = saved || "system";
    setThemeState(initialTheme);

    const applyTheme = (t: Theme) => {
      let isDark = false;
      if (t === "dark") {
        isDark = true;
      } else if (t === "light") {
        isDark = false;
      } else {
        isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      }

      const root = document.documentElement;
      if (isDark) {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }

      const resolved = isDark ? "dark" : "light";
      setResolvedTheme(resolved);

      // 2. Sync PWA theme-color meta tag for status bar in both modes
      const themeColorMeta = document.querySelector('meta[name="theme-color"]');
      const targetColor = isDark ? "#09090B" : "#F8FAFC";
      if (themeColorMeta) {
        themeColorMeta.setAttribute("content", targetColor);
      } else {
        const meta = document.createElement("meta");
        meta.name = "theme-color";
        meta.content = targetColor;
        document.head.appendChild(meta);
      }
    };

    applyTheme(initialTheme);

    // 3. Listen to system preference changes when in 'system' mode
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleSystemChange = () => {
      const current = localStorage.getItem("caresaathi_theme") as Theme | null;
      if (!current || current === "system") {
        applyTheme("system");
      }
    };

    mediaQuery.addEventListener("change", handleSystemChange);
    return () => mediaQuery.removeEventListener("change", handleSystemChange);
  }, []);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem("caresaathi_theme", newTheme);

    let isDark = false;
    if (newTheme === "dark") {
      isDark = true;
    } else if (newTheme === "light") {
      isDark = false;
    } else {
      isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    }

    const root = document.documentElement;
    if (isDark) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    const resolved = isDark ? "dark" : "light";
    setResolvedTheme(resolved);

    // Sync PWA theme-color
    const themeColorMeta = document.querySelector('meta[name="theme-color"]');
    const targetColor = isDark ? "#070B14" : "#DCEAFE";
    if (themeColorMeta) {
      themeColorMeta.setAttribute("content", targetColor);
    }
  };

  const toggleTheme = () => {
    const next = resolvedTheme === "dark" ? "light" : "dark";
    setTheme(next);
  };

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return ctx;
}
