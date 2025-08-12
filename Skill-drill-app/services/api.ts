import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// Environment variables
const API_BASE_URL = Constants.expoConfig?.extra?.API_BASE_URL || 'http://localhost:3000/api';
const API_TIMEOUT = Constants.expoConfig?.extra?.API_TIMEOUT || 10000;
const ACCESS_TOKEN_KEY = Constants.expoConfig?.extra?.ACCESS_TOKEN_KEY || 'skilldrill_access_token';
const REFRESH_TOKEN_KEY = Constants.expoConfig?.extra?.REFRESH_TOKEN_KEY || 'skilldrill_refresh_token';

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message: string;
  code?: string;
  status?: number;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
}

export interface User {
  id: string;
  name: string;
  email?: string;
  phone_no?: string;
  is_verified: boolean;
  auth_provider?: string;
}

// API Error class
export class ApiError extends Error {
  public status: number;
  public code?: string;
  public data?: any;

  constructor(message: string, status: number, code?: string, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.data = data;
  }
}

class ApiService {
  private api: AxiosInstance;
  private isRefreshing = false;
  private failedQueue: Array<{
    resolve: (value?: any) => void;
    reject: (error?: any) => void;
  }> = [];

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: API_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      async (config) => {
        const token = await this.getAccessToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor to handle token refresh
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          if (this.isRefreshing) {
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject });
            })
              .then((token) => {
                originalRequest.headers.Authorization = `Bearer ${token}`;
                return this.api(originalRequest);
              })
              .catch((err) => Promise.reject(err));
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            const refreshToken = await this.getRefreshToken();
            if (!refreshToken) {
              throw new Error('No refresh token available');
            }

            const response = await this.refreshToken(refreshToken);
            const { access_token } = response.data;

            await this.setAccessToken(access_token);
            await this.setRefreshToken(response.data.refresh_token);

            this.api.defaults.headers.common.Authorization = `Bearer ${access_token}`;
            this.processQueue(null, access_token);

            return this.api(originalRequest);
          } catch (refreshError) {
            this.processQueue(refreshError, null);
            await this.clearTokens();
            throw refreshError;
          } finally {
            this.isRefreshing = false;
          }
        }

        return Promise.reject(error);
      }
    );
  }

  private processQueue(error: any, token: string | null) {
    this.failedQueue.forEach(({ resolve, reject }) => {
      if (error) {
        reject(error);
      } else {
        resolve(token);
      }
    });

    this.failedQueue = [];
  }

  // Token management
  private async getAccessToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
    } catch (error) {
      console.error('Error getting access token:', error);
      return null;
    }
  }

  private async setAccessToken(token: string): Promise<void> {
    try {
      await AsyncStorage.setItem(ACCESS_TOKEN_KEY, token);
    } catch (error) {
      console.error('Error setting access token:', error);
    }
  }

  private async getRefreshToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
    } catch (error) {
      console.error('Error getting refresh token:', error);
      return null;
    }
  }

  private async setRefreshToken(token: string): Promise<void> {
    try {
      await AsyncStorage.setItem(REFRESH_TOKEN_KEY, token);
    } catch (error) {
      console.error('Error setting refresh token:', error);
    }
  }

  public async clearTokens(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY]);
    } catch (error) {
      console.error('Error clearing tokens:', error);
    }
  }

  // Generic request methods
  public async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<ApiResponse<T>> = await this.api.get(url, config);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  public async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<ApiResponse<T>> = await this.api.post(url, data, config);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  public async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<ApiResponse<T>> = await this.api.put(url, data, config);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  public async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<ApiResponse<T>> = await this.api.delete(url, config);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  private handleError(error: any): ApiError {
    if (error.response) {
      const { status, data } = error.response;
      
      // Handle specific error codes
      let message = data?.message || 'An error occurred';
      
      switch (data?.code) {
        case 'RATE_LIMIT_EXCEEDED':
          message = 'Too many requests. Please wait a moment and try again.';
          break;
        case 'OTP_RATE_LIMIT_EXCEEDED':
          message = 'Too many OTP requests. Please wait 5 minutes before trying again.';
          break;
        case 'USER_EXISTS':
          message = 'An account with this email/phone already exists.';
          break;
        case 'USER_NOT_FOUND':
          message = 'No account found with this email/phone.';
          break;
        case 'INVALID_CREDENTIALS':
          message = 'Invalid email or password.';
          break;
        case 'INVALID_OTP':
          message = 'Invalid OTP code.';
          break;
        case 'OTP_EXPIRED':
          message = 'OTP has expired. Please request a new one.';
          break;
        case 'SOCIAL_LOGIN_REQUIRED':
          message = 'This account requires social login.';
          break;
        case 'INVALID_REFRESH_TOKEN':
          message = 'Session expired. Please login again.';
          break;
      }
      
      return new ApiError(message, status, data?.code, data);
    } else if (error.request) {
      return new ApiError('Network error - no response received', 0);
    } else {
      return new ApiError(error.message || 'An unexpected error occurred', 0);
    }
  }

  // Health check
  public async healthCheck(): Promise<ApiResponse> {
    return this.get('/auth/health');
  }
}

// Create and export singleton instance
export const apiService = new ApiService();
export default apiService;

