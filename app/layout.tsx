import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: {
    default: "FloodFact AI — Flood Early Warning & Rumour Verification",
    template: "%s · FloodFact AI",
  },
  description:
    "Community-centered flood early warning and WhatsApp rumour verification for Nairobi's informal settlements. Phase 1 pilot: Mukuru.",
  openGraph: {
    title: "FloodFact AI",
    description:
      "Evidence-based flood alerts and rumour verification for Kibera, Mathare and Mukuru — powered by AI, trusted through people.",
    type: "website",
  },
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#0c5a5e",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
