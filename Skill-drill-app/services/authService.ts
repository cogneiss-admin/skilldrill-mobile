import apiService, { ApiResponse, User, ApiError } from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SessionManager from '../utils/sessionManager';

// Types for auth requests
export interface PhoneSignupRequest {
  phoneNo: string;
  name: string;
  email?: string;
  countryCode?: string;
  countryName?: string;
  phoneCountryCode?: string;
}

export interface EmailSignupRequest {
  email: string;
  name: string;
  phoneNo?: string;
  countryCode?: string;
  countryName?: string;
  phoneCountryCode?: string;
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
  identifier: string; // email or phone
  otp: string;
  signupToken?: string;
}

export interface ResendOtpRequest {
  identifier: string; // email or phone
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface LogoutRequest {
  refreshToken: string;
}

// Response types
export interface SignupResponse {
  userId: string;
  phoneNo?: string;
  email?: string;
  authProvider: string;
  hasPhone?: boolean;
  countryCode?: string;
  countryName?: string;
  phoneCountryCode?: string;
  otp?: string; // Only in development
}

export interface LoginResponse {
  userId?: string;
  phoneNo?: string;
  email?: string;
  otp?: string; // Only in development
}

export interface AuthSuccessResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  hasPhone?: boolean;
}

export interface OtpResponse {
  identifier: string;
  otp?: string; // Only in development
}

export interface TokenRefreshResponse {
  accessToken: string;
  refreshToken: string;
}

class AuthService {
  private readonly USER_DATA_KEY = 'skilldrill_user_data';
  private isUpdatingProfile = false;

