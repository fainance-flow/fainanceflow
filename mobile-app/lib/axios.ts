import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import * as SecureStore from "expo-secure-store";
import { getApiUrl } from "@/lib/api-config";
import { store } from "@/store/index";
import { authClear } from "@/store/slices/authSlice";

// SecureStore only allows alphanumeric, ".", "-", "_" — no ":" (unlike web localStorage).
const ACCESS_KEY = "ff_accessToken";
const REFRESH_KEY = "ff_refreshToken";

/**
 * SecureStore is async, unlike web's localStorage, so we keep an in-memory
 * mirror to avoid an await on every request. `hydrate()` is called once by
 * hooks/useAuthBootstrap.ts at app start so the cache is warm before the
 * first screen renders; every set()/clear() below keeps it in sync after.
 */
let accessCache: string | null = null;
let refreshCache: string | null = null;

export const tokenStore = {
  getAccess: async (): Promise<string | null> => {
    if (accessCache !== null) return accessCache;
    accessCache = await SecureStore.getItemAsync(ACCESS_KEY);
    return accessCache;
  },
  getRefresh: async (): Promise<string | null> => {
    if (refreshCache !== null) return refreshCache;
    refreshCache = await SecureStore.getItemAsync(REFRESH_KEY);
    return refreshCache;
  },
  set: async (access: string, refresh: string): Promise<void> => {
    accessCache = access;
    refreshCache = refresh;
    await Promise.all([
      SecureStore.setItemAsync(ACCESS_KEY, access),
      SecureStore.setItemAsync(REFRESH_KEY, refresh),
    ]);
  },
  clear: async (): Promise<void> => {
    accessCache = null;
    refreshCache = null;
    await Promise.all([
      SecureStore.deleteItemAsync(ACCESS_KEY).catch(() => undefined),
      SecureStore.deleteItemAsync(REFRESH_KEY).catch(() => undefined),
    ]);
  },
  /** Reads both tokens from disk once and warms the in-memory cache. Call at bootstrap. */
  hydrate: async (): Promise<{ access: string | null; refresh: string | null }> => {
    const [access, refresh] = await Promise.all([
      SecureStore.getItemAsync(ACCESS_KEY),
      SecureStore.getItemAsync(REFRESH_KEY),
    ]);
    accessCache = access;
    refreshCache = refresh;
    return { access, refresh };
  },
};

const instance = axios.create({
  baseURL: getApiUrl(),
  timeout: 15_000,
});

instance.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const token = await tokenStore.getAccess();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

let refreshing: Promise<string | null> | null = null;

const refreshAccessToken = async (): Promise<string | null> => {
  const refreshToken = await tokenStore.getRefresh();
  if (!refreshToken) return null;
  try {
    // Raw axios (not `instance`) — avoids re-entering this same interceptor.
    const { data } = await axios.post(`${getApiUrl()}/auth/refresh`, { refreshToken });
    await tokenStore.set(data.accessToken, data.refreshToken);
    return data.accessToken as string;
  } catch {
    await tokenStore.clear();
    return null;
  }
};

instance.interceptors.response.use(
  (r) => r,
  async (error: AxiosError) => {
    const original = error.config as RetriableConfig | undefined;
    const isRefreshCall = original?.url?.includes("/auth/refresh");
    if (error.response?.status === 401 && original && !original._retry && !isRefreshCall) {
      original._retry = true;
      refreshing ??= refreshAccessToken().finally(() => {
        refreshing = null;
      });
      const next = await refreshing;
      if (next) {
        original.headers.Authorization = `Bearer ${next}`;
        return instance.request(original);
      }
      // Unrecoverable: clear tokens and flip auth state to anonymous.
      // Route guards (app/index.tsx, (protected)/_layout.tsx) react to the
      // status change and redirect — no window.location equivalent needed.
      await tokenStore.clear();
      store.dispatch(authClear());
    }
    return Promise.reject(error);
  }
);

export default instance;
