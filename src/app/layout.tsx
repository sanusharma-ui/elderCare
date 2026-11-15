import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Smriti Platform API",
  description: "Elderly Care & Medication Management Platform - Backend Foundation",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, -apple-system, sans-serif", margin: 0, padding: 0 }}>
        {children}
      </body>
    </html>
  );
}
