import axios from "@/lib/axios";
import {
  mapApiAccountToWallet,
  walletTypeToAccountType,
  type ApiBankAccount,
} from "@/lib/finance-api-mappers";
import type { Wallet, WalletType } from "@/utils/types";

export type CreateAccountPayload = {
  name: string;
  type: WalletType;
  balance: number;
  currency?: string;
  color?: string;
  icon?: string;
};

export type UpdateAccountPayload = Partial<CreateAccountPayload>;

export async function fetchAccounts(): Promise<Wallet[]> {
  const { data } = await axios.get<{ accounts: ApiBankAccount[] }>("/accounts");
  return data.accounts.map((a) => mapApiAccountToWallet(a));
}

export async function createAccount(payload: CreateAccountPayload): Promise<Wallet> {
  const { data } = await axios.post<{ account: ApiBankAccount }>("/accounts", {
    bankName: payload.name.trim(),
    accountType: walletTypeToAccountType(payload.type),
    balance: payload.balance,
    color: payload.color ?? "#C9A961",
    icon: payload.icon ?? "wallet",
  });
  return mapApiAccountToWallet(data.account, payload.currency ?? "PKR");
}

export async function updateAccount(id: string, payload: UpdateAccountPayload): Promise<Wallet> {
  const body: Record<string, unknown> = {};
  if (payload.name !== undefined) body.bankName = payload.name.trim();
  if (payload.type !== undefined) body.accountType = walletTypeToAccountType(payload.type);
  if (payload.balance !== undefined) body.balance = payload.balance;
  if (payload.color !== undefined) body.color = payload.color;
  if (payload.icon !== undefined) body.icon = payload.icon;
  const { data } = await axios.put<{ account: ApiBankAccount }>(`/accounts/${id}`, body);
  return mapApiAccountToWallet(data.account, payload.currency ?? "PKR");
}

export async function deleteAccount(id: string): Promise<void> {
  await axios.delete(`/accounts/${id}`);
}
