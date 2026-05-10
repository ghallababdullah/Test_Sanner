import { http } from "../../shared/api/http";
import type { ApiResponse } from "../../shared/types/api";
import type { LoginRequest, LoginResponse, RegisterRequest } from "../../shared/types/auth";

export async function loginRequest(payload: LoginRequest) {
  const { data } = await http.post<ApiResponse<LoginResponse>>("/auth/login", payload);
  return data.data;
}

export async function registerRequest(payload: RegisterRequest) {
  const { data } = await http.post<ApiResponse<string>>("/auth/register", payload);
  return data;
}

export async function forgotPasswordRequest(email: string) {
  const { data } = await http.post<ApiResponse<string>>("/auth/forget-password", null, { params: { email } });
  return data.data;
}

export async function resetPasswordRequest(token: string, password: string, confirmPassword: string) {
  const { data } = await http.post<ApiResponse<string>>(
    "/auth/reset-password",
    { password, confirmPassword },
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
