"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Wallet,
  ArrowLeftRight,
  ShoppingCart,
  PieChart,
  BarChart3,
  Settings2,
  CreditCard,
  Landmark,
  Target,
  Settings,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useAppSelector } from "@hooks/useTypedRedux";

type NavLink = {
  href: string;
  label: string;
  icon: LucideIcon;
};

const PRIMARY: NavLink[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/accounts", label: "Wallets", icon: Wallet },
  { href: "/transactions", label: "Transactions", icon: ArrowLeftRight },
  { href: "/expenses", label: "Expenses", icon: ShoppingCart },
  { href: "/budget", label: "Budget", icon: PieChart },
  { href: "/goals", label: "Goals", icon: Target },
  { href: "/subscriptions", label: "Subscriptions", icon: CreditCard },
  { href: "/loans", label: "Loans", icon: Landmark },
  { href: "/reports", label: "Reports", icon: BarChart3 },
];

const Menubar = () => {
  const pathname = usePathname();
  const user = useAppSelector((s) => s.auth.user);
  const initials = user?.name
    ? user.name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "FF";

  return (
    <aside className="ff-menubar relative z-20">
      {/* Brand */}
      <Link href="/dashboard" className="ff-topbar__brand pl-3 mb-6">
        <span className="mark">f</span>
        <span>
          Finance<em>Flow</em>
        </span>
      </Link>

      {/* Workspace nav */}
      <p className="ff-menubar__section-label">Workspace</p>
      <nav className="flex flex-col gap-0.5">
        {PRIMARY.map((link) => {
          const LinkIcon = link.icon;
          const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`ff-menubar__item ${active ? "ff-menubar__item--active" : ""}`}
            >
              <LinkIcon />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Settings */}
      <p className="ff-menubar__section-label">Account</p>
      <nav className="flex flex-col gap-0.5">
        <Link
          href="/settings"
          className={`ff-menubar__item ${pathname === "/settings" ? "ff-menubar__item--active" : ""}`}
        >
          <Settings2 />
          <span>Settings</span>
        </Link>
      </nav>

      {/* Profile footer */}
      <div className="ff-menubar__footer">
        <Link href="/settings" className="ff-menubar__profile">
          <div className="avatar">{initials}</div>
          <div className="info">
            <p className="name">{user?.name ?? "Local User"}</p>
            <p className="role">Personal</p>
          </div>
          <Settings className="settings-icon" />
        </Link>
        <p className="ff-menubar__version">v 1.0.0 · local ledger</p>
      </div>
    </aside>
  );
};

export default Menubar;
