import { http } from "../../shared/api/http";
import type { ApiResponse } from "../../shared/types/api";
import type { LoginRequest, LoginResponse, RegisterRequest } from "../../shared/types/auth";

export async function loginRequest(payload: LoginRequest) {
  const normalizedPayload = {
    ...payload,
    email: payload.email.trim().toLowerCase()
  };
  const { data } = await http.post<ApiResponse<LoginResponse>>("/auth/login", normalizedPayload);
  return data.data;
}

export async function getCurrentUserRequest() {
  const { data } = await http.get<ApiResponse<LoginResponse>>("/auth/me");
  return data.data;
}

export async function logoutRequest() {
  const { data } = await http.post<ApiResponse<string>>("/auth/logout");
  return data.data;
}

export async function registerRequest(payload: RegisterRequest) {
  const normalizedPayload = {
    firstName: payload.firstName.trim(),
    lastName: payload.lastName.trim(),
    email: payload.email.trim().toLowerCase(),
    password: payload.password
  };
  const { data } = await http.post<ApiResponse<string>>("/auth/register", normalizedPayload);
  return data;
}

export async function forgotPasswordRequest(email: string) {
  const { data } = await http.post<ApiResponse<string>>("/auth/forget-password", null, {
    params: { email: email.trim().toLowerCase() }
  });
  return data.data;
}

export async function resetPasswordRequest(token: string, password: string, confirmPassword: string) {
  const { data } = await http.post<ApiResponse<string>>(
    "/auth/reset-password",
    { newPassword: password, confirmPassword },
    { params: { token } }
  );
  return data.data;
}

export async function changePasswordRequest(payload: {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}) {
  const { data } = await http.post<ApiResponse<string>>("/auth/change-password", payload);
  return data.data;
}
