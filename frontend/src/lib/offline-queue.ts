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

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) {
        req.result.createObjectStore(STORE, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function withStore<T>(
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const request = fn(tx.objectStore(STORE));
    tx.oncomplete = () => resolve(request.result);
    tx.onerror = () => reject(tx.error);
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
  return withStore("readonly", (store) => store.getAll());
}

export async function removeQueuedTransaction(id: string): Promise<void> {
  if (!hasIndexedDb()) return;
  await withStore("readwrite", (store) => store.delete(id));
}
