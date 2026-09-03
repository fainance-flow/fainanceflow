import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

const config: Config = {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}"],
  safelist: [
    "bg-primary",
    "text-on-primary",
    "border-primary",
    "text-primary",
    "bg-gold",
    "text-gold",
    "border-gold",
    "text-emerald",
    "text-terra",
    "text-up",
    "text-down",
  ],
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: { "2xl": "1440px" },
    },
    extend: {
      colors: {
        // Surface tokens
        canvas: "rgb(var(--c-canvas) / <alpha-value>)",
        surface: "rgb(var(--c-surface) / <alpha-value>)",
        "surface-2": "rgb(var(--c-surface-2) / <alpha-value>)",
        "surface-3": "rgb(var(--c-surface-3) / <alpha-value>)",
        line: "rgb(var(--c-line) / <alpha-value>)",
        "line-strong": "rgb(var(--c-line-strong) / <alpha-value>)",
        hairline: "rgb(var(--c-line) / <alpha-value>)",

        // Text tokens
        ink: "rgb(var(--c-ink) / <alpha-value>)",
        muted: "rgb(var(--c-muted) / <alpha-value>)",
        faint: "rgb(var(--c-faint) / <alpha-value>)",

        // Brand — Binance Yellow
        primary: "rgb(var(--c-primary) / <alpha-value>)",
        "primary-active": "rgb(var(--c-primary-active) / <alpha-value>)",
        "on-primary": "rgb(var(--c-on-primary) / <alpha-value>)",

        // Trading semantics
        emerald: "rgb(var(--c-emerald) / <alpha-value>)",
        terra: "rgb(var(--c-terra) / <alpha-value>)",
        "trading-up": "rgb(var(--c-emerald) / <alpha-value>)",
        "trading-down": "rgb(var(--c-terra) / <alpha-value>)",
        warning: "rgb(var(--c-warning) / <alpha-value>)",
        info: "rgb(var(--c-info) / <alpha-value>)",

        // Backward-compat aliases (point at primary so existing class drift still works)
        gold: "rgb(var(--c-primary) / <alpha-value>)",
        "on-gold": "rgb(var(--c-on-primary) / <alpha-value>)",
      },
      fontFamily: {
        // Per Binance spec: Inter ≈ BinanceNova, JetBrains Mono ≈ BinancePlex.
        display: [
          "var(--font-inter)",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
        sans: [
          "var(--font-inter)",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
        mono: ["var(--font-jetbrains)", "ui-monospace", "monospace"],
        numeric: ["var(--font-jetbrains)", "ui-monospace", "monospace"],
      },
      fontSize: {
        // Binance hierarchy
        "hero-display": [
          "clamp(2.5rem, 6vw, 4rem)",
          { lineHeight: "1.1", letterSpacing: "-0.02em", fontWeight: "700" },
        ],
        "display-xl": [
          "clamp(2.25rem, 5vw, 3.5rem)",
          { lineHeight: "1.1", letterSpacing: "-0.02em", fontWeight: "700" },
        ],
        "display-lg": [
          "clamp(2rem, 4vw, 3rem)",
          { lineHeight: "1.1", letterSpacing: "-0.015em", fontWeight: "700" },
        ],
        "display-md": [
          "clamp(1.625rem, 2.8vw, 2.25rem)",
          { lineHeight: "1.15", letterSpacing: "-0.01em", fontWeight: "600" },
        ],
        "display-sm": [
          "clamp(1.375rem, 2vw, 1.75rem)",
          { lineHeight: "1.2", letterSpacing: "-0.005em", fontWeight: "600" },
        ],
        "title-lg": ["1.5rem", { lineHeight: "1.3", fontWeight: "600" }],
        "title-md": ["1.25rem", { lineHeight: "1.35", fontWeight: "600" }],
        "title-sm": ["1rem", { lineHeight: "1.4", fontWeight: "600" }],
      },
      borderRadius: {
        // Binance radius scale — tighter than typical marketing systems.
        none: "0",
        xs: "2px",
        sm: "4px", // small badges, inline buttons
        md: "6px", // primary CTA buttons, inputs
        lg: "8px", // content cards, search input
        xl: "12px", // elevated card containers, markets table
        "2xl": "16px",
        "3xl": "20px",
        pill: "9999px",
        full: "9999px",
      },
      boxShadow: {
        card: "var(--shadow-card)",
        raised: "var(--shadow-raised)",
        glow: "var(--shadow-glow)",
        "glow-success": "var(--shadow-glow-success)",
        "glow-danger": "var(--shadow-glow-danger)",
        focus: "var(--shadow-focus)",
        // Legacy aliases
        soft: "var(--shadow-card)",
        elevated: "var(--shadow-raised)",
        "gold-glow": "none",
      },
      spacing: {
        // Binance section padding (80px between major bands)
        section: "5rem",
      },
      animation: {
        "fade-up": "fade-up 700ms cubic-bezier(0.22, 1, 0.36, 1) both",
        "fade-in": "fade-in 500ms ease-out both",
        shimmer: "shimmer 2.4s linear infinite",
        "pulse-soft": "pulse-soft 2s ease-in-out infinite",
        "ledger-tick": "ledger-tick 600ms ease-out both",
        "slide-up": "slide-up 300ms cubic-bezier(0.22, 1, 0.36, 1) both",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "0.5" },
          "50%": { opacity: "1" },
        },
        "ledger-tick": {
          "0%": { opacity: "0", transform: "translateY(-4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-up": {
          "0%": { opacity: "0", transform: "translateY(16px) scale(0.97)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" },
        },
      },
    },
  },
  plugins: [animate],
};

export default config;
