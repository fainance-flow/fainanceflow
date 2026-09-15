import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";

const baseURL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

const instance = axios.create({
  baseURL,
  withCredentials: false,
  timeout: 15_000,
});

const ACCESS_KEY = "ff:accessToken";
const REFRESH_KEY = "ff:refreshToken";

export const tokenStore = {
  getAccess: (): string | null =>
    typeof window === "undefined" ? null : localStorage.getItem(ACCESS_KEY),
  getRefresh: (): string | null =>
    typeof window === "undefined" ? null : localStorage.getItem(REFRESH_KEY),
  set: (access: string, refresh: string): void => {
    if (typeof window === "undefined") return;
    localStorage.setItem(ACCESS_KEY, access);
    localStorage.setItem(REFRESH_KEY, refresh);
  },
  clear: (): void => {
    if (typeof window === "undefined") return;
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },
};

instance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = tokenStore.getAccess();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

/** No response at all reached us — offline, DNS failure, timeout — as opposed to a real 4xx/5xx. */
function isOfflineError(err: unknown): boolean {
  return axios.isAxiosError(err) && !err.response;
}

type RefreshResult = { token: string | null; offline: boolean };

let refreshing: Promise<RefreshResult> | null = null;

const refreshAccessToken = async (): Promise<RefreshResult> => {
  const refreshToken = tokenStore.getRefresh();
  if (!refreshToken) return { token: null, offline: false };
  try {
    // Bare axios (not `instance`) to skip these same interceptors — but it still
    // needs its own timeout, since without one this can hang indefinitely on a
    // weak connection instead of failing fast like every other request does.
    const { data } = await axios.post(
      `${baseURL}/auth/refresh`,
      { refreshToken },
      { timeout: 15_000 }
    );
    tokenStore.set(data.accessToken, data.refreshToken);
    return { token: data.accessToken as string, offline: false };
  } catch (err) {
    if (isOfflineError(err)) {
      // Couldn't reach the server to check — that's not the same as the refresh
      // token being invalid. Keep it intact so this can be retried once back online
      // instead of forcing a logout just because the network is down right now.
      return { token: null, offline: true };
    }
    tokenStore.clear();
    return { token: null, offline: false };
  }
};

instance.interceptors.response.use(
  (r) => r,
  async (error: AxiosError) => {
    const original = error.config as RetriableConfig | undefined;
    if (error.response?.status === 401 && original && !original._retry) {
      original._retry = true;
      refreshing ??= refreshAccessToken().finally(() => {
        refreshing = null;
      });
      const { token, offline } = await refreshing;
      if (token) {
        original.headers.Authorization = `Bearer ${token}`;
        return instance.request(original);
      }
      if (offline) {
        // Reshape into a network-style error (no `response`) so every downstream
        // isOfflineError()-style check (useHydrateUser, createTransaction, ...)
        // reads this the same way it reads any other offline failure, instead of
        // as a real 401 — we couldn't verify the session, we don't know it's invalid.
        error.response = undefined;
        return Promise.reject(error);
      }
      if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default instance;
