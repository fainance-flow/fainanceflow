"use client";

import { useState } from "react";
import { Plus, Wallet as WalletIcon, Pencil, Trash2, ArrowLeftRight, Lock, Eye, EyeOff } from "lucide-react";
import PageLayout from "@components/common/PageLayout";
import Button from "@components/common/Button";
import Badge from "@components/common/Badge";
import Modal from "@components/common/Modal";
import FallBackState from "@components/common/FallBackState";
import LoadingOverlay from "@components/common/LoadingOverlay";
import Icon, { resolveIcon } from "@components/common/Icon";
import AccountForm from "@components/blocks/forms/accountForm";
import WalletEditForm from "@components/blocks/forms/walletEditForm";
import TransferForm from "@components/blocks/forms/transferForm";
import { useAccounts, useDeleteAccount } from "@hooks/useAccounts";
import { verifyWalletPin } from "@/lib/finance-store/engine";
import { formatPKR } from "@utils/currency";
import type { Wallet } from "@utils/types";
import { toast } from "sonner";

// ── PIN verify modal ────────────────────────────────────────────
const PinModal = ({
  wallet,
  onSuccess,
  onClose,
}: {
  wallet: Wallet;
  onSuccess: () => void;
  onClose: () => void;
}) => {
  const [pin, setPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState("");

  const verify = (): void => {
    if (verifyWalletPin(wallet.id, pin)) {
      setError("");
      onSuccess();
    } else {
      setError("Incorrect PIN. Try again.");
      setPin("");
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col items-center gap-3 py-2">
        <div className="h-14 w-14 rounded-2xl grid place-items-center bg-primary/10 border border-primary/20">
          <Lock className="h-6 w-6 text-primary" />
        </div>
        <p className="text-sm text-muted text-center">
          <strong className="text-ink">{wallet.name}</strong> is PIN-protected.<br />
          Enter your PIN to view balance and details.
        </p>
      </div>

      <div className="relative">
        <input
          type={showPin ? "text" : "password"}
          inputMode="numeric"
          maxLength={6}
          autoFocus
          placeholder="Enter PIN"
          value={pin}
          onChange={(e) => { setPin(e.target.value.replace(/\D/g, "").slice(0, 6)); setError(""); }}
          onKeyDown={(e) => e.key === "Enter" && verify()}
          className={[
            "w-full h-12 px-4 pr-12 text-center text-xl rounded-xl border bg-canvas text-ink font-mono tracking-[0.4em]",
            "focus:outline-none focus:ring-2 focus:ring-primary/30",
            error ? "border-terra" : "border-line-strong focus:border-primary",
          ].join(" ")}
        />
        <button
          type="button"
          onClick={() => setShowPin((v) => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink cursor-pointer"
          tabIndex={-1}
        >
          {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>

      {error && <p className="text-xs text-terra text-center">{error}</p>}

      <div className="flex gap-2">
        <Button variant="ghost" className="flex-1" onClick={onClose}>Cancel</Button>
        <Button variant="primary" className="flex-1" onClick={verify} disabled={pin.length < 4}>
          Unlock
        </Button>
      </div>
    </div>
  );
};

// ── Main view ───────────────────────────────────────────────────
const AccountsView = () => {
  const { data, isLoading, error } = useAccounts();
  const del = useDeleteAccount();
  const wallets = data ?? [];
  const total = wallets.reduce((s, a) => s + a.balance, 0);

  const [open, setOpen] = useState<boolean>(false);
  const [editing, setEditing] = useState<Wallet | null>(null);
  const [deleting, setDeleting] = useState<Wallet | null>(null);
  const [transferOpen, setTransferOpen] = useState<boolean>(false);

  // PIN unlock state — map of walletId → unlocked
  const [unlocked, setUnlocked] = useState<Record<string, boolean>>({});
  const [pinTarget, setPinTarget] = useState<Wallet | null>(null);

  const isUnlocked = (w: Wallet): boolean => !w.hasPin || !!unlocked[w.id];

  const handleViewOrEdit = (w: Wallet, action: "edit" | "delete"): void => {
    if (!isUnlocked(w)) {
      setPinTarget(w);
      // store intent so after unlock we proceed
      setPendingAction({ wallet: w, action });
      return;
    }
    if (action === "edit") setEditing(w);
    else setDeleting(w);
  };

  const [pendingAction, setPendingAction] = useState<{
    wallet: Wallet;
    action: "edit" | "delete";
  } | null>(null);

  const handlePinSuccess = (): void => {
    if (!pinTarget) return;
    setUnlocked((prev) => ({ ...prev, [pinTarget.id]: true }));
    setPinTarget(null);
    if (pendingAction) {
      const { wallet, action } = pendingAction;
      setPendingAction(null);
      if (action === "edit") setEditing(wallet);
      else setDeleting(wallet);
    }
  };

  const confirmDelete = async (): Promise<void> => {
    if (!deleting) return;
    try {
      await del.mutateAsync(deleting.id);
      toast.success(`Removed ${deleting.name}`);
      setDeleting(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not delete wallet");
    }
  };

  return (
    <PageLayout
      eyebrow="Where your money lives"
      title={<>Your <em className="italic text-primary">wallets</em></>}
      subtitle="Bank, cash, credit, and savings — balances update live from your ledger."
      actions={
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="md" onClick={() => setTransferOpen(true)} disabled={wallets.length < 2}>
            <ArrowLeftRight className="h-4 w-4" />
            Transfer
          </Button>
          <Button variant="primary" size="md" onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" />
            Add wallet
          </Button>
        </div>
      }
    >
      {/* Combined holdings tiles */}
      <div className="ff-tile-grid ff-tile-grid--3">
        <div className="ff-tile ff-tile--accent lg:col-span-2">
          <div className="ff-tile__head">
            <span className="ff-tile__label">Combined holdings</span>
          </div>
          <p className="ff-tile__value" style={{ fontSize: "clamp(1.75rem, 3.5vw, 2.75rem)" }}>
            <span className="currency">₨</span>
            {formatPKR(total, { showSymbol: false })}
          </p>
          <span className="ff-tile__sub">
            Across {wallets.length} {wallets.length === 1 ? "wallet" : "wallets"} · live ledger
          </span>
        </div>
        <div className="ff-tile ff-tile--muted">
          <div className="ff-tile__head">
            <span className="ff-tile__label">Wallets</span>
            <span className="ff-tile__icon">
              <WalletIcon className="h-4 w-4" />
            </span>
          </div>
          <p className="ff-tile__value">{wallets.length}</p>
          <span className="ff-tile__sub">
            {wallets.filter((w) => w.hasPin).length} PIN-protected
          </span>
        </div>
      </div>

      {isLoading ? (
        <LoadingOverlay rows={3} />
      ) : error || wallets.length === 0 ? (
        <FallBackState
          icon={WalletIcon}
          title="No wallets yet"
          description="Add a wallet to start tracking balances and transactions."
          action={
            <Button variant="primary" onClick={() => setOpen(true)}>
              <Plus className="h-4 w-4" />
              Add wallet
            </Button>
          }
        />
      ) : (
        <div className="ff-card-grid ff-stagger">
          {wallets.map((a) => {
            const locked = !isUnlocked(a);
            return (
              <article
                key={a.id}
                className="relative overflow-hidden rounded-xl border border-line-strong bg-surface p-6 group transition-colors duration-150 hover:border-muted cursor-default"
                style={{
                  borderLeftWidth: 2,
                  borderLeftColor: a.color,
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <span
                    className="h-12 w-12 rounded-xl grid place-items-center border shrink-0"
                    style={{
                      background: `${a.color}1a`,
                      color: a.color,
                      borderColor: `${a.color}33`,
                    }}
                  >
                    <Icon name={resolveIcon(a.icon)} className="h-5 w-5" />
                  </span>
                  <div className="flex items-center gap-1">
                    {a.hasPin && (
                      <button
                        type="button"
                        onClick={() => locked ? setPinTarget(a) : setUnlocked((p) => ({ ...p, [a.id]: false }))}
                        className="h-8 w-8 flex items-center justify-center rounded-md text-muted hover:text-primary cursor-pointer transition-colors"
                        title={locked ? "Unlock wallet" : "Lock wallet"}
                      >
                        <Lock className={`h-3.5 w-3.5 ${locked ? "text-primary" : "text-faint"}`} />
                      </button>
                    )}
                    <Badge tone="muted">{a.type.toUpperCase()}</Badge>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted hover:text-ink"
                      aria-label="Edit wallet"
                      onClick={() => handleViewOrEdit(a, "edit")}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted hover:text-terra"
                      aria-label="Delete wallet"
                      onClick={() => handleViewOrEdit(a, "delete")}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                <h3 className="font-display text-2xl mt-5">{a.name}</h3>
                <p className="font-mono text-[10px] tracking-[0.16em] uppercase text-muted mt-1">
                  {a.currency} · Available balance
                </p>

                {/* Balance — blurred if locked */}
                {locked ? (
                  <div
                    className="mt-2 flex items-center gap-3 cursor-pointer"
                    onClick={() => setPinTarget(a)}
                  >
                    <p className="font-display text-3xl tabular blur-sm select-none">
                      ₨ ••••••
                    </p>
                    <span className="flex items-center gap-1 text-xs text-primary font-mono uppercase tracking-wider">
                      <Lock className="h-3 w-3" /> Tap to unlock
                    </span>
                  </div>
                ) : (
                  <p className="font-display text-3xl tabular mt-2">
                    <span className="text-muted text-lg mr-1">{a.currency === "PKR" ? "₨" : `${a.currency} `}</span>
                    {formatPKR(a.balance, { showSymbol: false })}
                  </p>
                )}
              </article>
            );
          })}
        </div>
      )}

      {/* Add wallet modal */}
      <Modal open={open} onOpenChange={setOpen} title="Add wallet" description="Track a bank account, cash, or card.">
        <AccountForm onDone={() => setOpen(false)} />
      </Modal>

      {/* Edit wallet modal */}
      <Modal
        open={!!editing}
        onOpenChange={(v) => !v && setEditing(null)}
        title="Edit wallet"
        description="Update how this wallet appears. Optionally protect it with a PIN."
      >
        {editing && <WalletEditForm wallet={editing} onDone={() => setEditing(null)} />}
      </Modal>

      {/* Delete confirm modal */}
      <Modal
        open={!!deleting}
        onOpenChange={(v) => !v && setDeleting(null)}
        title="Delete wallet?"
        description="You can only delete wallets with no transactions or subscription links."
      >
        {deleting && (
          <div className="space-y-4">
            <p className="text-sm text-muted">
              Permanently remove <strong className="text-ink">{deleting.name}</strong>?
            </p>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setDeleting(null)} disabled={del.isPending}>Cancel</Button>
              <Button type="button" variant="danger" loading={del.isPending} onClick={() => void confirmDelete()}>Delete</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Transfer modal */}
      <Modal
        open={transferOpen}
        onOpenChange={setTransferOpen}
        title="Transfer between wallets"
        description="Moves the same amount out of one wallet and into another."
      >
        <TransferForm onDone={() => setTransferOpen(false)} />
      </Modal>

      {/* PIN unlock modal */}
      <Modal
        open={!!pinTarget}
        onOpenChange={(v) => !v && setPinTarget(null)}
        title="Unlock wallet"
      >
        {pinTarget && (
          <PinModal
            wallet={pinTarget}
            onSuccess={handlePinSuccess}
            onClose={() => { setPinTarget(null); setPendingAction(null); }}
          />
        )}
      </Modal>
    </PageLayout>
  );
};

export default AccountsView;
