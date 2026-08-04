"use client";

import { useState } from "react";
import { LogOut, Mail, ShieldCheck, UserCog, Wallet, KeyRound, Eye, EyeOff, Check } from "lucide-react";
import Badge from "@components/common/Badge";
import Button from "@components/common/Button";
import Avatar from "@components/common/Avatar";
import { useAppSelector } from "@hooks/useTypedRedux";
import { useLogout } from "@hooks/useAuth";
import { toast } from "sonner";

// ── App-level password stored in localStorage ─────────────────
const APP_PASS_KEY = "ff-app-password";

function getStoredPassword(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(APP_PASS_KEY);
}
function savePassword(pw: string): void {
  localStorage.setItem(APP_PASS_KEY, pw);
}
function clearPassword(): void {
  localStorage.removeItem(APP_PASS_KEY);
}

// ── Sub-components ─────────────────────────────────────────────
type RowProps = { icon: React.ReactNode; label: string; value: React.ReactNode };

const Row = ({ icon, label, value }: RowProps) => (
  <div className="flex items-start gap-3 py-3 border-b border-line-strong last:border-0">
    <span className="h-8 w-8 grid place-items-center rounded-md bg-surface-2 text-muted shrink-0">
      {icon}
    </span>
    <div className="min-w-0 flex-1">
      <p className="font-mono text-[10px] tracking-[0.16em] uppercase text-muted">{label}</p>
      <p className="text-sm text-ink mt-0.5 truncate">{value}</p>
    </div>
  </div>
);

// ── Password field helper ──────────────────────────────────────
const PwField = ({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) => {
  const [show, setShow] = useState(false);
  return (
    <div className="space-y-1.5">
      <p className="font-mono text-[10px] tracking-[0.16em] uppercase text-muted">{label}</p>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full h-10 px-3 pr-10 rounded-md border border-line-strong bg-canvas text-sm text-ink placeholder:text-faint focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-ink cursor-pointer"
          tabIndex={-1}
        >
          {show ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
        </button>
      </div>
    </div>
  );
};

// ── Main component ─────────────────────────────────────────────
const SettingsView = () => {
  const user = useAppSelector((s) => s.auth.user);
  const logout = useLogout();
  const hasPassword = Boolean(getStoredPassword());

  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwSaved, setPwSaved] = useState(false);

  const isAdmin = user?.role === "admin";
  const joined = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-PK", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "—";

  const handleChangePassword = (): void => {
    const stored = getStoredPassword();

    // If a password exists, verify current
    if (stored && stored !== currentPw.trim()) {
      toast.error("Current password is incorrect.");
      return;
    }
    if (!newPw.trim()) {
      toast.error("New password cannot be empty.");
      return;
    }
    if (newPw.trim().length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }
    if (newPw !== confirmPw) {
      toast.error("Passwords do not match.");
      return;
    }
    savePassword(newPw.trim());
    toast.success(stored ? "Password updated successfully." : "Password set successfully.");
    setCurrentPw("");
    setNewPw("");
    setConfirmPw("");
    setPwSaved(true);
    setTimeout(() => setPwSaved(false), 2000);
  };

  const handleRemovePassword = (): void => {
    const stored = getStoredPassword();
    if (stored && stored !== currentPw.trim()) {
      toast.error("Enter your current password to remove it.");
      return;
    }
    clearPassword();
    toast.success("App password removed.");
    setCurrentPw("");
    setNewPw("");
    setConfirmPw("");
  };

  return (
    <div className="ff-page">
      <header className="ff-page__header">
        <div className="ff-page__title-block">
          <span className="eyebrow">Account</span>
          <h1>Settings</h1>
          <p className="subtitle">Your profile, security, and session management.</p>
        </div>
      </header>

      {/* Profile card */}
      <section className="rounded-2xl border border-line-strong bg-surface/60 p-6">
        <div className="flex items-center gap-4">
          <Avatar size="lg" name={user?.name ?? "User"} />
          <div className="min-w-0">
            <p className="font-display text-2xl leading-tight truncate">{user?.name ?? "—"}</p>
            <p className="text-sm text-muted truncate">{user?.email ?? "—"}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge tone={isAdmin ? "gold" : "emerald"} dot>{user?.role ?? "user"}</Badge>
              <Badge tone="muted">since {joined}</Badge>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <Row icon={<UserCog className="h-3.5 w-3.5" />} label="Full name" value={user?.name ?? "—"} />
          <Row icon={<Mail className="h-3.5 w-3.5" />} label="Email" value={user?.email ?? "—"} />
          <Row icon={<Wallet className="h-3.5 w-3.5" />} label="Currency" value={user?.currency ?? "PKR"} />
          <Row
            icon={<ShieldCheck className="h-3.5 w-3.5" />}
            label="Role"
            value={
              <span className="inline-flex items-center gap-2">
                <span className="capitalize">{user?.role ?? "user"}</span>
                {isAdmin && (
                  <span className="font-mono text-[10px] tracking-[0.14em] uppercase text-muted">
                    · can manage users via /api/admin
                  </span>
                )}
              </span>
            }
          />
        </div>
      </section>

      {/* Change / Set password */}
      <section className="rounded-2xl border border-line-strong bg-surface/60 p-6 space-y-4">
        <div>
          <span className="editorial-rule">Security</span>
          <h2 className="font-display text-xl mt-2 font-semibold flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-primary" />
            {hasPassword ? "Change App Password" : "Set App Password"}
          </h2>
          <p className="text-sm text-muted mt-1">
            {hasPassword
              ? "Update the password used to protect this app session and wallet PINs."
              : "Set a password to protect access to this app. Stored locally in your browser."}
          </p>
        </div>

        <div className="space-y-3 max-w-sm">
          {hasPassword && (
            <PwField
              label="Current password"
              value={currentPw}
              onChange={setCurrentPw}
              placeholder="Enter current password"
            />
          )}
          <PwField
            label="New password"
            value={newPw}
            onChange={setNewPw}
            placeholder="At least 6 characters"
          />
          <PwField
            label="Confirm new password"
            value={confirmPw}
            onChange={setConfirmPw}
            placeholder="Repeat new password"
          />

          {newPw && confirmPw && newPw !== confirmPw && (
            <p className="text-xs text-terra">Passwords do not match.</p>
          )}
          {newPw && confirmPw && newPw === confirmPw && (
            <p className="text-xs text-emerald flex items-center gap-1">
              <Check className="h-3 w-3" /> Passwords match
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          <Button
            variant="primary"
            onClick={handleChangePassword}
            loading={pwSaved}
            disabled={!newPw || !confirmPw}
          >
            {pwSaved ? "Saved!" : hasPassword ? "Update password" : "Set password"}
          </Button>
          {hasPassword && (
            <Button variant="danger" onClick={handleRemovePassword}>
              Remove password
            </Button>
          )}
        </div>
      </section>

      {/* Sign out */}
      <section className="rounded-2xl border border-line-strong bg-surface/60 p-6">
        <span className="editorial-rule">Session</span>
        <h2 className="font-display text-xl mt-2 font-semibold">Sign out of FinanceFlow</h2>
        <p className="text-sm text-muted mt-1">
          Signs you out across all devices by revoking every refresh token on the server.
        </p>
        <Button variant="outline" className="mt-4" onClick={() => void logout()}>
          <LogOut className="h-4 w-4" />
          Sign out
        </Button>
      </section>
    </div>
  );
};

export default SettingsView;
