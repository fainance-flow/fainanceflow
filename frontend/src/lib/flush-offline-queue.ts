import { toast } from "sonner";
import axios from "@libs/axios";
import { queryClient } from "@lib/query-client";
import { queryKeys } from "@hooks/queryKeys";
import {
  listQueuedTransactions,
  removeQueuedTransaction,
  type QueuedTransaction,
} from "@lib/offline-queue";

let flushing = false;

function toApiBody(payload: QueuedTransaction["payload"]) {
  return {
    bankAccountId: payload.bankAccountId,
    type: payload.type,
    amount: payload.amount,
    category: payload.category,
    description: payload.description,
    date: new Date(`${payload.date.slice(0, 10)}T12:00:00`),
    tags: payload.tags ?? [],
  };
}

function invalidateFinanceQueries(): void {
  queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all });
  queryClient.invalidateQueries({ queryKey: queryKeys.accounts.all });
  queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.summary });
  queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.chart });
  queryClient.invalidateQueries({ queryKey: ["budgets"] });
}

/** Replays queued offline expenses/income in order; stops at the first failure so retries stay in order. */
export async function flushOfflineQueue(): Promise<void> {
  if (flushing) return;
  if (typeof navigator !== "undefined" && !navigator.onLine) return;

  const queued = await listQueuedTransactions();
  if (queued.length === 0) return;

  flushing = true;
  let synced = 0;
  try {
    for (const item of queued) {
      try {
        await axios.post("/transactions", toApiBody(item.payload));
        await removeQueuedTransaction(item.id);
        synced++;
      } catch {
        break;
      }
    }
  } finally {
    flushing = false;
    if (synced > 0) {
      invalidateFinanceQueries();
      toast.success(
        synced === 1 ? "1 offline entry sync ho gayi." : `${synced} offline entries sync ho gayi.`
      );
    }
  }
}
