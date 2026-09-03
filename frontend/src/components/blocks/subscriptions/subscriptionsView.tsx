"use client";

import { useState } from "react";
import { Plus, CreditCard, CheckCircle } from "lucide-react";
import PageLayout from "@components/common/PageLayout";
import Button from "@components/common/Button";
import Modal from "@components/common/Modal";
import Badge from "@components/common/Badge";
import FallBackState from "@components/common/FallBackState";
import LoadingOverlay from "@components/common/LoadingOverlay";
import SubscriptionForm from "@components/blocks/forms/subscriptionForm";
import {
  useSubscriptions,
  useDeleteSubscription,
  usePaySubscription,
} from "@hooks/useSubscriptions";
import { formatPKR } from "@utils/currency";
import { format } from "date-fns";
import type { Subscription } from "@utils/types";
import { toast } from "sonner";

const statusTone = (s: Subscription["status"]): "emerald" | "gold" | "muted" => {
  if (s === "active") return "emerald";
  if (s === "paused") return "gold";
  return "muted";
};

const SubscriptionsView = () => {
  const { data, isLoading } = useSubscriptions();
  const remove = useDeleteSubscription();
  const pay = usePaySubscription();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Subscription | null>(null);

  const list = [...(data ?? [])].sort(
    (a, b) => new Date(a.nextRenewal).getTime() - new Date(b.nextRenewal).getTime()
  );

  const activeCount = list.filter((s) => s.status === "active").length;
  const monthlyCost = list
    .filter((s) => s.status === "active")
    .reduce((sum, s) => {
      const m =
        s.billingCycle === "yearly"
          ? s.amount / 12
          : s.billingCycle === "weekly"
            ? s.amount * 4.33
            : s.amount;
      return sum + Number(m || 0);
    }, 0);
  const dueSoon = list.filter((s) => {
    const days = Math.ceil((new Date(s.nextRenewal).getTime() - Date.now()) / 86_400_000);
    return s.status === "active" && days >= 0 && days <= 7;
  }).length;

  const onPay = async (id: string): Promise<void> => {
    try {
      await pay.mutateAsync(id);
      toast.success("Marked paid · next renewal updated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Payment failed");
    }
  };

  const onDelete = async (id: string): Promise<void> => {
    if (!confirm("Delete this subscription?")) return;
    try {
      await remove.mutateAsync(id);
      toast.success("Subscription removed");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    }
  };

  return (
    <PageLayout
      eyebrow="Recurring"
      title={
        <>
          <em className="italic text-gold">Subscriptions</em>
        </>
      }
      subtitle="Track renewals, link a wallet, and mark bills as paid."
      actions={
        <Button variant="gold" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" />
          Add subscription
        </Button>
      }
    >
      {list.length > 0 && (
        <div className="ff-tile-grid ff-tile-grid--3">
          <div className="ff-tile ff-tile--accent">
            <div className="ff-tile__head">
              <span className="ff-tile__label">Active subscriptions</span>
            </div>
            <p className="ff-tile__value">{activeCount}</p>
            <span className="ff-tile__sub">{list.length - activeCount} paused / cancelled</span>
          </div>
          <div className="ff-tile ff-tile--expense">
            <div className="ff-tile__head">
              <span className="ff-tile__label">Monthly cost</span>
            </div>
            <p className="ff-tile__value">
              <span className="currency">₨</span>
              {formatPKR(monthlyCost, { showSymbol: false })}
            </p>
            <span className="ff-tile__sub">Normalised across cycles</span>
          </div>
          <div className="ff-tile ff-tile--warning">
            <div className="ff-tile__head">
              <span className="ff-tile__label">Due within 7 days</span>
            </div>
            <p className="ff-tile__value">{dueSoon}</p>
            <span className="ff-tile__sub">
              {dueSoon === 0 ? "Nothing renewing soon" : "Heads up — pay or pause"}
            </span>
          </div>
        </div>
      )}

      {isLoading ? (
        <LoadingOverlay rows={4} />
      ) : list.length === 0 ? (
        <FallBackState
          icon={CreditCard}
          title="No subscriptions"
          description="Netflix, gym, cloud hosting — add anything that bills on a schedule."
          action={
            <Button variant="gold" onClick={() => setOpen(true)}>
              <Plus className="h-4 w-4" />
              Add one
            </Button>
          }
        />
      ) : (
        <div className="ff-card-grid ff-card-grid--2 ff-stagger">
          {list.map((s) => (
            <article key={s.id} className="rounded-2xl border border-line-strong bg-surface p-6">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-display text-xl">{s.name}</h3>
                  <p className="font-mono text-[10px] uppercase text-muted mt-1">
                    {s.billingCycle} · {s.category}
                  </p>
                </div>
                <Badge tone={statusTone(s.status)} dot>
                  {s.status}
                </Badge>
              </div>
              <p className="font-display text-2xl mt-4 tabular">
                <span className="text-muted text-lg mr-1">₨</span>
                {formatPKR(s.amount, { showSymbol: false })}
              </p>
              <p className="text-sm text-muted mt-2">
                Next renewal · {format(new Date(s.nextRenewal), "dd MMM yyyy")}
              </p>
              <div className="flex flex-wrap gap-2 mt-6">
                {s.status === "active" && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => void onPay(s.id)}
                    loading={pay.isPending}
                  >
                    <CheckCircle className="h-3.5 w-3.5" />
                    Mark paid
                  </Button>
                )}
                <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(s)}>
                  Edit
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-terra"
                  onClick={() => void onDelete(s.id)}
                >
                  Delete
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}

      <Modal
        open={open}
        onOpenChange={setOpen}
        title="New subscription"
        description="Recurring charge from a wallet."
      >
        <SubscriptionForm onDone={() => setOpen(false)} />
      </Modal>

      <Modal
        open={!!editing}
        onOpenChange={(v) => !v && setEditing(null)}
        title="Edit subscription"
        description="Update amount, cycle, or renewal date."
      >
        {editing && <SubscriptionForm editing={editing} onDone={() => setEditing(null)} />}
      </Modal>
    </PageLayout>
  );
};

export default SubscriptionsView;
