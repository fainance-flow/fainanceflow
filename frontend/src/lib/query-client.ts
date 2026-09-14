import { QueryClient } from "@tanstack/react-query";

/**
 * Module-level singleton so non-React modules (services/transactions.ts,
 * flush-offline-queue.ts) can read/invalidate cached data without a hook.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
    mutations: { retry: 0 },
  },
});
