import {
  createSubscription as storeCreate,
  deleteSubscription as storeDelete,
  listSubscriptions,
  markSubscriptionPaid as storeMarkPaid,
  updateSubscription as storeUpdate,
  type SubscriptionStored,
} from "@/lib/finance-store";
import type { Subscription, SubscriptionBillingCycle, SubscriptionStatus } from "@utils/types";

function mapRow(r: SubscriptionStored): Subscription {
  return {
    id: r.id,
    name: r.name,
    amount: r.amount,
    billingCycle: r.billingCycle,
    nextRenewal: r.nextRenewal,
    category: r.category,
    walletId: r.walletId,
    status: r.status,
    createdAt: r.createdAt,
  };
}

export type CreateSubscriptionPayload = {
  name: string;
  amount: number;
  billingCycle: SubscriptionBillingCycle;
  nextRenewal: string;
  category: string;
  walletId: string;
  status: SubscriptionStatus;
};

export const fetchSubscriptions = async (): Promise<{ data: { subscriptions: Subscription[] } }> => ({
  data: { subscriptions: listSubscriptions().map(mapRow) },
});

export const createSubscription = async (
  payload: CreateSubscriptionPayload
): Promise<{ data: { subscription: Subscription } }> => {
  const row = storeCreate({
    name: payload.name,
    amount: payload.amount,
    billingCycle: payload.billingCycle,
    nextRenewal: payload.nextRenewal,
    category: payload.category,
    walletId: payload.walletId,
    status: payload.status,
  });
  return { data: { subscription: mapRow(row) } };
};

export const updateSubscription = async (
  id: string,
  patch: Partial<CreateSubscriptionPayload>
): Promise<{ data: { subscription: Subscription } }> => {
  const row = storeUpdate(id, patch);
  if (!row) throw new Error("Subscription not found");
  return { data: { subscription: mapRow(row) } };
};

export const deleteSubscription = async (id: string): Promise<{ data: { ok: true } }> => {
  storeDelete(id);
  return { data: { ok: true } };
};

export const paySubscription = async (id: string): Promise<{ data: { ok: true } }> => {
  storeMarkPaid(id);
  return { data: { ok: true } };
};
