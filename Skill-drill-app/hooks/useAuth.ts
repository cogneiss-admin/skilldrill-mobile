import { useState, useEffect } from 'react';
import { User } from '../services/api';
import authService from '../services/authService';

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  error: string | null;
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
      
      // First check if we have a token
      const isAuthenticated = await authService.isAuthenticated();
      
      if (isAuthenticated) {
        // Validate token and get fresh user data
        const { isValid, user } = await authService.validateTokenAndGetUser();
        
        if (isValid && user) {
          setAuthState({
            isAuthenticated: true,
            user,
            isLoading: false,
            error: null,
          });
          return;
        } else {
          // Token is invalid, clear auth data
          await authService.clearAuthData();
          setAuthState({
            isAuthenticated: false,
            user: null,
            isLoading: false,
            error: null,
          });
          return;
        }
      }
      
      // No token or invalid token
      setAuthState({
        isAuthenticated: false,
        user: null,
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      console.error('🔐 useAuth: Error during auth check:', error);
      setAuthState({
        isAuthenticated: false,
        user: null,
        isLoading: false,
        error: error.message,
      });
    }
  };

  const isOnboardingComplete = (user: User | null): boolean => {
    return user?.onboarding_step === 'COMPLETED';
  };

  const getOnboardingNextStep = (user: User | null): string | null => {
    if (!user) return null;
    
    // Check onboarding step progression
    switch (user.onboarding_step) {
      case 'EMAIL_VERIFIED':
        return '/auth/career-role';
      case 'CAREER_ROLE_COMPLETED':
        return '/auth/skills';
      case 'SKILLS_SELECTED':
        return '/dashboard'; // Could be assessment or dashboard
      case 'COMPLETED':
        return '/dashboard';
      default:
        // Legacy users or new users without onboarding_step
        // Need to determine their progress manually
        
        // First check: Do they have career/role info?
        if (!user.career_stage || !user.role_type) {
          console.log('🔄 getOnboardingNextStep: User missing career/role info, directing to career-role');
          return '/auth/career-role';
        }
        
        // They have career/role info, but we need to check if they have skills
        // Since we can't check user skills from this context, we'll assume they need skills
        // This will be handled by the skills screen itself to check and redirect if needed
        console.log('🔄 getOnboardingNextStep: Legacy user with career/role, directing to skills');
        return '/auth/skills';
    }
  };

  const login = async (emailOrPhone: string, password?: string) => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
      
      let response;
      if (password) {
        // Password login
        response = await authService.loginWithPassword({
          email: emailOrPhone,
          password,
        });
      } else {
        // OTP login - just send OTP, don't complete login yet
        const inputType = emailOrPhone.includes('@') ? 'email' : 'phone';
        if (inputType === 'email') {
          response = await authService.loginWithEmail({ email: emailOrPhone });
        } else {
          response = await authService.loginWithPhone({ phone_no: emailOrPhone });
        }
      }
      
      if (response.success && 'user' in response.data && response.data.user) {
        setAuthState({
          isAuthenticated: true,
          user: response.data.user,
          isLoading: false,
          error: null,
        });
      } else {
        setAuthState(prev => ({
          ...prev,
          isLoading: false,
          error: response.message,
        }));
      }
      
      return response;
    } catch (error: any) {
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message,
      }));
      throw error;
    }
  };

  const signup = async (emailOrPhone: string, name: string, password?: string) => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
      
      let response;
      const inputType = emailOrPhone.includes('@') ? 'email' : 'phone';
      
      if (password) {
        // Password signup
        response = await authService.signupWithPassword({
          email: emailOrPhone,
          name,
          password,
        });
      } else {
        // OTP signup - just send OTP, don't complete signup yet
        if (inputType === 'email') {
          response = await authService.signupWithEmail({
            email: emailOrPhone,
            name,
          });
        } else {
          response = await authService.signupWithPhone({
            phone_no: emailOrPhone,
            name,
          });
        }
      }
      
      if (response.success && 'user' in response.data && response.data.user) {
        setAuthState({
          isAuthenticated: true,
          user: response.data.user,
          isLoading: false,
          error: null,
        });
      } else {
        setAuthState(prev => ({
          ...prev,
          isLoading: false,
          error: response.message,
        }));
      }
      
      return response;
    } catch (error: any) {
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message,
      }));
      throw error;
    }
  };

  const verifyOtp = async (identifier: string, otp: string) => {
    try {
      console.log('🔐 useAuth: Starting OTP verification...');
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const response = await authService.verifyOtp({
        identifier,
        otp,
      });
      
      console.log('🔐 useAuth: OTP verification response:', {
        success: response.success,
        hasUser: 'user' in response.data && !!response.data.user,
        userData: response.data.user ? {
          id: response.data.user.id,
          name: response.data.user.name,
          career_stage: response.data.user.career_stage,
          role_type: response.data.user.role_type
        } : null
      });
      
      if (response.success && 'user' in response.data && response.data.user) {
        console.log('✅ useAuth: OTP verification successful, setting authenticated state');
        setAuthState({
          isAuthenticated: true,
          user: response.data.user,
          isLoading: false,
          error: null,
        });
        console.log('✅ useAuth: Authentication state updated successfully');
      } else {
        console.log('❌ useAuth: OTP verification failed, setting error state');
        setAuthState(prev => ({
          ...prev,
          isLoading: false,
          error: response.message,
        }));
      }
      
      return response;
    } catch (error: any) {
      console.error('❌ useAuth: OTP verification error:', error);
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message,
      }));
      throw error;
    }
  };

  const logout = async () => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
      
      await authService.logout();
      
      setAuthState({
        isAuthenticated: false,
        user: null,
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message,
      }));
      throw error;
    }
  };

  const updateProfile = async (userData: Partial<User>) => {
    try {
      console.log('🔄 useAuth: Starting profile update...');
      console.log('📊 useAuth: Profile data to update:', userData);
      
      // Use the API method to update profile on backend
      const response = await authService.updateProfileViaAPI(userData as { 
        career_stage?: string; 
        role_type?: string; 
        onboarding_step?: string 
      });
      
      console.log('✅ useAuth: Profile update API response:', response);
      
      if (response.success && response.data) {
        // Update local state with the response from backend
        setAuthState(prev => ({
          ...prev,
          user: response.data,
        }));
        console.log('✅ useAuth: Local state updated with new user data');
        console.log('📊 useAuth: Updated user data:', {
          career_stage: response.data.career_stage,
          role_type: response.data.role_type,
          onboarding_step: response.data.onboarding_step,
          onboardingComplete: isOnboardingComplete(response.data)
        });
      } else {
        console.error('❌ useAuth: Profile update failed:', response.message);
        throw new Error(response.message || 'Profile update failed');
      }
    } catch (error: any) {
      console.error('❌ useAuth: Profile update error:', error);
      setAuthState(prev => ({
        ...prev,
        error: error.message,
      }));
      throw error;
    }
  };

  const updateOnboardingStep = async (step: string) => {
    try {
      console.log(`🎯 useAuth: Updating onboarding step to: ${step}`);
      await authService.updateOnboardingStep(step);
      
      // Refresh user data to get updated onboarding step
      await checkAuthStatus();
      
      console.log(`✅ useAuth: Onboarding step updated to: ${step}`);
    } catch (error: any) {
      console.error('❌ useAuth: Error updating onboarding step:', error);
      setAuthState(prev => ({
        ...prev,
        error: error.message,
      }));
      throw error;
    }
  };

  const clearError = () => {
    setAuthState(prev => ({ ...prev, error: null }));
  };

  return {
    ...authState,
    isOnboardingComplete: () => isOnboardingComplete(authState.user),
    getOnboardingNextStep: () => getOnboardingNextStep(authState.user),
    login,
    signup,
    verifyOtp,
    logout,
    updateProfile,
    updateOnboardingStep,
    clearError,
    checkAuthStatus,
  };
};
