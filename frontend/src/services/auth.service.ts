import { apiClient } from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface RegisterPayload {
  firstName: string;
  lastName?: string;
  middleName?: string;
  email: string;
  phoneNumber?: string;
  password: string;
  roles?: string[];
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface ResetPasswordPayload {
  newPassword: string;
  confirmPassword: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  email: string;
  firstName: string;
  lastName?: string;
  message?: string;
}

export interface AuthResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
}

class AuthService {
  /**
   * Register new user
   */
  async register(payload: RegisterPayload): Promise<AuthResponse<string>> {
    try {
      const response = await apiClient.post<AuthResponse<string>>('/api/auth/register', payload);
      return response.data;
    } catch (error: any) {
      throw new Error(apiClient.getErrorMessage(error));
    }
  }

  /**
   * Login user
   */
  async login(payload: LoginPayload): Promise<AuthResponse<LoginResponse>> {
    try {
      const response = await apiClient.post<AuthResponse<LoginResponse>>('/api/auth/login', payload);
      const { data } = response.data;

      console.log('✅ Login successful for:', data.email);

      // Store tokens and user info
      // Backend now accepts email for all endpoints
      await AsyncStorage.setItem('accessToken', data.accessToken);
      await AsyncStorage.setItem('refreshToken', data.refreshToken);
      await AsyncStorage.setItem('userId', data.email);
      await AsyncStorage.setItem('userEmail', data.email);
      await AsyncStorage.setItem('firstName', data.firstName);
      if (data.lastName) {
        await AsyncStorage.setItem('lastName', data.lastName);
      }

      // Set auth header
      await apiClient.setAuthToken(data.accessToken);

      return response.data;
    } catch (error: any) {
      throw new Error(apiClient.getErrorMessage(error));
    }
  }

  /**
   * Verify email with token
   */
  async verifyEmail(token: string): Promise<AuthResponse<string>> {
    try {
      const response = await apiClient.get<AuthResponse<string>>('/api/auth/verify-email', {
        params: { token },
      });
      return response.data;
    } catch (error: any) {
      throw new Error(apiClient.getErrorMessage(error));
    }
  }

  /**
   * Request password reset email
   */
  async forgetPassword(email: string): Promise<AuthResponse<string>> {
    try {
      const response = await apiClient.post<AuthResponse<string>>(
        '/api/auth/forget-password',
        null,
        { params: { email } }
      );
      return response.data;
    } catch (error: any) {
      throw new Error(apiClient.getErrorMessage(error));
    }
  }

  /**
   * Reset password with token
   */
  async resetPassword(token: string, payload: ResetPasswordPayload): Promise<AuthResponse<string>> {
    try {
      const response = await apiClient.post<AuthResponse<string>>(
        '/api/auth/reset-password',
        payload,
        { params: { token } }
      );
      return response.data;
    } catch (error: any) {
      throw new Error(apiClient.getErrorMessage(error));
    }
  }

  /**
   * Refresh authentication token
   */
  async refreshToken(refreshToken: string): Promise<AuthResponse<LoginResponse>> {
    try {
      const response = await apiClient.post<AuthResponse<LoginResponse>>(
        '/api/auth/refresh-token',
        null,
        { params: { refreshToken } }
      );
      const { data } = response.data;

      // Store new tokens and email
      await AsyncStorage.setItem('accessToken', data.accessToken);
      await AsyncStorage.setItem('refreshToken', data.refreshToken);
      await AsyncStorage.setItem('userId', data.email);

      // Set auth header
      await apiClient.setAuthToken(data.accessToken);

      return response.data;
    } catch (error: any) {
      throw new Error(apiClient.getErrorMessage(error));
    }
  }

  /**
   * Logout user (clear tokens)
   */
  async logout(): Promise<void> {
    try {
      await AsyncStorage.removeItem('accessToken');
      await AsyncStorage.removeItem('refreshToken');
      await AsyncStorage.removeItem('userId');
      await AsyncStorage.removeItem('userEmail');
      await AsyncStorage.removeItem('firstName');
      await AsyncStorage.removeItem('lastName');
      await apiClient.clearAuthToken();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  }

  /**
   * Get stored access token
   */
  async getAccessToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('accessToken');
    } catch (error) {
      return null;
    }
  }

  /**
   * Get stored user info
   */
  async getUserInfo(): Promise<{ userId: string; userEmail: string; firstName: string; lastName?: string } | null> {
    try {
      const userId = await AsyncStorage.getItem('userId');
      const userEmail = await AsyncStorage.getItem('userEmail');
      const firstName = await AsyncStorage.getItem('firstName');
      const lastName = await AsyncStorage.getItem('lastName');

      if (userId && userEmail && firstName) {
        return { userId, userEmail, firstName, lastName: lastName || undefined };
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      return !!token;
    } catch (error) {
      return false;
    }
  }
}

export const authService = new AuthService();
export default authService;
