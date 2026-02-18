import axios, { AxiosInstance, AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Your backend laptop IP
const BACKEND_LAPTOP_IP = '192.168.0.12';
const BACKEND_PORT = '8080';

// Determine the correct base URL based on environment and platform
const getBaseUrl = (): string => {
  if (__DEV__) {
    // For development/testing across laptops
    return `http://${BACKEND_LAPTOP_IP}:${BACKEND_PORT}`;
  } else {
    // Production URL
    return 'https://your-production-api.com';
  }
};

const API_BASE_URL = getBaseUrl();

class ApiClient {
  private client: AxiosInstance;
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
    console.log('🌐 API Base URL:', this.baseURL); // This will help verify the URL

    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor - add auth token
    this.client.interceptors.request.use(
      async (config) => {
        try {
          const token = await AsyncStorage.getItem('accessToken');
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
          console.log('🚀 Request:', config.method?.toUpperCase(), config.url);
        } catch (error) {
          console.log('Error retrieving token:', error);
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor - handle auth errors
    this.client.interceptors.response.use(
      (response) => {
        console.log('✅ Response:', response.status, response.config.url);
        return response;
      },
      async (error: AxiosError) => {
        console.log('❌ Response Error:', error.message);
        console.log('❌ Status:', error.response?.status);
        console.log('❌ Data:', error.response?.data);
        
        const originalRequest = error.config as any;

        // If 401 and we have a refresh token, try to refresh
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const refreshToken = await AsyncStorage.getItem('refreshToken');
            if (!refreshToken) {
              throw new Error('No refresh token available');
            }

            console.log('🔄 Refreshing token...');
            
            // Call refresh endpoint
            const response = await axios.post(`${this.baseURL}/api/auth/refresh-token`, null, {
              params: { refreshToken },
            });

            const { data } = response;
            const newAccessToken = data.data.accessToken;
            const newRefreshToken = data.data.refreshToken;

            // Store new tokens
            await AsyncStorage.setItem('accessToken', newAccessToken);
            await AsyncStorage.setItem('refreshToken', newRefreshToken);

            // Retry original request
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            return this.client(originalRequest);
          } catch (refreshError) {
            console.log('Token refresh failed:', refreshError);
            // Logout user
            await AsyncStorage.removeItem('accessToken');
            await AsyncStorage.removeItem('refreshToken');
            throw new Error('Session expired. Please login again.');
          }
        }

        return Promise.reject(error);
      }
    );
  }

  /**
   * GET request
   */
  get<T>(url: string, config = {}) {
    return this.client.get<T>(url, config);
  }

  /**
   * POST request
   */
  post<T>(url: string, data?: any, config = {}) {
    return this.client.post<T>(url, data, config);
  }

  /**
   * PUT request
   */
  put<T>(url: string, data?: any, config = {}) {
    return this.client.put<T>(url, data, config);
  }

  /**
   * DELETE request
   */
  delete<T>(url: string, config = {}) {
    return this.client.delete<T>(url, config);
  }

  /**
   * PATCH request
   */
  patch<T>(url: string, data?: any, config = {}) {
    return this.client.patch<T>(url, data, config);
  }

  /**
   * Set authorization token
   */
  async setAuthToken(token: string) {
    try {
      await AsyncStorage.setItem('accessToken', token);
      this.client.defaults.headers.common.Authorization = `Bearer ${token}`;
    } catch (error) {
      console.error('Error setting auth token:', error);
    }
  }

  /**
   * Clear authorization token
   */
  async clearAuthToken() {
    try {
      await AsyncStorage.removeItem('accessToken');
      await AsyncStorage.removeItem('refreshToken');
      delete this.client.defaults.headers.common.Authorization;
    } catch (error) {
      console.error('Error clearing auth token:', error);
    }
  }

  /**
   * Get error message from response
   */
  getErrorMessage(error: any): string {
    console.log('🔍 Error details:', {
      status: error.response?.status,
      message: error.response?.data?.message,
      data: error.response?.data,
      error: error.message
    });

    if (error.response?.data?.message) {
      return error.response.data.message;
    }
    if (error.response?.data?.error) {
      return error.response.data.error;
    }
    if (error.response?.data) {
      // If response is a string or has other properties
      return typeof error.response.data === 'string' 
        ? error.response.data 
        : JSON.stringify(error.response.data);
    }
    if (error.message) {
      return error.message;
    }
    return 'An unexpected error occurred';
  }
}

export const apiClient = new ApiClient();
export { ApiClient };
export default apiClient;