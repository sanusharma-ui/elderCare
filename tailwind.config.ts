import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: {
          DEFAULT: "var(--paper)",
          2: "var(--paper-2)",
        },
        surface: "var(--surface)",
        ink: {
          DEFAULT: "var(--ink)",
          muted: "var(--ink-muted)",
        },
        line: "var(--line)",
        forest: {
          DEFAULT: "var(--forest)",
          hover: "var(--forest-hover)",
          soft: "var(--forest-soft)",
        },
        saffron: {
          DEFAULT: "#E39B2B",
          soft: "var(--saffron-soft)",
        },
        ok: {
          DEFAULT: "#2F7D4F",
          soft: "var(--ok-soft)",
        },
        brick: {
          DEFAULT: "#B93A2B",
          soft: "var(--brick-soft)",
        },
        // New Reference-Aligned Design Tokens
        accent: {
          blue: "var(--accent-blue)",
          indigo: "var(--accent-indigo)",
        },
        glass: {
          bg: "var(--glass-bg)",
          border: "var(--glass-border)",
          subtle: "var(--glass-subtle)",
          pill: "var(--glass-pill)",
        },
      },
      fontFamily: {
        sans: ["var(--font-mukta)", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
        display: ["var(--font-fraunces)", "serif"],
        displayDeva: ["var(--font-noto-serif-deva)", "serif"],
      },
      borderRadius: {
        "glass-sm": "16px",
        "glass-md": "24px",
        "glass-lg": "28px",
        "glass-xl": "32px",
        "glass-2xl": "36px",
        "smriti-sm": "12px",
        "smriti-md": "16px",
        "smriti-lg": "24px",
        "smriti-xl": "32px",
      },
      boxShadow: {
        glass: "0 20px 50px rgba(37, 99, 235, 0.07), 0 4px 14px rgba(15, 23, 42, 0.04)",
        "glass-sm": "0 8px 24px rgba(37, 99, 235, 0.05), 0 2px 6px rgba(15, 23, 42, 0.02)",
        "glass-glow": "0 0 45px rgba(59, 130, 246, 0.22)",
        "glass-pill": "0 4px 16px rgba(15, 23, 42, 0.08)",
        smriti: "0 20px 50px rgba(37, 99, 235, 0.07), 0 4px 14px rgba(15, 23, 42, 0.04)",
        "smriti-float": "0 24px 60px rgba(15, 23, 42, 0.12), 0 6px 16px rgba(15, 23, 42, 0.06)",
        "smriti-sheet": "0 -16px 40px rgba(15, 23, 42, 0.14)",
      },
      backdropBlur: {
        "2xl": "40px",
        "3xl": "64px",
      },
    },
  },
  plugins: [],
};

export default config;
