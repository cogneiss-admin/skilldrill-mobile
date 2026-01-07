import apiService, { ApiResponse, User, ApiError } from './api';
import tokenManager from '../utils/tokenManager';
import SessionManager from '../utils/sessionManager';
import { store } from '../store';
import { setUser, setAuthenticated, clearAuth } from '../features/authSlice';

export interface PhoneSignupRequest {
  phoneNo: string;
  name: string;
  email?: string;
  countryCode?: string;
  countryName?: string;
  phoneCountryCode?: string;
  residenceCountryCode?: string;
  residenceCountryName?: string;
  region?: string;
}

export interface EmailSignupRequest {
  email: string;
  name: string;
  phoneNo?: string;
  countryCode?: string;
  countryName?: string;
  phoneCountryCode?: string;
  residenceCountryCode?: string;
  residenceCountryName?: string;
  region?: string;
}

export interface PasswordSignupRequest {
  email: string;
  name: string;
  password: string;
  phoneNo?: string;
  countryCode?: string;
  countryName?: string;
  phoneCountryCode?: string;
}

export interface SocialSignupRequest {
  socialId: string;
  email: string;
  name: string;
  authProvider: 'GOOGLE' | 'LINKEDIN';
  avatarUrl?: string;
  phoneNo?: string;
  countryCode?: string;
  countryName?: string;
  phoneCountryCode?: string;
}

export interface PhoneLoginRequest {
  phoneNo: string;
}

export interface EmailLoginRequest {
  email: string;
}

export interface PasswordLoginRequest {
  email: string;
  password: string;
}

export interface OtpVerificationRequest {
  otp: string;
  sessionId?: string;
  identifier?: string;
}

export interface ResendOtpRequest {
  sessionId?: string;
  identifier?: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface LogoutRequest {
  refreshToken: string;
}

export interface SignupResponse {
  sessionId: string;
  phoneNo?: string;
  email?: string;
  authProvider: string;
  hasPhone?: boolean;
  hasEmail?: boolean;
  countryCode?: string;
  countryName?: string;
  phoneCountryCode?: string;
  otp?: string;
}

export interface LoginResponse {
  userId?: string;
  phoneNo?: string;
  email?: string;
  otp?: string;
}

export interface AuthSuccessResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  hasPhone?: boolean;
}

export interface OtpResponse {
  identifier: string;
  otp?: string;
  retry_after?: number;
  retryAfter?: number;
}

export interface TokenRefreshResponse {
  accessToken: string;
  refreshToken: string;
}

class AuthService {
  private isUpdatingProfile = false;

  public getAccessToken(): string | null {
    return tokenManager.getAccessToken();
  }

  public async getRefreshToken(): Promise<string | null> {
    return tokenManager.getRefreshToken();
  }

  public async hasValidSession(): Promise<boolean> {
    return tokenManager.hasValidSession();
  }

  public getUserData(): User | null {
    return store.getState().auth.user;
  }

  public setUserData(user: User): void {
    store.dispatch(setUser(user));
  }

  public async clearAuthData(): Promise<void> {
    store.dispatch(clearAuth());
    await tokenManager.clearAllTokens();
  }

  public async isAuthenticated(): Promise<boolean> {
    const hasSession = await this.hasValidSession();
    const hasAccessToken = !!this.getAccessToken();
    return hasSession || hasAccessToken;
  }

  private async handleAuthSuccess(authData: AuthSuccessResponse): Promise<void> {
    if (authData.accessToken) {
      tokenManager.setAccessToken(authData.accessToken);
    }
    if (authData.refreshToken) {
      await tokenManager.setRefreshToken(authData.refreshToken);
    }
    if (authData.user) {
      this.setUserData(authData.user);
    }
    store.dispatch(setAuthenticated(true));
  }

  public async signupWithPhone(data: PhoneSignupRequest): Promise<ApiResponse<SignupResponse>> {
    return apiService.post<SignupResponse>('/multi-auth/signup/phone', data);
  }

  public async signupWithEmail(data: EmailSignupRequest): Promise<ApiResponse<SignupResponse>> {
    return apiService.post<SignupResponse>('/multi-auth/signup/email', data);
  }

