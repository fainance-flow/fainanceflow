import { useEffect, useState } from "react";
import { tokenStore } from "@/lib/axios";
import { me } from "@/services/auth";
import { useAppDispatch } from "@/hooks/useTypedRedux";
import { authStart, authSuccess, authClear } from "@/store/slices/authSlice";

/**
 * Runs once at app start: warms the token cache from expo-secure-store, and
 * if an access token exists, validates it against GET /auth/me. Dispatches
 * the resulting auth status and exposes `hydrated` so the root layout knows
 * when it's safe to hide the splash screen and route guards know when it's
 * safe to redirect.
 */
export function useAuthBootstrap(): { hydrated: boolean } {
  const dispatch = useAppDispatch();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const { access } = await tokenStore.hydrate();

      if (!access) {
        if (!cancelled) {
          dispatch(authClear());
          setHydrated(true);
        }
        return;
      }

      dispatch(authStart());
      try {
        const res = await me();
        if (!cancelled) dispatch(authSuccess(res.data.user));
      } catch {
        await tokenStore.clear();
        if (!cancelled) dispatch(authClear());
      } finally {
        if (!cancelled) setHydrated(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [dispatch]);

  return { hydrated };
}
