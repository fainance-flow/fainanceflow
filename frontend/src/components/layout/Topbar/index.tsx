"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Bell, Plus } from "lucide-react";
import Button from "@components/common/Button";
import ThemeSwitch from "@components/common/ThemeSwitch";
import ProfileDropdown from "@components/common/ProfileDropdown";
import Tooltip from "@components/common/Tooltip";
import QuickAddModal from "@components/blocks/forms/quickAddModal";

const PAGE_META: Record<string, { title: string; subtitle: string }> = {
  "/dashboard":     { title: "Dashboard",     subtitle: "Overview · this month" },
  "/accounts":      { title: "Wallets",        subtitle: "All accounts" },
  "/transactions":  { title: "Transactions",   subtitle: "Income & expenses" },
  "/expenses":      { title: "Expenses",       subtitle: "Outflow tracker" },
  "/budget":        { title: "Budget",         subtitle: "Monthly limits" },
  "/goals":         { title: "Goals",          subtitle: "Financial targets" },
  "/subscriptions": { title: "Subscriptions",  subtitle: "Recurring charges" },
  "/loans":         { title: "Loans",          subtitle: "Debt tracker" },
  "/reports":       { title: "Reports",        subtitle: "Analytics & exports" },
  "/settings":      { title: "Settings",       subtitle: "Preferences & profile" },
};

const Topbar = () => {
  const pathname = usePathname();
  const meta = PAGE_META[pathname] ?? {
    title: pathname.replace("/", ""),
    subtitle: "FinanceFlow",
  };
  const [quickAddOpen, setQuickAddOpen] = useState<boolean>(false);

  return (
    <header className="ff-topbar">
      {/* Page info */}
      <div className="ff-topbar__page-info">
        <span className="page-title">{meta.title}</span>
        <span className="page-subtitle">{meta.subtitle}</span>
      </div>

      <span className="ff-topbar__spacer" />

      <div className="ff-topbar__actions">
        {/* Quick add */}
        <Tooltip content="Quick add (income, expense, transfer…)">
          <Button
            size="sm"
            variant="primary"
            className="hidden md:inline-flex"
            onClick={() => setQuickAddOpen(true)}
          >
            <Plus className="h-3.5 w-3.5" />
            Quick add
          </Button>
        </Tooltip>

        {/* Notification bell */}
        <Tooltip content="Notifications">
          <div className="ff-topbar__bell-wrap">
            <Button size="icon" variant="ghost" aria-label="Notifications">
              <Bell className="h-4 w-4" />
            </Button>
          </div>
        </Tooltip>

        <ThemeSwitch />
        <ProfileDropdown />
      </div>

      <QuickAddModal open={quickAddOpen} onOpenChange={setQuickAddOpen} />
    </header>
  );
};

export default Topbar;
