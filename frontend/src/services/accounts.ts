import axios from "@libs/axios";
import {
  mapApiAccountToWallet,
  walletTypeToAccountType,
  type ApiBankAccount,
} from "@/lib/finance-api-mappers";
import { shouldUseCloudFinance } from "@/lib/finance-backend-mode";
import {
  createWallet,
  deleteWallet,
  listWallets,
  updateWallet,
} from "@/lib/finance-store";
import type { Wallet, WalletType } from "@utils/types";

export type CreateAccountPayload = {
  name: string;
  type: WalletType;
  balance: number;
  currency?: string;
  color?: string;
  icon?: string;
};

export type UpdateAccountPayload = Partial<CreateAccountPayload & { pin: string }>;

export const fetchAccounts = async (): Promise<{ data: { accounts: Wallet[] } }> => {
  if (!shouldUseCloudFinance()) {
    return { data: { accounts: listWallets() } };
  }
  const { data } = await axios.get<{ accounts: ApiBankAccount[] }>("/accounts");
  return { data: { accounts: data.accounts.map((a) => mapApiAccountToWallet(a)) } };
};

export const createAccount = async (
  payload: CreateAccountPayload
): Promise<{ data: { account: Wallet } }> => {
  if (!shouldUseCloudFinance()) {
    const account = createWallet({
      name: payload.name,
      type: payload.type,
      balance: payload.balance,
      currency: payload.currency ?? "PKR",
      color: payload.color ?? "#C9A961",
      icon: payload.icon ?? "wallet",
    });
    return { data: { account } };
  }

  const { data } = await axios.post<{ account: ApiBankAccount }>("/accounts", {
    bankName: payload.name.trim(),
    accountType: walletTypeToAccountType(payload.type),
    balance: payload.balance,
    color: payload.color ?? "#C9A961",
    icon: payload.icon ?? "wallet",
  });
  return { data: { account: mapApiAccountToWallet(data.account, payload.currency ?? "PKR") } };
};

export const updateAccount = async (
  id: string,
  payload: UpdateAccountPayload
): Promise<{ data: { account: Wallet } }> => {
  if (!shouldUseCloudFinance()) {
    const account = updateWallet(id, {
      name: payload.name,
      type: payload.type,
      openingBalance: payload.balance,
      currency: payload.currency,
      color: payload.color,
      icon: payload.icon,
      pin: payload.pin,
    });
    if (!account) throw new Error("Wallet not found");
    return { data: { account } };
  }

  const body: Record<string, unknown> = {};
  if (payload.name !== undefined) body.bankName = payload.name.trim();
  if (payload.type !== undefined) body.accountType = walletTypeToAccountType(payload.type);
  if (payload.balance !== undefined) body.balance = payload.balance;
  if (payload.color !== undefined) body.color = payload.color;
  if (payload.icon !== undefined) body.icon = payload.icon;

  const { data } = await axios.put<{ account: ApiBankAccount }>(`/accounts/${id}`, body);
  return {
    data: { account: mapApiAccountToWallet(data.account, payload.currency ?? "PKR") },
  };
};

export const deleteAccount = async (id: string): Promise<{ data: { ok: true } }> => {
  if (!shouldUseCloudFinance()) {
    deleteWallet(id);
    return { data: { ok: true } };
  }
  await axios.delete(`/accounts/${id}`);
  return { data: { ok: true } };
};
