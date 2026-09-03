"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Wallet, ArrowLeftRight, PieChart, BarChart3 } from "lucide-react";
import Menubar from "@components/layout/Menubar";
import Topbar from "@components/layout/Topbar";
import FinanceCloudMigration from "@components/providers/FinanceCloudMigration";
import { useRequireAuth } from "@hooks/useAuth";

const MOBILE_NAV = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/accounts", label: "Wallets", icon: Wallet },
  { href: "/transactions", label: "Txns", icon: ArrowLeftRight },
  { href: "/budget", label: "Budget", icon: PieChart },
  { href: "/reports", label: "Reports", icon: BarChart3 },
];

type Props = {
  children: React.ReactNode;
};

const ProtectedLayout = ({ children }: Props) => {
  const status = useRequireAuth();
  const pathname = usePathname();

  if (status === "idle" || status === "authenticating") {
    return (
      <main className="min-h-screen grid place-items-center">
        <div className="text-center space-y-3">
          <div className="mx-auto h-10 w-10 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
          <p className="font-mono text-[11px] tracking-[0.18em] uppercase text-faint">Loading…</p>
        </div>
      </main>
    );
  }

  if (status === "anonymous") return null;

  return (
    <div className="h-screen overflow-hidden flex">
      <a href="#main-content" className="ff-skip-link">
        Skip to content
      </a>
      <FinanceCloudMigration />
      {/* Desktop sidebar — sticky, self-scrolling */}
      <Menubar />

      {/* Main content — scrollable column */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar />
        <main
          id="main-content"
          tabIndex={-1}
          className="flex-1 overflow-y-auto pb-20 md:pb-0 focus:outline-none"
        >
          {children}
        </main>
      </div>

      {/* Mobile bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t border-line bg-canvas/90 backdrop-blur-xl">
        <div className="flex items-center">
          {MOBILE_NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                className={[
                  "relative flex-1 flex flex-col items-center gap-1 py-3 text-[10px] font-mono tracking-wider uppercase transition-colors duration-150",
                  active ? "text-primary" : "text-faint hover:text-muted",
                ].join(" ")}
              >
                <Icon className={["h-5 w-5", active ? "stroke-[2]" : "stroke-[1.5]"].join(" ")} />
                <span>{label}</span>
                {active && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-primary" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default ProtectedLayout;
