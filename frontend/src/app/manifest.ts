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
      {
        src: "/apple-icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
