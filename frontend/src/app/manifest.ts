import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "FinanceFlow — your money, elevated",
    short_name: "FinanceFlow",
    description:
      "A personal finance tracker for Pakistan. Accounts, budgets, goals, and reports — with PKR as a first-class citizen.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#0B0E11",
    theme_color: "#FCD535",
    orientation: "portrait-primary",
    categories: ["finance", "productivity", "utilities"],
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      // Chrome's install/A2HS eligibility check looks for a real raster icon at
      // an explicit size (e.g. "192x192") — an SVG-only "any" entry can silently
      // fail that check with no visible error, which is why the install prompt
      // wasn't showing up at all despite everything else being in place.
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
