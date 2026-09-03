import type { Transaction, TransactionType, Wallet, WalletType } from "@/utils/types";
import { parseMoney } from "@/utils/currency";

export const INTERNAL_TRANSFER_TAG = "__ff_xfer__";

export type ApiBankAccount = {
  id: string;
  bankName: string;
  accountType: "savings" | "current" | "wallet";
  balance: unknown;
  color?: string;
  icon?: string;
  createdAt?: string;
};

export type ApiTransaction = {
  id: string;
  bankAccountId?: string;
  type: TransactionType;
  amount: unknown;
  category: string;
  description: string | null;
  date: string;
  tags?: string[];
  account?: { id: string; bankName: string; color: string; icon: string } | null;
};

export function walletTypeToAccountType(t: WalletType): "savings" | "current" | "wallet" {
  if (t === "savings") return "savings";
  if (t === "cash") return "wallet";
  return "current";
}

export function accountTypeToWalletType(t: string): WalletType {
  if (t === "savings") return "savings";
  if (t === "wallet") return "cash";
  return "bank";
}

export function mapApiAccountToWallet(a: ApiBankAccount, currency = "PKR"): Wallet {
  const bal = parseMoney(a.balance);
  // Dashboard summary omits createdAt — guard so we don't throw on undefined.
  let created = new Date().toISOString();
  if (typeof a.createdAt === "string" && a.createdAt) {
    created = a.createdAt;
  } else if (a.createdAt) {
    const d = new Date(a.createdAt);
    if (!Number.isNaN(d.getTime())) created = d.toISOString();
  }
  return {
    id: a.id,
    name: a.bankName,
    type: accountTypeToWalletType(a.accountType),
    balance: bal,
    openingBalance: bal,
    currency,
    color: a.color ?? "#C9A961",
    icon: a.icon ?? "wallet",
    createdAt: created,
    hasPin: false,
  };
}

export function mapApiTransactionToUi(raw: ApiTransaction): Transaction {
  const amount = parseMoney(raw.amount);
  const tags = raw.tags ?? [];
  const pairTag = tags.find((x) => x.startsWith("ff-pair:"));
  const pairId = pairTag?.slice("ff-pair:".length);
  const walletMini = raw.account
    ? {
        id: raw.account.id,
        name: raw.account.bankName,
        color: raw.account.color,
        icon: raw.account.icon,
      }
    : undefined;
  let isoDay = new Date().toISOString().slice(0, 10);
  if (typeof raw.date === "string" && raw.date) {
    isoDay = raw.date.slice(0, 10);
  } else if (raw.date) {
    const d = new Date(raw.date);
    if (!Number.isNaN(d.getTime())) isoDay = d.toISOString().slice(0, 10);
  }

  if (pairId && tags.includes(INTERNAL_TRANSFER_TAG)) {
    return {
      id: raw.id,
      type: "transfer",
      amount,
      category: raw.category,
      description: raw.description,
      date: isoDay,
      tags,
      transferGroupId: pairId,
      transferDirection: raw.type === "expense" ? "out" : "in",
      wallet: walletMini,
    };
  }

  return {
    id: raw.id,
    type: raw.type,
    amount,
    category: raw.category,
    description: raw.description,
    date: isoDay,
    tags,
    wallet: walletMini,
  };
}
