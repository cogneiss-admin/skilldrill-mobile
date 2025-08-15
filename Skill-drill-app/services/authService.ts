import apiService, { ApiResponse, AuthTokens, User, ApiError } from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Types for auth requests
export interface PhoneSignupRequest {
  phone_no: string;
  name: string;
  email?: string;
}

export interface EmailSignupRequest {
  email: string;
  name: string;
  phone_no?: string;
}

export interface PasswordSignupRequest {
  email: string;
  name: string;
  password: string;
  phone_no?: string;
}

export interface SocialSignupRequest {
  social_id: string;
  email: string;
  name: string;
  auth_provider: 'GOOGLE' | 'LINKEDIN';
  avatar_url?: string;
  phone_no?: string;
}

export interface PhoneLoginRequest {
  phone_no: string;
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
}

export interface ResendOtpRequest {
  identifier: string; // email or phone
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

export interface LogoutRequest {
  refresh_token: string;
}

// Response types
export interface SignupResponse {
  user_id: string;
  phone_no?: string;
  email?: string;
  auth_provider: string;
  has_email?: boolean;
  has_phone?: boolean;
  otp?: string; // Only in development
}

export interface LoginResponse {
  user_id?: string;
  phone_no?: string;
  email?: string;
  otp?: string; // Only in development
}

export interface AuthSuccessResponse {
  user: User;
  access_token: string;
  refresh_token: string;
  has_phone?: boolean;
}

export interface OtpResponse {
  identifier: string;
  otp?: string; // Only in development
}

export interface TokenRefreshResponse {
  access_token: string;
  refresh_token: string;
}

class AuthService {
  private readonly USER_DATA_KEY = 'skilldrill_user_data';

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
      await AsyncStorage.multiRemove([
        'skilldrill_access_token',
        'skilldrill_refresh_token',
        this.USER_DATA_KEY
      ]);
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
      await this.setAccessToken(response.data.access_token);
      await this.setRefreshToken(response.data.refresh_token);
      await this.setUserData(response.data.user);
    }
    
    return response;
  }

  public async signupWithSocial(data: SocialSignupRequest): Promise<ApiResponse<AuthSuccessResponse>> {
    const response = await apiService.post<AuthSuccessResponse>('/multi-auth/signup/social', data);
    
    if (response.success) {
      await this.setAccessToken(response.data.access_token);
      await this.setRefreshToken(response.data.refresh_token);
      await this.setUserData(response.data.user);
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
      await this.setAccessToken(response.data.access_token);
      await this.setRefreshToken(response.data.refresh_token);
      await this.setUserData(response.data.user);
    }
    
    return response;
  }

  // OTP methods
  public async verifyOtp(data: OtpVerificationRequest): Promise<ApiResponse<AuthSuccessResponse>> {
    const response = await apiService.post<AuthSuccessResponse>('/multi-auth/verify-otp', data);
    
    if (response.success) {
      await this.setAccessToken(response.data.access_token);
      await this.setRefreshToken(response.data.refresh_token);
      await this.setUserData(response.data.user);
    }
    
    return response;
  }

  public async resendOtp(data: ResendOtpRequest): Promise<ApiResponse<OtpResponse>> {
    return apiService.post<OtpResponse>('/multi-auth/resend-otp', data);
  }

  // Token management
  public async refreshToken(refreshToken: string): Promise<ApiResponse<TokenRefreshResponse>> {
    const response = await apiService.post<TokenRefreshResponse>('/multi-auth/refresh-token', {
      refresh_token: refreshToken
    });
    
    if (response.success) {
      await this.setAccessToken(response.data.access_token);
      await this.setRefreshToken(response.data.refresh_token);
    }
    
    return response;
  }

  public async logout(): Promise<ApiResponse> {
    try {
      const refreshToken = await this.getRefreshToken();
      if (refreshToken) {
        await apiService.post('/multi-auth/logout', { refresh_token: refreshToken });
      }
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      await this.clearAuthData();
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

  // Update user profile via API
  public async updateProfileViaAPI(profileData: { 
    career_stage?: string; 
    role_type?: string; 
    onboarding_step?: string 
  }): Promise<ApiResponse<User>> {
    try {
      const response = await apiService.put<User>('/multi-auth/profile', profileData);
      
      if (response.success && response.data) {
        // Update local user data
        await this.setUserData(response.data);
      }
      
      return response;
    } catch (error) {
      console.error('Profile update API error:', error);
      throw error;
    }
  }

  // Update onboarding step
  public async updateOnboardingStep(step: string): Promise<ApiResponse<User>> {
    try {
      console.log(`🎯 AuthService: Updating onboarding step to: ${step}`);
      const response = await this.updateProfileViaAPI({ onboarding_step: step });
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

      // Try to get fresh user data from API
      const response = await this.getProfileFromAPI();
      
      if (response.success && response.data) {
        return { isValid: true, user: response.data };
      } else {
        return { isValid: false, user: null };
      }
    } catch (error) {
      console.error('Token validation error:', error);
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

