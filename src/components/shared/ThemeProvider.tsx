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
  const [theme, setThemeState] = useState<Theme>("light");
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const applyLightTheme = () => {
      const root = document.documentElement;
      root.classList.remove("dark");
      setThemeState("light");
      setResolvedTheme("light");

      const themeColorMeta = document.querySelector('meta[name="theme-color"]');
      if (themeColorMeta) {
        themeColorMeta.setAttribute("content", "#F8FAFC");
      } else {
        const meta = document.createElement("meta");
        meta.name = "theme-color";
        meta.content = "#F8FAFC";
        document.head.appendChild(meta);
      }
    };

    applyLightTheme();
  }, []);

  const setTheme = (_newTheme: Theme) => {
    setThemeState("light");
    setResolvedTheme("light");
    document.documentElement.classList.remove("dark");
    const themeColorMeta = document.querySelector('meta[name="theme-color"]');
    if (themeColorMeta) {
      themeColorMeta.setAttribute("content", "#F8FAFC");
    }
  };

  const toggleTheme = () => setTheme("light");

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
