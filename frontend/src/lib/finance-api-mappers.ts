import type { Transaction, TransactionType, Wallet, WalletType } from "@utils/types";

/** Same token as backend `INTERNAL_TRANSFER_TAG` — identifies paired wallet transfers. */
export const INTERNAL_TRANSFER_TAG = "__ff_xfer__";

export type ApiBankAccount = {
  id: string;
  bankName: string;
  accountType: "savings" | "current" | "wallet";
  balance: unknown;
  color: string;
  icon: string;
  createdAt: string;
};

export type ApiTxAccount = {
  id: string;
  bankName: string;
  color: string;
  icon: string;
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
  account?: ApiTxAccount | null;
};

export function parseMoney(v: unknown): number {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") return Number(v);
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

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
  const created =
    typeof a.createdAt === "string" ? a.createdAt : new Date(a.createdAt).toISOString();
  return {
    id: a.id,
    name: a.bankName,
    type: accountTypeToWalletType(a.accountType),
    balance: bal,
    openingBalance: bal,
    currency,
    color: a.color,
    icon: a.icon,
    createdAt: created,
    hasPin: false,
  };
}

function walletFromTxAccount(acc: ApiTxAccount): Pick<Wallet, "id" | "name" | "color" | "icon"> {
  return {
    id: acc.id,
    name: acc.bankName,
    color: acc.color,
    icon: acc.icon,
  };
}

function calendarKey(iso: string): string {
  return iso.slice(0, 10);
}

/** Normalize API transaction row for UI (lists + dashboard). */
export function mapApiTransactionToUi(raw: ApiTransaction): Transaction {
  const amount = parseMoney(raw.amount);
  const tags = raw.tags ?? [];
  const pairTag = tags.find((x) => x.startsWith("ff-pair:"));
  const pairId = pairTag?.slice("ff-pair:".length);
  const walletMini = raw.account != null ? walletFromTxAccount(raw.account) : undefined;

  const isoDay = calendarKey(
    typeof raw.date === "string" ? raw.date : new Date(raw.date).toISOString()
  );

  if (pairId && tags.includes(INTERNAL_TRANSFER_TAG)) {
    const direction = raw.type === "expense" ? "out" : "in";
    return {
      id: raw.id,
      type: "transfer",
      amount,
      category: raw.category,
      description: raw.description,
      date: isoDay,
      tags,
      transferGroupId: pairId,
      transferDirection: direction,
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