  public async signupWithPassword(data: PasswordSignupRequest): Promise<ApiResponse<AuthSuccessResponse>> {
    const response = await apiService.post<AuthSuccessResponse>('/multi-auth/signup/password', data);
    if (response.success && response.data) {
      await this.handleAuthSuccess(response.data);
    }
    return response;
  }

  public async signupWithSocial(data: SocialSignupRequest): Promise<ApiResponse<AuthSuccessResponse>> {
    const response = await apiService.post<AuthSuccessResponse>('/multi-auth/signup/social', data);
    if (response.success && response.data) {
      await this.handleAuthSuccess(response.data);
    }
    return response;
  }

  public async loginWithPhone(data: PhoneLoginRequest): Promise<ApiResponse<LoginResponse>> {
    return apiService.post<LoginResponse>('/multi-auth/login/phone', data);
  }

  public async loginWithEmail(data: EmailLoginRequest): Promise<ApiResponse<LoginResponse>> {
    return apiService.post<LoginResponse>('/multi-auth/login/email', data);
  }

  public async loginWithPassword(data: PasswordLoginRequest): Promise<ApiResponse<AuthSuccessResponse>> {
    const response = await apiService.post<AuthSuccessResponse>('/multi-auth/login/password', data);
    if (response.success && response.data) {
      await this.handleAuthSuccess(response.data);
    }
    return response;
  }

  public async verifyOtp(data: OtpVerificationRequest): Promise<ApiResponse<AuthSuccessResponse>> {
    const response = await apiService.post<AuthSuccessResponse>('/multi-auth/verify-otp', data);
    if (response.success && response.data) {
      await this.handleAuthSuccess(response.data);
    }
    return response;
  }

  public async resendOtp(data: ResendOtpRequest): Promise<ApiResponse<OtpResponse>> {
    return apiService.post<OtpResponse>('/multi-auth/resend-otp', data);
  }

  public async refreshToken(refreshToken: string): Promise<ApiResponse<TokenRefreshResponse>> {
    return apiService.post<TokenRefreshResponse>('/multi-auth/refresh-token', {
      refreshToken: refreshToken
    });
  }

  public async logout(): Promise<ApiResponse> {
    try {
      SessionManager.setLoggingOut(true);
      const refreshToken = await this.getRefreshToken();
      if (refreshToken) {
        await apiService.post('/multi-auth/logout', { refreshToken });
      }
    } catch {
    } finally {
      await this.clearAuthData();
      SessionManager.setLoggingOut(false);
    }
    return { success: true, data: {}, message: 'Logout successful' };
  }

  public async updateUserProfile(userData: Partial<User>): Promise<void> {
    const currentUser = this.getUserData();
    if (currentUser) {
      const updatedUser = { ...currentUser, ...userData };
      this.setUserData(updatedUser);
    }
  }

  public async validateProfileUpdateField(data: { phoneNo?: string; email?: string; countryCode?: string }): Promise<ApiResponse<{ valid: boolean }>> {
    return apiService.post<{ valid: boolean }>('/multi-auth/profile/validate-field', data);
  }

  public async sendProfileUpdateOTP(data: { phoneNo?: string; email?: string; countryCode?: string }): Promise<ApiResponse<{ identifier: string; expiresAt: string }>> {
    return apiService.post<{ identifier: string; expiresAt: string }>('/multi-auth/profile/send-otp', data);
  }

  public async verifyProfileUpdateOTP(data: { phoneNo?: string; email?: string; otp: string; countryCode?: string }): Promise<ApiResponse<{ verified: boolean; phoneNo?: string | null; email?: string | null }>> {
    return apiService.post<{ verified: boolean; phoneNo?: string | null; email?: string | null }>('/multi-auth/profile/verify-otp', data);
  }

