"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { me, logout as logoutRequest } from "@services/auth";
import { isBrowserOffline } from "@lib/is-offline";
import { tokenStore } from "@libs/axios";
import { useAppDispatch, useAppSelector } from "@hooks/useTypedRedux";
import { authClear, authStart, authSuccess } from "@store/slices/authSlice";
import {
  cacheUser,
  clearCachedUser,
  clearLocalSession,
  getCachedUser,
  isLocalSession,
  LOCAL_OFFLINE_USER,
  setLocalSession,
} from "@/lib/local-session";

/** No response at all reached us — offline, DNS failure, timeout — as opposed to a real 401. */
function isOfflineError(err: unknown): boolean {
  return isAxiosError(err) && !err.response;
}

export const useHydrateUser = (): void => {
  const dispatch = useAppDispatch();
  const status = useAppSelector((s) => s.auth.status);

  useEffect(() => {
    if (status !== "idle") return;
    if (isLocalSession()) {
      dispatch(authSuccess(LOCAL_OFFLINE_USER));
      return;
    }
    const token = tokenStore.getAccess();
    if (!token) {
      dispatch(authClear());
      return;
    }
    if (isBrowserOffline()) {
      // No network interface at all — don't wait out a doomed /auth/me call.
      const cached = getCachedUser();
      if (cached) {
        dispatch(authSuccess(cached));
        return;
      }
    }
    dispatch(authStart());
    me()
      .then((res) => {
        dispatch(authSuccess(res.data.user));
        cacheUser(res.data.user);
      })
      .catch((err) => {
        // Can't reach the server to verify the token — that's not the same as the
        // token being invalid. Trust the last known user instead of logging out a
        // real session just because the phone happens to be offline right now.
        if (isOfflineError(err)) {
          const cached = getCachedUser();
          if (cached) {
            dispatch(authSuccess(cached));
            return;
          }
        }
        tokenStore.clear();
        clearCachedUser();
        dispatch(authClear());
      });
  }, [dispatch, status]);
};

export const useRequireAuth = (): "idle" | "authenticating" | "authenticated" | "anonymous" => {
  const router = useRouter();
  const status = useAppSelector((s) => s.auth.status);
  useHydrateUser();

  useEffect(() => {
    if (status === "anonymous") {
      router.replace("/login");
    }
  }, [status, router]);

  return status;
};

export const useLogout = (): (() => Promise<void>) => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const qc = useQueryClient();
  return async (): Promise<void> => {
    try {
      await logoutRequest();
    } catch {
      // swallowed — interceptor handles transport errors
    }
    tokenStore.clear();
    clearLocalSession();
    clearCachedUser();
    dispatch(authClear());
    qc.clear();
    router.replace("/login");
  };
};

/** Enter local-only mode without API credentials. */
export const useContinueOffline = (): (() => void) => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  return (): void => {
    setLocalSession();
    dispatch(authSuccess(LOCAL_OFFLINE_USER));
    router.replace("/dashboard");
  };
};
