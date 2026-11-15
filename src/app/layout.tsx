import type { Metadata, Viewport } from "next";
import { Mukta, Fraunces, Noto_Serif_Devanagari } from "next/font/google";
import { Providers } from "@/components/shared/Providers";
import "./globals.css";

const mukta = Mukta({
  subsets: ["latin", "devanagari"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-mukta",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

const notoSerifDeva = Noto_Serif_Devanagari({
  subsets: ["devanagari", "latin"],
  weight: ["400", "600", "700"],
  variable: "--font-noto-serif-deva",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#F8FAFC",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "CareSaathi — Elderly Care & Medication Management",
  description:
    "A calm, shared healthcare ecosystem for elders, caretakers, family, and doctors across India.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "CareSaathi",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${mukta.variable} ${fraunces.variable} ${notoSerifDeva.variable}`}
    >
      <body className="text-ink antialiased selection:bg-accent-blue/20">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
