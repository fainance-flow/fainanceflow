export type QueuedTransactionPayload = {
  bankAccountId: string;
  type: "income" | "expense";
  amount: number;
  category: string;
  description?: string;
  date: string;
  tags?: string[];
};

export type QueuedTransaction = {
  id: string;
  payload: QueuedTransactionPayload;
  wallet?: { id: string; name: string; color: string; icon: string };
  createdAt: string;
};

const DB_NAME = "financeflow-offline";
const DB_VERSION = 1;
const STORE = "pending-transactions";
const OP_TIMEOUT_MS = 5000;

/**
 * Wraps a callback that reports success/failure via resolve/reject with a hard
 * timeout, so a stuck IndexedDB request can never hang forever. Concretely:
 * `indexedDB.open()` fires neither `onsuccess` nor `onerror` if it's blocked by
 * another connection still open at a different version (a stale tab, or a
 * leftover worker from a previous install) — without this, that leaves the
 * "Save transaction" button spinning indefinitely with no error, ever.
 */
function withTimeout<T>(
  label: string,
  executor: (resolve: (value: T) => void, reject: (reason: unknown) => void) => void
): Promise<T> {
  return new Promise((resolve, reject) => {
    let settled = false;
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      reject(new Error(`${label} timed out`));
    }, OP_TIMEOUT_MS);

    executor(
      (value) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve(value);
      },
      (reason) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        reject(reason);
      }
    );
  });
}

function openDb(): Promise<IDBDatabase> {
  return withTimeout("IndexedDB open", (resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) {
        req.result.createObjectStore(STORE, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("IndexedDB open failed"));
    req.onblocked = () => reject(new Error("IndexedDB open blocked by another connection"));
  });
}

async function withStore<T>(
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
  const db = await openDb();
  return withTimeout("IndexedDB transaction", (resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const request = fn(tx.objectStore(STORE));
    tx.oncomplete = () => resolve(request.result);
    tx.onerror = () => reject(tx.error ?? new Error("IndexedDB transaction failed"));
    tx.onabort = () => reject(tx.error ?? new Error("IndexedDB transaction aborted"));
  });
}

function hasIndexedDb(): boolean {
  return typeof indexedDB !== "undefined";
}

export async function enqueueTransaction(item: QueuedTransaction): Promise<void> {
  if (!hasIndexedDb()) return;
  await withStore("readwrite", (store) => store.put(item));
}

export async function listQueuedTransactions(): Promise<QueuedTransaction[]> {
  if (!hasIndexedDb()) return [];
  try {
    return await withStore("readonly", (store) => store.getAll());
  } catch {
    // Reading the queue must never block showing the transactions list itself.
    return [];
  }
}

export async function removeQueuedTransaction(id: string): Promise<void> {
  if (!hasIndexedDb()) return;
  await withStore("readwrite", (store) => store.delete(id));
}
