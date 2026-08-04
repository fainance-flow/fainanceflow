import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import AppProviders from "@provider/index";
import "../assets/scss/global.scss";
import "../assets/scss/app.scss";
import "./globals.css";

// Inter — open-source substitute for BinanceNova (display + body).
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-inter",
  display: "swap",
});

// JetBrains Mono — open-source substitute for BinancePlex (numeric / tabular).
const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-jetbrains",
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const description =
  "A personal finance tracker for Pakistan. Multiple accounts, budgets, goals, and reports — with PKR as a first-class citizen.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: "FinanceFlow",
  title: {
    default: "FinanceFlow — your money, elevated",
    template: "%s · FinanceFlow",
  },
  description,
  keywords: [
    "personal finance",
    "budget tracker",
    "expense tracker",
    "PKR",
    "Pakistan finance",
    "savings goals",
    "money management",
  ],
  authors: [{ name: "FinanceFlow" }],
  creator: "FinanceFlow",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    shortcut: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/icon.svg", type: "image/svg+xml" }],
  },
  appleWebApp: {
    capable: true,
    title: "FinanceFlow",
    statusBarStyle: "black-translucent",
  },
  formatDetection: { telephone: false },
  openGraph: {
    type: "website",
    siteName: "FinanceFlow",
    title: "FinanceFlow — your money, elevated",
    description,
    url: siteUrl,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "FinanceFlow — your money, elevated",
    description,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FFFFFF" },
    { media: "(prefers-color-scheme: dark)", color: "#0B0E11" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${mono.variable}`}
      suppressHydrationWarning
    >
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
