import axios from "axios";
import type { ApiResponse } from "../types/api";
import type { LoginResponse } from "../types/auth";
import { clearAuthTokens, getAccessToken, getRefreshToken, setAuthTokens } from "./tokenStorage";

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
  baseURL: API_BASE_URL
});

let isRefreshing = false;
let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    throw new Error("Refresh token not found");
  }

  const { data } = await axios.post<ApiResponse<LoginResponse>>(
    `${API_BASE_URL}/auth/refresh-token`,
    null,
    { params: { refreshToken } }
  );

  const payload = data.data;
  setAuthTokens({
    accessToken: payload.accessToken,
    refreshToken: payload.refreshToken,
    email: payload.email,
    fullName: `${payload.firstName} ${payload.lastName}`.trim()
  });

  return payload.accessToken;
}

http.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

http.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status !== 401 || originalRequest?._retry) {
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
      const nextAccessToken = await refreshPromise;
      originalRequest.headers.Authorization = `Bearer ${nextAccessToken}`;
      return http(originalRequest);
    } catch (refreshError) {
      clearAuthTokens();
      window.location.href = "/login";
      return Promise.reject(refreshError);
    }
  }
);
