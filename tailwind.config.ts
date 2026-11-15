import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: {
          DEFAULT: "#FAF5EA",
          2: "#F3EBDA",
        },
        surface: "#FFFDF7",
        ink: {
          DEFAULT: "#1E2B25",
          muted: "#5B665F",
        },
        line: "#E2D8C3",
        forest: {
          DEFAULT: "#1F5C4A",
          hover: "#174A3B",
          soft: "#DDEBE3",
        },
        saffron: {
          DEFAULT: "#E39B2B",
          soft: "#FBE9C8",
        },
        ok: {
          DEFAULT: "#2F7D4F",
          soft: "#E3F2E9",
        },
        brick: {
          DEFAULT: "#B93A2B",
          soft: "#F7DDD6",
        },
      },
      fontFamily: {
        sans: ["var(--font-mukta)", "sans-serif"],
        display: ["var(--font-fraunces)", "serif"],
        displayDeva: ["var(--font-noto-serif-deva)", "serif"],
      },
      borderRadius: {
        "smriti-sm": "10px",
        "smriti-md": "14px",
        "smriti-lg": "18px",
        "smriti-xl": "22px",
      },
      boxShadow: {
        smriti: "0 2px 8px -2px rgba(30, 43, 37, 0.06), 0 1px 3px 0 rgba(30, 43, 37, 0.04)",
        "smriti-float": "0 8px 24px -4px rgba(30, 43, 37, 0.12), 0 2px 6px -1px rgba(30, 43, 37, 0.06)",
        "smriti-sheet": "0 -8px 24px -4px rgba(30, 43, 37, 0.15)",
      },
    },
  },
  plugins: [],
};

export default config;
