"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { me, logout as logoutRequest } from "@services/auth";
import { tokenStore } from "@libs/axios";
import { useAppDispatch, useAppSelector } from "@hooks/useTypedRedux";
import { authClear, authStart, authSuccess } from "@store/slices/authSlice";
import {
  clearLocalSession,
  isLocalSession,
  LOCAL_OFFLINE_USER,
  setLocalSession,
} from "@/lib/local-session";

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
    dispatch(authStart());
    me()
      .then((res) => dispatch(authSuccess(res.data.user)))
      .catch(() => {
        tokenStore.clear();
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
