const ACCESS_TOKEN_KEY = "skanproverka.accessToken";
const REFRESH_TOKEN_KEY = "skanproverka.refreshToken";
const USER_EMAIL_KEY = "skanproverka.userEmail";
const USER_NAME_KEY = "skanproverka.userName";

export function getAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setAuthTokens(payload: {
  accessToken: string;
  refreshToken: string;
  email: string;
  fullName: string;
}) {
  localStorage.setItem(ACCESS_TOKEN_KEY, payload.accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, payload.refreshToken);
  localStorage.setItem(USER_EMAIL_KEY, payload.email);
  localStorage.setItem(USER_NAME_KEY, payload.fullName);
}

export function clearAuthTokens() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_EMAIL_KEY);
  localStorage.removeItem(USER_NAME_KEY);
}

export function getStoredUser() {
  const email = localStorage.getItem(USER_EMAIL_KEY);
  const fullName = localStorage.getItem(USER_NAME_KEY);
  if (!email || !fullName) return null;
  return { email, fullName };
}
