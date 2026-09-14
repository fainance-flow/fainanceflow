"use client";

import { useEffect } from "react";
import { flushOfflineQueue } from "@lib/flush-offline-queue";

/** Retries any expenses/income saved while offline as soon as the connection returns. */
export default function OfflineSyncManager(): null {
  useEffect(() => {
    void flushOfflineQueue();

    const onOnline = () => void flushOfflineQueue();
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, []);

  return null;
}
