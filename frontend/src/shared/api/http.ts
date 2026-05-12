import axios from "axios";
import type { ApiResponse } from "../types/api";
import type { LoginResponse } from "../types/auth";

const AUTH_SESSION_EXPIRED_EVENT = "auth:session-expired";

const rawApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();

function resolveApiBaseUrl() {
  if (!rawApiBaseUrl) {
    return "/api";
  }

  if (typeof window !== "undefined" && window.location.protocol === "https:" && rawApiBaseUrl.startsWith("http://")) {
    return "/api";
  }

  return rawApiBaseUrl;
}

const API_BASE_URL = resolveApiBaseUrl();

export const http = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true
});

let isRefreshing = false;
let refreshPromise: Promise<void> | null = null;

async function refreshAccessToken() {
  await axios.post<ApiResponse<LoginResponse>>(
    `${API_BASE_URL}/auth/refresh-token`,
    null,
    { withCredentials: true }
  );
}

http.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const requestUrl = originalRequest?.url ?? "";
    const isRefreshRequest = typeof requestUrl === "string" && requestUrl.includes("/auth/refresh-token");
    const isLoginRequest = typeof requestUrl === "string" && requestUrl.includes("/auth/login");

    if (error.response?.status !== 401 || originalRequest?._retry || isRefreshRequest || isLoginRequest) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    if (!isRefreshing) {
      isRefreshing = true;
      refreshPromise = refreshAccessToken().finally(() => {
        isRefreshing = false;
      });
    }

    try {
      await refreshPromise;
      return http(originalRequest);
    } catch (refreshError) {
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event(AUTH_SESSION_EXPIRED_EVENT));
      }
      return Promise.reject(refreshError);
    }
  }
);

export { AUTH_SESSION_EXPIRED_EVENT };
