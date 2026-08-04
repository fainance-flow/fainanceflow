import { readState } from "@/lib/finance-store";

function esc(s: string): string {
  return `"${s.replace(/"/g, '""')}"`;
}

/** Full backup: wallets, transactions, budgets, subscriptions, loans. */
export function downloadFullFinanceCsv(): void {
  const s = readState();
  const lines: string[] = [];

  lines.push("SECTION,wallets");
  lines.push("id,name,type,openingBalance,currency,color,icon,createdAt");
  for (const w of s.wallets) {
    lines.push(
      [w.id, w.name, w.type, w.openingBalance, w.currency, w.color, w.icon, w.createdAt]
        .map((x) => esc(String(x)))
        .join(",")
    );
  }

  lines.push("");
  lines.push("SECTION,transactions");
  lines.push(
    "id,walletId,type,amount,category,description,date,tags,transferGroupId,transferDirection,subscriptionId,loanId,createdAt"
  );
  for (const t of s.transactions) {
    lines.push(
      [
        t.id,
        t.walletId,
        t.type,
        t.amount,
        t.category,
        t.description ?? "",
        t.date,
        (t.tags ?? []).join(";"),
        t.transferGroupId ?? "",
        t.transferDirection ?? "",
        t.subscriptionId ?? "",
        t.loanId ?? "",
        t.createdAt,
      ]
        .map((x) => esc(String(x)))
        .join(",")
    );
  }

  lines.push("");
  lines.push("SECTION,budgets");
  lines.push("id,category,monthlyLimit,month,year");
  for (const b of s.budgets) {
    lines.push([b.id, b.category, b.monthlyLimit, b.month, b.year].map((x) => esc(String(x))).join(","));
  }

  lines.push("");
  lines.push("SECTION,subscriptions");
  lines.push("id,name,amount,billingCycle,nextRenewal,category,walletId,status,createdAt");
  for (const sub of s.subscriptions) {
    lines.push(
      [
        sub.id,
        sub.name,
        sub.amount,
        sub.billingCycle,
        sub.nextRenewal,
        sub.category,
        sub.walletId,
        sub.status,
        sub.createdAt,
      ]
        .map((x) => esc(String(x)))
        .join(",")
    );
  }

  lines.push("");
  lines.push("SECTION,loans");
  lines.push(
    "id,name,principalAmount,remainingBalance,interestRate,emiAmount,nextDueDate,lenderName,type,createdAt"
  );
  for (const L of s.loans) {
    lines.push(
      [
        L.id,
        L.name,
        L.principalAmount,
        L.remainingBalance,
        L.interestRate,
        L.emiAmount,
        L.nextDueDate,
        L.lenderName,
        L.type,
        L.createdAt,
      ]
        .map((x) => esc(String(x)))
        .join(",")
    );
  }

  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `financeflow-full-export-${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
