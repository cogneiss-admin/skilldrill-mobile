import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import SessionManager from '../utils/sessionManager';

// Environment variables with platform detection
const getApiBaseUrl = () => {
  // Use environment variable first, then fallback to Android emulator IP
  if (Constants.expoConfig?.extra?.API_BASE_URL) {
    return Constants.expoConfig.extra.API_BASE_URL;
  }
  
  // Platform-specific fallbacks - use Android emulator special IP
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:3000/api';
  } else if (Platform.OS === 'ios') {
    return 'http://localhost:3000/api';
  } else {
    return 'http://localhost:3000/api';
  }
};

const API_BASE_URL = getApiBaseUrl();
const API_TIMEOUT = Constants.expoConfig?.extra?.API_TIMEOUT || 60000; // Increased timeout for assessment creation (60 seconds)
const ACCESS_TOKEN_KEY = Constants.expoConfig?.extra?.ACCESS_TOKEN_KEY || 'skilldrill_access_token';
const REFRESH_TOKEN_KEY = Constants.expoConfig?.extra?.REFRESH_TOKEN_KEY || 'skilldrill_refresh_token';

// Debug environment variables
console.log('🔧 API Configuration:');
console.log('Platform:', Platform.OS);
console.log('API_BASE_URL:', API_BASE_URL);
console.log('API_TIMEOUT:', API_TIMEOUT);
console.log('Constants.expoConfig?.extra:', Constants.expoConfig?.extra);

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message: string;
  code?: string;
  status?: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface User {
  id: string;
  name: string;
  email?: string;
  phoneNo?: string;
  isVerified: boolean;
  authProvider?: string;
  avatarUrl?: string;
  careerLevelId?: string;
  careerLevel?: {
    id: string;
    name: string;
    description?: string;
    order: number;
  };
  roleTypeId?: string;
  roleType?: {
    id: string;
    name: string;
    description?: string;
    order: number;
  };
  onboardingStep?: string;
  onboardingCompletedAt?: string;
  countryCode?: string;
  countryName?: string;
  phoneCountryCode?: string;
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
  private failedQueue: {
    resolve: (value?: any) => void;
    reject: (error?: any) => void;
  }[] = [];

  constructor() {
    console.log('🚀 Initializing API Service with baseURL:', API_BASE_URL);
    console.log('🔧 API Configuration:', {
      platform: Platform.OS,
      isDev: __DEV__,
      timeout: API_TIMEOUT,
      constants: Constants.expoConfig?.extra
    });
    
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: API_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('✅ API Service initialized successfully');
    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      async (config) => {
        const fullUrl = config.baseURL + config.url;
        console.log('📡 Making request to:', fullUrl);
        console.log('📡 Method:', config.method?.toUpperCase());
        console.log('📡 Headers:', config.headers);
        
        const token = await this.getAccessToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
          console.log('🔐 Added auth token to request');
        } else {
          console.log('ℹ️ No auth token available');
        }
        return config;
      },
      (error) => {
        console.error('❌ Request interceptor error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle token refresh
    this.api.interceptors.response.use(
      (response) => {
        console.log('✅ Response received:', {
          status: response.status,
          url: response.config.url,
          data: response.data
        });
        return response;
      },
      async (error) => {
        console.error('❌ Response error:', {
          status: error.response?.status,
          url: error.config?.url,
          message: error.message,
          data: error.response?.data
        });
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

            // Import authService to handle token refresh
            const { default: authService } = await import('./authService');
            const response = await authService.refreshToken(refreshToken);
            const { accessToken, refreshToken: newRefreshToken } = response.data as any;

            await this.setAccessToken(accessToken);
            await this.setRefreshToken(newRefreshToken);

            this.api.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
            this.processQueue(null, accessToken);

            return this.api(originalRequest);
          } catch (refreshError) {
            this.processQueue(refreshError, null);
            await this.clearTokens();
            
            // Handle session expiration
            await SessionManager.handleTokenRefreshFailure();
            
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
      console.log('📤 Making POST request to:', url);
      console.log('📤 Full URL:', `${this.api.defaults.baseURL}${url}`);
      console.log('📤 Request data:', data);
      const response: AxiosResponse<ApiResponse<T>> = await this.api.post(url, data, config);
      console.log('✅ POST response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ POST request failed:', {
        url,
        data,
        error: error.message,
        status: error.status,
        code: error.code
      });
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
    if (__DEV__) console.debug('🔍 API Error Details:', {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      url: error.config?.url,
      method: error.config?.method,
      data: error.response?.data
    });

    if (error.response) {
      const { status, data } = error.response;
      
      // Handle 401 Unauthorized errors
      if (status === 401) {
        // Don't handle session expiration for auth-related endpoints or during logout
        const url = error.config?.url;
        const isAuthEndpoint =
          url.includes('/login') ||
          url.includes('/signup') ||
          url.includes('/otp') ||
          url.includes('/multi-auth/logout');

        // Don't trigger session expiration if user is logging out
        if (SessionManager.isCurrentlyLoggingOut()) {
          console.log('🔐 Skipping 401 handling - user is logging out');
          return new ApiError('Logout in progress', status, data?.code, data);
        }

        // Only trigger session-expired flow if user is on a protected route and not logging out
        if (!isAuthEndpoint && SessionManager.isOnProtectedRoute()) {
          SessionManager.handleUnauthorized();
        }
      }
      
      // Handle specific error codes
      let message = data?.message;
      
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
          // Handle session expiration only if not logging out
          if (!SessionManager.isCurrentlyLoggingOut()) {
            SessionManager.handleTokenRefreshFailure();
          }
          break;
        case 'INVALID_TOKEN':
          message = 'Invalid session token. Please login again.';
          // Handle invalid token only if not logging out
          if (!SessionManager.isCurrentlyLoggingOut()) {
            SessionManager.handleInvalidToken();
          }
          break;
        case 'UNAUTHORIZED':
          message = 'Unauthorized access. Please login again.';
          // Handle unauthorized access only on protected routes and not during logout
          if (SessionManager.isOnProtectedRoute() && !SessionManager.isCurrentlyLoggingOut()) {
            SessionManager.handleUnauthorized();
          }
          break;
      }
      
      return new ApiError(message, status, data?.code, data);
    } else if (error.request) {
      // Network error - provide more specific information
      if (__DEV__) console.debug('🌐 Network Error:', {
        url: error.config?.url,
        method: error.config?.method,
        timeout: error.code === 'ECONNABORTED' ? 'Request timeout' : 'No response received'
      });
      
      if (error.code === 'ECONNABORTED') {
        return new ApiError('Request timeout - server is not responding', 0, 'TIMEOUT');
      } else if (error.code === 'ERR_NETWORK') {
        return new ApiError('Cannot connect to server. Please check your internet connection and try again.', 0, 'NETWORK_ERROR');
      } else {
        return new ApiError('Network error - no response received from server', 0, 'NETWORK_ERROR');
      }
    } else {
      return new ApiError(error.message, 0);
    }
  }

  // Health check
  public async healthCheck(): Promise<ApiResponse> {
    return this.get('/auth/health');
  }

  // ===========================================
  // ROLE TYPES METHODS
  // ===========================================

  /**
   * Fetch all active role types
   */
  public async fetchRoleTypes(): Promise<ApiResponse> {
    console.log('📋 Fetching role types');
    return this.get('/role-types');
  }

  // ===========================================
  // ADAPTIVE ASSESSMENT METHODS
  // ===========================================

  /**
   * Start new adaptive assessment session (Sequential)
   */
  public async startAssessment(skillId: string): Promise<ApiResponse> {
    console.log('🎯 Starting assessment for skill:', skillId);
    return this.post('/assessment/start', { skillId });
  }

  /**
   * Submit answer and get next question (Sequential)
   */
  public async submitAnswerAndGetNext(sessionId: string, answer: string): Promise<ApiResponse> {
    console.log('📝 Submitting answer for session:', sessionId);
    return this.post('/assessment/adaptive/answer', {
      sessionId,
      answer
    });
  }


  /**
   * Get adaptive assessment results
   */
  public async getAdaptiveResults(sessionId: string): Promise<ApiResponse> {
    console.log('📊 Getting adaptive results for session:', sessionId);
    return this.get(`/assessment/results/${sessionId}`);
  }

  /**
   * Get drill recommendations for a completed assessment
   */
  public async getDrillRecommendations(assessmentId: string): Promise<ApiResponse> {
    console.log('🧭 Fetching drill recommendations for assessment:', assessmentId);
    return this.get(`/assessment/${assessmentId}/recommendations`);
  }
 
}

// Create and export singleton instance
export const apiService = new ApiService();
export default apiService;