  public async updateProfileViaAPI(profileData: { 
    careerLevelId?: string; 
    roleType?: string; 
    onboardingStep?: string; 
    name?: string; 
    email?: string; 
    phoneNo?: string;
  }): Promise<ApiResponse<User>> {
    if (this.isUpdatingProfile) {
      return { success: true, data: {} as User, message: 'Update already in progress' };
    }

    this.isUpdatingProfile = true;

    try {
      const payload: Record<string, unknown> = {};
      if (profileData.careerLevelId) payload.careerLevelId = profileData.careerLevelId;
      if (profileData.roleType) payload.roleType = profileData.roleType;
      if (profileData.onboardingStep) payload.onboardingStep = profileData.onboardingStep;
      if (profileData.name) payload.name = profileData.name;
      if (profileData.email !== undefined) payload.email = profileData.email;
      if (profileData.phoneNo !== undefined) payload.phoneNo = profileData.phoneNo;

      const response = await apiService.put<User>('/multi-auth/profile', payload);

      if (response.success && response.data) {
        this.setUserData(response.data);
      }

      return response;
    } catch (error) {
      throw error;
    } finally {
      this.isUpdatingProfile = false;
    }
  }

  public async updateOnboardingStep(step: string): Promise<ApiResponse<User>> {
    try {
      const response = await this.updateProfileViaAPI({ onboardingStep: step });
      return response;
    } catch (error) {
      throw error;
    }
  }

  public async getProfileFromAPI(): Promise<ApiResponse<User>> {
    try {
      const response = await apiService.get<{ user: User }>('/multi-auth/profile');

      if (response.success && response.data?.user) {
        this.setUserData(response.data.user);
        return {
          success: response.success,
          data: response.data.user,
          message: response.message
        } as ApiResponse<User>;
      }

      return {
        success: response.success,
        data: {} as User,
        message: response.message
      };
    } catch (error) {
      throw error;
    }
  }

  public async validateTokenAndGetUser(): Promise<{ isValid: boolean; user: User | null }> {
    try {
      const token = this.getAccessToken();

      if (!token) {
        return { isValid: false, user: null };
      }

      if (SessionManager.isCurrentlyLoggingOut()) {
        return { isValid: false, user: null };
      }

      const response = await this.getProfileFromAPI();

      if (response.success && response.data) {
        return { isValid: true, user: response.data };
      } else {
        if (!SessionManager.isCurrentlyLoggingOut()) {
          await SessionManager.handleInvalidToken();
        }
        return { isValid: false, user: null };
      }
    } catch (error) {
      if (!SessionManager.isCurrentlyLoggingOut() &&
          error instanceof ApiError && (error.status === 401 || error.code === 'INVALID_TOKEN')) {
        await SessionManager.handleInvalidToken();
      }

      return { isValid: false, user: null };
    }
  }

  public handleAuthError(error: unknown): string {
    const err = error as { code?: string; message?: string };
    switch (err.code) {
      case 'USER_EXISTS':
        return 'An account with this email/phone already exists. Please log in instead.';
      case 'USER_NOT_FOUND':
        return 'No account found with this email/phone. Please sign up to create a new account.';
      case 'USER_PENDING_VERIFICATION':
        return 'An account with this email/phone is pending verification. Please complete your verification or contact support.';
      case 'ACCOUNT_PENDING_VERIFICATION':
        return 'Your account is pending verification. Please complete the signup process.';
      case 'ACCOUNT_SUSPENDED':
        return 'Your account has been suspended. Please contact support.';
      case 'ACCOUNT_INACTIVE':
        return 'Your account is not active. Please contact support.';
      case 'INVALID_CREDENTIALS':
        return 'Invalid email or password';
      case 'INVALID_OTP':
        return 'Invalid OTP code';
      case 'OTP_EXPIRED':
        return 'OTP has expired. Please request a new one';
      case 'SOCIAL_LOGIN_REQUIRED':
        return 'This account requires social login';
      case 'INVALID_REFRESH_TOKEN':
        return 'Session expired. Please login again';
      case 'RATE_LIMIT_EXCEEDED':
        return 'Too many attempts. Please try again later.';
      case 'OTP_RATE_LIMIT_EXCEEDED':
        return 'Too many OTP requests. Please wait before requesting another.';
      default:
        return err.message || 'An authentication error occurred';
    }
  }
}

export const authService = new AuthService();
export default authService;
