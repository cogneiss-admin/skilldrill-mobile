import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import tokenManager from '../utils/tokenManager';
import SessionManager from '../utils/sessionManager';

const getApiBaseUrl = () => {
  if (Constants.expoConfig?.extra?.API_BASE_URL) {
    return Constants.expoConfig.extra.API_BASE_URL;
  }

  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:3000/api';
  } else if (Platform.OS === 'ios') {
    return 'http://localhost:3000/api';
  } else {
    return 'http://localhost:3000/api';
  }
};

const API_BASE_URL = getApiBaseUrl();
const API_TIMEOUT = Constants.expoConfig?.extra?.API_TIMEOUT || 60000;

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
  residenceCountryCode?: string;
  residenceCountryName?: string;
  region?: string;
}

export class ApiError extends Error {
  public status: number;
  public code?: string;
  public data?: Record<string, unknown>;

  constructor(message: string, status: number, code?: string, data?: Record<string, unknown>) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.data = data;
  }
}

const PUBLIC_ENDPOINTS = [
  '/multi-auth/login',
  '/multi-auth/signup',
  '/multi-auth/verify-otp',
  '/multi-auth/refresh-token',
  '/multi-auth/resend-otp',
  '/multi-auth/forgot-password',
  '/multi-auth/reset-password',
];

class ApiService {
  private api: AxiosInstance;
  private isRefreshing = false;
  private failedQueue: {
    resolve: (value?: string | null) => void;
    reject: (error?: unknown) => void;
  }[] = [];

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

  private isPublicEndpoint(url?: string): boolean {
    if (!url) return false;
    return PUBLIC_ENDPOINTS.some(endpoint => url.includes(endpoint));
  }

  private setupInterceptors() {
    this.api.interceptors.request.use(
      async (config: InternalAxiosRequestConfig) => {
        if (this.isPublicEndpoint(config.url)) {
          return config;
        }

        let accessToken = tokenManager.getAccessToken();

        if (tokenManager.isAccessTokenExpired()) {
          try {
            accessToken = await this.performTokenRefresh();
          } catch {
          }
        }

        if (accessToken) {
          config.headers.Authorization = `Bearer ${accessToken}`;
        }

        return config;
      },
      (error) => Promise.reject(error)
    );

    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status !== 401 || originalRequest._retry) {
          return Promise.reject(error);
        }

        // Don't attempt token refresh for public endpoints (especially refresh-token itself)
        // This prevents deadlock when the refresh token is invalid
        if (this.isPublicEndpoint(originalRequest.url)) {
          return Promise.reject(error);
        }