  // Token management
  public async getAccessToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('skilldrill_access_token');
    } catch (error) {
      console.error('Error getting access token:', error);
      return null;
    }
  }

  public async setAccessToken(token: string): Promise<void> {
    try {
      if (!token) {
        await AsyncStorage.removeItem('skilldrill_access_token');
        return;
      }
      await AsyncStorage.setItem('skilldrill_access_token', token);
    } catch (error) {
      console.error('Error setting access token:', error);
    }
  }

  public async getRefreshToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('skilldrill_refresh_token');
    } catch (error) {
      console.error('Error getting refresh token:', error);
      return null;
    }
  }

  public async setRefreshToken(token: string): Promise<void> {
    try {
      if (!token) {
        await AsyncStorage.removeItem('skilldrill_refresh_token');
        return;
      }
      await AsyncStorage.setItem('skilldrill_refresh_token', token);
    } catch (error) {
      console.error('Error setting refresh token:', error);
    }
  }

  public async getUserData(): Promise<User | null> {
    try {
      const userData = await AsyncStorage.getItem(this.USER_DATA_KEY);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error getting user data:', error);
      return null;
    }
  }

  public async setUserData(user: User): Promise<void> {
    try {
      await AsyncStorage.setItem(this.USER_DATA_KEY, JSON.stringify(user));
    } catch (error) {
      console.error('Error setting user data:', error);
    }
  }

  public async clearAuthData(): Promise<void> {
    try {
      await SessionManager.clearAuthData();
    } catch (error) {
      console.error('Error clearing auth data:', error);
    }
  }

  public async isAuthenticated(): Promise<boolean> {
    const token = await this.getAccessToken();
    return !!token;
  }

  // Signup methods
  public async signupWithPhone(data: PhoneSignupRequest): Promise<ApiResponse<SignupResponse>> {
    return apiService.post<SignupResponse>('/multi-auth/signup/phone', data);
  }

  public async signupWithEmail(data: EmailSignupRequest): Promise<ApiResponse<SignupResponse>> {
    return apiService.post<SignupResponse>('/multi-auth/signup/email', data);
  }

  public async signupWithPassword(data: PasswordSignupRequest): Promise<ApiResponse<AuthSuccessResponse>> {
    const response = await apiService.post<AuthSuccessResponse>('/multi-auth/signup/password', data);
    
    if (response.success) {
      const at = (response.data as any)?.accessToken;
      const rt = (response.data as any)?.refreshToken;
      if (at) await this.setAccessToken(at);
      if (rt) await this.setRefreshToken(rt);
      if ((response.data as any)?.user) await this.setUserData((response.data as any).user);
    }
    
    return response;
  }

  public async signupWithSocial(data: SocialSignupRequest): Promise<ApiResponse<AuthSuccessResponse>> {
    const response = await apiService.post<AuthSuccessResponse>('/multi-auth/signup/social', data);
    
    if (response.success) {
      const at = (response.data as any)?.accessToken;
      const rt = (response.data as any)?.refreshToken;
      if (at) await this.setAccessToken(at);
      if (rt) await this.setRefreshToken(rt);
      if ((response.data as any)?.user) await this.setUserData((response.data as any).user);
    }
    
    return response;
  }

  // Login methods
  public async loginWithPhone(data: PhoneLoginRequest): Promise<ApiResponse<LoginResponse>> {
    return apiService.post<LoginResponse>('/multi-auth/login/phone', data);
  }

  public async loginWithEmail(data: EmailLoginRequest): Promise<ApiResponse<LoginResponse>> {
    return apiService.post<LoginResponse>('/multi-auth/login/email', data);
  }

  public async loginWithPassword(data: PasswordLoginRequest): Promise<ApiResponse<AuthSuccessResponse>> {
    const response = await apiService.post<AuthSuccessResponse>('/multi-auth/login/password', data);
    
    if (response.success) {
      const at = (response.data as any)?.accessToken;
      const rt = (response.data as any)?.refreshToken;
      if (at) await this.setAccessToken(at);
      if (rt) await this.setRefreshToken(rt);
      if ((response.data as any)?.user) await this.setUserData((response.data as any).user);
    }
    
    return response;
  }

  // OTP methods
  public async verifyOtp(data: OtpVerificationRequest): Promise<ApiResponse<AuthSuccessResponse>> {
    const response = await apiService.post<AuthSuccessResponse>('/multi-auth/verify-otp', data);
    
    if (response.success) {
      const at = (response.data as any)?.accessToken;
      const rt = (response.data as any)?.refreshToken;
      if (at) await this.setAccessToken(at);
      if (rt) await this.setRefreshToken(rt);
      if ((response.data as any)?.user) await this.setUserData((response.data as any).user);
    }
    
    return response;
  }

  public async resendOtp(data: ResendOtpRequest): Promise<ApiResponse<OtpResponse>> {
    return apiService.post<OtpResponse>('/multi-auth/resend-otp', data);
  }

  // Token management
  public async refreshToken(refreshToken: string): Promise<ApiResponse<TokenRefreshResponse>> {
    const response = await apiService.post<TokenRefreshResponse>('/multi-auth/refresh-token', {
      refreshToken: refreshToken
    });
    
    if (response.success) {
      const at = (response.data as any)?.accessToken;
      const rt = (response.data as any)?.refreshToken;
      if (at) await this.setAccessToken(at);
      if (rt) await this.setRefreshToken(rt);
    }
    
    return response;
  }

  public async logout(): Promise<ApiResponse> {
    try {
      // Set logout flag to prevent session expiration alerts
      SessionManager.setLoggingOut(true);
      
      const refreshToken = await this.getRefreshToken();
      if (refreshToken) {
        await apiService.post('/multi-auth/logout', { refreshToken });
      }
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      await this.clearAuthData();
      // Clear logout flag after logout is complete
      SessionManager.setLoggingOut(false);
    }
    
    return { success: true, data: {}, message: 'Logout successful' };
  }

  // Utility methods
  public async updateUserProfile(userData: Partial<User>): Promise<void> {
    const currentUser = await this.getUserData();
    if (currentUser) {
      const updatedUser = { ...currentUser, ...userData };
      await this.setUserData(updatedUser);
    }
  }

  // Validate profile update field (phone or email) - checks DB without sending OTP
  public async validateProfileUpdateField(data: { phoneNo?: string; email?: string; countryCode?: string }): Promise<ApiResponse<{ valid: boolean }>> {
    return apiService.post<{ valid: boolean }>('/multi-auth/profile/validate-field', data);
  }

  // Send OTP for profile update (phone or email)
  public async sendProfileUpdateOTP(data: { phoneNo?: string; email?: string; countryCode?: string }): Promise<ApiResponse<{ identifier: string; expiresAt: string }>> {
    return apiService.post<{ identifier: string; expiresAt: string }>('/multi-auth/profile/send-otp', data);
  }

  // Verify OTP for profile update (only verifies, doesn't update profile)
  public async verifyProfileUpdateOTP(data: { phoneNo?: string; email?: string; otp: string; countryCode?: string }): Promise<ApiResponse<{ verified: boolean; phoneNo?: string | null; email?: string | null }>> {
    return apiService.post<{ verified: boolean; phoneNo?: string | null; email?: string | null }>('/multi-auth/profile/verify-otp', data);
  }

  // Update user profile via API
  public async updateProfileViaAPI(profileData: { 
    careerLevelId?: string; 
    roleType?: string; 
    onboardingStep?: string; 
    name?: string; 
    email?: string; 
    phoneNo?: string;
  }): Promise<ApiResponse<User>> {
    // Prevent multiple simultaneous profile updates
    if (this.isUpdatingProfile) {
      console.log('🔄 AuthService: Profile update already in progress, skipping');
      return { success: true, data: {} as User, message: 'Update already in progress' };
    }
    
    this.isUpdatingProfile = true;
    
    try {
      // Map fields to backend expected names
      const payload: any = {};
      if (profileData.careerLevelId) payload.careerLevelId = profileData.careerLevelId;
      if (profileData.roleType) payload.roleType = profileData.roleType; // backend expects roleType → roleTypeId
      if (profileData.onboardingStep) payload.onboardingStep = profileData.onboardingStep;
      if (profileData.name) payload.name = profileData.name;
      if (profileData.email !== undefined) payload.email = profileData.email;
      if (profileData.phoneNo !== undefined) payload.phoneNo = profileData.phoneNo;

      const response = await apiService.put<User>('/multi-auth/profile', payload);
      
      if (response.success && response.data) {
        // Update local user data
        await this.setUserData(response.data);
      }
      
      return response;
    } catch (error) {
      console.error('Profile update API error:', error);
      throw error;
    } finally {
      this.isUpdatingProfile = false;
    }
  }

  // Update onboarding step
  public async updateOnboardingStep(step: string): Promise<ApiResponse<User>> {
    try {
      console.log(`🎯 AuthService: Updating onboarding step to: ${step}`);
      const response = await this.updateProfileViaAPI({ onboardingStep: step });
      console.log(`✅ AuthService: Onboarding step updated successfully`);
      return response;
    } catch (error) {
      console.error('❌ AuthService: Error updating onboarding step:', error);
      throw error;
    }
  }

  // Get user profile from API
  public async getProfileFromAPI(): Promise<ApiResponse<User>> {
    try {
      const response = await apiService.get<{ user: User }>('/multi-auth/profile');
      
      if (response.success && response.data?.user) {
        // Update local user data
        await this.setUserData(response.data.user);
        // Return the user data directly
        return {
          success: response.success,
          data: response.data.user,
          message: response.message
        };
      }
      
      return response as any;
    } catch (error) {
      console.error('Get profile API error:', error);
      throw error;
    }
  }

  // Validate token and get fresh user data
  public async validateTokenAndGetUser(): Promise<{ isValid: boolean; user: User | null }> {
    try {
      const token = await this.getAccessToken();
      
      if (!token) {
        return { isValid: false, user: null };
      }

      // Don't validate token if user is logging out
      if (SessionManager.isCurrentlyLoggingOut()) {
        console.log('🔐 Skipping token validation - user is logging out');
        return { isValid: false, user: null };
      }

      // Try to get fresh user data from API
      const response = await this.getProfileFromAPI();
      
      if (response.success && response.data) {
        return { isValid: true, user: response.data };
      } else {
        // Token is invalid, handle session expiration only if not logging out
        if (!SessionManager.isCurrentlyLoggingOut()) {
          await SessionManager.handleInvalidToken();
        }
        return { isValid: false, user: null };
      }
    } catch (error) {
      console.error('Token validation error:', error);
      
      // Check if it's an authentication error and not logging out
      if (!SessionManager.isCurrentlyLoggingOut() && 
          error instanceof ApiError && (error.status === 401 || error.code === 'INVALID_TOKEN')) {
        await SessionManager.handleInvalidToken();
      }
      
      return { isValid: false, user: null };
    }
  }

  // Error handling
  public handleAuthError(error: ApiError): string {
    switch (error.code) {
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
        return error.message || 'An authentication error occurred';
    }
  }
}

// Create and export singleton instance
export const authService = new AuthService();
export default authService;

