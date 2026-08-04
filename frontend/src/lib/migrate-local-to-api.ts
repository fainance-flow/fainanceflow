import axios from "@libs/axios";
import { mutate, readState } from "@/lib/finance-store";
import { walletTypeToAccountType } from "@/lib/finance-api-mappers";

function migrateFlagKey(email: string): string {
  return `ff:migrated-to-cloud:${email}`;
}

/**
 * One-time copy of browser-only finance data into PostgreSQL after login.
 * Safe to skip if the server already has wallets or migration ran for this email.
 */
export async function migrateLocalFinanceToApi(email: string): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (localStorage.getItem(migrateFlagKey(email))) return false;

  try {
    const { data: remote } = await axios.get<{ accounts: unknown[] }>("/accounts");
    if (remote.accounts.length > 0) return false;

    const local = readState();
    if (local.wallets.length === 0) return false;

    const walletIdMap = new Map<string, string>();

    for (const w of local.wallets) {
      const { data } = await axios.post<{ account: { id: string } }>("/accounts", {
        bankName: w.name,
        accountType: walletTypeToAccountType(w.type),
        balance: w.openingBalance,
        color: w.color,
        icon: w.icon,
      });
      walletIdMap.set(w.id, data.account.id);
    }

    const txs = [...local.transactions]
      .filter((t) => !t.historical)
      .sort((a, b) => {
        const c = a.date.localeCompare(b.date);
        return c !== 0 ? c : a.createdAt.localeCompare(b.createdAt);
      });

    const seenTransfer = new Set<string>();

    for (const t of txs) {
      if (t.transferGroupId) {
        const gid = t.transferGroupId;
        if (seenTransfer.has(gid)) continue;
        seenTransfer.add(gid);
        const legs = local.transactions.filter((x) => x.transferGroupId === gid && !x.historical);
        const out = legs.find((x) => x.transferDirection === "out");
        const inn = legs.find((x) => x.transferDirection === "in");
        if (!out || !inn) continue;
        const fromId = walletIdMap.get(out.walletId);
        const toId = walletIdMap.get(inn.walletId);
        if (!fromId || !toId) continue;
        await axios.post("/transactions/transfer", {
          fromBankAccountId: fromId,
          toBankAccountId: toId,
          amount: out.amount,
          description: out.description ?? undefined,
          date: new Date(`${out.date.slice(0, 10)}T12:00:00`),
        });
        continue;
      }

      const bankAccountId = walletIdMap.get(t.walletId);
      if (!bankAccountId) continue;

      await axios.post("/transactions", {
        bankAccountId,
        type: t.type,
        amount: t.amount,
        category: t.category,
        description: t.description ?? undefined,
        date: new Date(`${t.date.slice(0, 10)}T12:00:00`),
        tags: t.tags ?? [],
      });
    }

    for (const b of local.budgets) {
      await axios.post("/budgets", {
        category: b.category,
        monthlyLimit: b.monthlyLimit,
        month: b.month,
        year: b.year,
      });
    }

    mutate((draft) => {
      for (const s of draft.subscriptions) {
        const nid = walletIdMap.get(s.walletId);
        if (nid) s.walletId = nid;
      }
    });

    localStorage.setItem(migrateFlagKey(email), "1");
    return true;
  } catch (err) {
    console.error("migrateLocalFinanceToApi:", err);
    return false;
  }
}
