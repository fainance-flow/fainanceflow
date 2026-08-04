"use client";

import * as Dropdown from "@radix-ui/react-dropdown-menu";
import { ChevronDown, LogOut, Settings, UserRound } from "lucide-react";
import Avatar from "@components/common/Avatar";
import { useAppSelector } from "@hooks/useTypedRedux";
import { useLogout } from "@hooks/useAuth";

type ItemProps = {
  icon: React.ReactNode;
  children: React.ReactNode;
  onSelect?: () => void;
  tone?: "terra";
};

const DropItem = ({ icon, children, onSelect, tone }: ItemProps) => {
  return (
    <Dropdown.Item
      onSelect={onSelect}
      className={`flex items-center gap-2 px-3 py-2 text-sm rounded-md cursor-pointer outline-none ${
        tone === "terra" ? "text-terra hover:bg-terra/10" : "text-ink hover:bg-surface-2"
      }`}
    >
      {icon}
      {children}
    </Dropdown.Item>
  );
};

const ProfileDropdown = () => {
  const user = useAppSelector((s) => s.auth.user);
  const logout = useLogout();

  return (
    <Dropdown.Root>
      <Dropdown.Trigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-2 pl-1 pr-2 py-1 rounded-full border border-line-strong hover:border-primary transition-colors"
        >
          <Avatar size="sm" name={user?.name ?? "User"} />
          <span className="hidden sm:flex flex-col items-start leading-tight">
            <span className="text-xs font-medium text-ink">{user?.name ?? "—"}</span>
            <span className="font-mono text-[9px] tracking-[0.14em] uppercase text-muted">
              {user?.currency ?? "PKR"}
            </span>
          </span>
          <ChevronDown className="h-3.5 w-3.5 text-muted" />
        </button>
      </Dropdown.Trigger>

      <Dropdown.Portal>
        <Dropdown.Content
          align="end"
          sideOffset={8}
          className="z-50 w-56 bg-surface border border-line-strong rounded-xl shadow-elevated p-1.5 animate-fade-up"
        >
          <div className="px-3 py-3 border-b border-line-strong">
            <p className="font-display text-base leading-tight">{user?.name ?? "—"}</p>
            <p className="text-xs text-muted truncate">{user?.email ?? "—"}</p>
          </div>
          <DropItem icon={<UserRound className="h-3.5 w-3.5" />}>Profile</DropItem>
          <DropItem icon={<Settings className="h-3.5 w-3.5" />}>Preferences</DropItem>
          <Dropdown.Separator className="my-1 h-px bg-line-strong" />
          <DropItem
            icon={<LogOut className="h-3.5 w-3.5" />}
            onSelect={() => void logout()}
            tone="terra"
          >
            Sign out
          </DropItem>
        </Dropdown.Content>
      </Dropdown.Portal>
    </Dropdown.Root>
  );
};

export default ProfileDropdown;