        if (this.isRefreshing) {
          return new Promise((resolve, reject) => {
            this.failedQueue.push({ resolve, reject });
          }).then((token) => {
            if (token) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              return this.api(originalRequest);
            }
            return Promise.reject(new Error('Token refresh failed'));
          });
        }

        originalRequest._retry = true;

        try {
          const newToken = await this.performTokenRefresh();
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return this.api(originalRequest);
        } catch (refreshError) {
          if (!SessionManager.isCurrentlyLoggingOut()) {
            await SessionManager.handleTokenRefreshFailure();
          }
          return Promise.reject(refreshError);
        }
      }
    );
  }

  private async performTokenRefresh(): Promise<string> {
    this.isRefreshing = true;

    try {
      const newToken = await tokenManager.refreshAccessToken(async (refreshToken) => {
        const response = await axios.post(
          `${API_BASE_URL}/multi-auth/refresh-token`,
          { refreshToken },
          { headers: { 'Content-Type': 'application/json' } }
        );

        if (!response.data.success) {
          throw new Error(response.data.message || 'Token refresh failed');
        }

        return {
          accessToken: response.data.data.accessToken,
          refreshToken: response.data.data.refreshToken,
        };
      });

      this.processQueue(null, newToken);
      return newToken;
    } catch (error) {
      this.processQueue(error, null);
      throw error;
    } finally {
      this.isRefreshing = false;
    }
  }

  private processQueue(error: unknown, token: string | null) {
    this.failedQueue.forEach(({ resolve, reject }) => {
      if (error) {
        reject(error);
      } else {
        resolve(token);
      }
    });
    this.failedQueue = [];
  }

  public async clearTokens(): Promise<void> {
    await tokenManager.clearAllTokens();
  }

  public async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<ApiResponse<T>> = await this.api.get(url, config);
      return response.data;
    } catch (error: unknown) {
      throw this.handleError(error);
    }
  }

  public async post<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<ApiResponse<T>> = await this.api.post(url, data, config);
      return response.data;
    } catch (error: unknown) {
      throw this.handleError(error);
    }
  }

  public async put<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<ApiResponse<T>> = await this.api.put(url, data, config);
      return response.data;
    } catch (error: unknown) {
      throw this.handleError(error);
    }
  }

  public async delete<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<ApiResponse<T>> = await this.api.delete(url, config);
      return response.data;
    } catch (error: unknown) {
      throw this.handleError(error);
    }
  }

  private handleError(error: unknown): ApiError {
    const isAxiosError = (err: unknown): err is { response?: { status?: number; data?: unknown }; config?: { url?: string; method?: string }; message?: string; code?: string } => {
      return typeof err === 'object' && err !== null;
    };

    if (isAxiosError(error) && error.response) {
      const { status, data } = error.response;

      if (status === 401) {
        const url = error.config?.url;
        const isAuthEndpoint = this.isPublicEndpoint(url) || url?.includes('/multi-auth/logout');

        if (SessionManager.isCurrentlyLoggingOut()) {
          const errorData = typeof data === 'object' && data !== null ? data as Record<string, unknown> : undefined;
          const errorCode = typeof data === 'object' && data !== null && 'code' in data ? String(data.code) : undefined;
          return new ApiError('Logout in progress', status || 401, errorCode, errorData);
        }

        if (!isAuthEndpoint && SessionManager.isOnProtectedRoute()) {
          SessionManager.handleUnauthorized();
        }
      }

      const errorData = typeof data === 'object' && data !== null ? data as { message?: string; code?: string } : {};
      let message = errorData.message;

      switch (errorData.code) {
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
          if (!SessionManager.isCurrentlyLoggingOut()) {
            SessionManager.handleTokenRefreshFailure();
          }
          break;
        case 'INVALID_TOKEN':
          message = 'Invalid session token. Please login again.';
          if (!SessionManager.isCurrentlyLoggingOut()) {
            SessionManager.handleInvalidToken();
          }
          break;
        case 'UNAUTHORIZED':
          message = 'Unauthorized access. Please login again.';
          if (SessionManager.isOnProtectedRoute() && !SessionManager.isCurrentlyLoggingOut()) {
            SessionManager.handleUnauthorized();
          }
          break;
      }

      const errorDataObj = typeof data === 'object' && data !== null ? data as Record<string, unknown> : undefined;
      return new ApiError(message || 'An error occurred', status || 500, errorData.code, errorDataObj);
    } else if (isAxiosError(error) && 'request' in error) {
      if (error.code === 'ECONNABORTED') {
        return new ApiError('Request timeout - server is not responding', 0, 'TIMEOUT');
      } else if (error.code === 'ERR_NETWORK') {
        return new ApiError('Cannot connect to server. Please check your internet connection and try again.', 0, 'NETWORK_ERROR');
      } else {
        return new ApiError('Network error - no response received from server', 0, 'NETWORK_ERROR');
      }
    } else if (error instanceof Error) {
      return new ApiError(error.message || 'An unexpected error occurred', 0);
    } else {
      return new ApiError('An unexpected error occurred', 0);
    }
  }

  public async healthCheck(): Promise<ApiResponse> {
    return this.get('/auth/health');
  }

  public async fetchRoleTypes(): Promise<ApiResponse> {
    return this.get('/role-types');
  }

  public async startAssessment(skillId: string): Promise<ApiResponse> {
    return this.post('/assessment/start', { skillId });
  }

  public async resumeAssessment(skillId: string): Promise<ApiResponse> {
    return this.post('/assessment/resume', { skillId });
  }

  public async submitAnswerAndGetNext(sessionId: string, answer: string): Promise<ApiResponse> {
    return this.post('/assessment/adaptive/answer', {
      sessionId,
      answer
    });
  }

  public async getAdaptiveResults(sessionId: string): Promise<ApiResponse> {
    return this.get(`/assessment/results/${sessionId}`);
  }

  public async getDrillRecommendations(assessmentId: string): Promise<ApiResponse> {
    return this.get(`/assessment/${assessmentId}/recommendations`);
  }

  public async createCheckout(params: import('../types/pricing').CheckoutRequest): Promise<ApiResponse> {
    return this.post('/commerce/checkout', params);
  }

  public async getSubscription(): Promise<ApiResponse> {
    return this.get('/commerce/subscription');
  }

  public async getPricingPlans(): Promise<ApiResponse> {
    return this.get('/commerce/pricing');
  }

  public async getSubscriptionPlans(): Promise<ApiResponse> {
    return this.get('/commerce/subscription-plans');
  }

  public async changeSubscription(planId: string): Promise<ApiResponse> {
    return this.post('/commerce/subscription/change', { planId });
  }

  public async cancelSubscription(params?: { cancelAtPeriodEnd?: boolean }): Promise<ApiResponse> {
    return this.post('/commerce/subscription/cancel', params || {});
  }

  public async getPaymentHistory(): Promise<ApiResponse> {
    return this.get('/commerce/payment-history');
  }

  public async validateCoupon(params: {
    code: string;
    orderAmount: number;
    pricingMode: 'FIXED' | 'DYNAMIC' | 'SUBSCRIPTION';
    recommendationId?: string;
  }): Promise<ApiResponse> {
    return this.post('/commerce/validate-coupon', params);
  }

  public async getDrillAssignments(params?: {
    cursor?: string;
    limit?: number;
  }): Promise<ApiResponse> {
    const queryParams = new URLSearchParams();
    if (params?.cursor) queryParams.append('cursor', params.cursor);
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const queryString = queryParams.toString();
    return this.get(`/drills/assignments${queryString ? `?${queryString}` : ''}`);
  }

  public async getDrillAssignment(assignmentId: string): Promise<ApiResponse> {
    return this.get(`/drills/assignments/${assignmentId}`);
  }

  public async createDrillAssignment(params: {
    skillId: string;
    source: string;
    recommendationId?: string;
    drillPackPrice?: number;
  }): Promise<ApiResponse> {
    return this.post('/drills/assign', params);
  }

  public async submitDrillAttempt(params: {
    drillItemId: string;
    textContent?: string;
    audioUrl?: string;
    durationSec?: number;
    sessionId?: string;
  }): Promise<ApiResponse> {
    return this.post('/drills/attempt', params);
  }

  public async getDrillAggregate(assignmentId: string): Promise<ApiResponse> {
    return this.get(`/drills/aggregate?assignmentId=${assignmentId}`);
  }

  public async getDrillResults(assignmentId: string): Promise<ApiResponse> {
    return this.get(`/drills/results/${assignmentId}`);
  }

  public async startDrillSession(assignmentId: string): Promise<ApiResponse> {
    return this.post('/drills/session/start', { assignmentId });
  }

  public async getDrillSessionStatus(assignmentId: string): Promise<ApiResponse> {
    return this.get(`/drills/session/status?assignmentId=${assignmentId}`);
  }

  public async updateDrillSessionActivity(sessionId: string, currentDrillIndex: number): Promise<ApiResponse> {
    return this.put(`/drills/session/${sessionId}/activity`, { currentDrillIndex });
  }

  public async completeDrillSession(sessionId: string): Promise<ApiResponse> {
    return this.put(`/drills/session/${sessionId}/complete`, {});
  }

  public async checkExistingDrills(skillId: string): Promise<ApiResponse> {
    return this.get(`/drills/check-existing?skillId=${skillId}`);
  }

  public async generateDrillItems(assignmentId: string): Promise<ApiResponse> {
    return this.post(`/drills/assignments/${assignmentId}/generate`, {});
  }

  public async getUserRecommendations(): Promise<ApiResponse> {
    return this.get('/user/recommendations');
  }

  public async getJobStatus(jobId: string): Promise<ApiResponse> {
    return this.get(`/assessment/jobs/${jobId}/status`);
  }

  public async generateFinalFeedback(assessmentId: string): Promise<ApiResponse> {
    return this.post(`/assessment/${assessmentId}/generate-final-feedback`, {});
  }

  public async cancelFeedbackGeneration(assessmentId: string): Promise<ApiResponse> {
    return this.post(`/assessment/${assessmentId}/cancel-feedback-generation`, {});
  }

  public async getAssessmentResult(assessmentId: string): Promise<ApiResponse> {
    return this.get(`/assessment/${assessmentId}/result`);
  }

  public async retryDrillScoring(drillItemId: string): Promise<ApiResponse> {
    return this.post(`/drills/${drillItemId}/retry-scoring`, {});
  }
}

export const apiService = new ApiService();
export default apiService;
