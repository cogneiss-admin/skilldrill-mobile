import { useState, useEffect, useRef } from 'react';
import { User } from '../services/api';
import authService from '../services/authService';
import SessionManager from '../utils/sessionManager';

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

  // Use ref to track if component is mounted
  const isMountedRef = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      // Abort any pending requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const checkAuthStatus = async () => {
    // Cancel any existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Create new abort controller
    abortControllerRef.current = new AbortController();
    
    try {
      if (!isMountedRef.current) return;
      
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
      
      // First check if we have a token
      const isAuthenticated = await authService.isAuthenticated();
      
      if (!isMountedRef.current) return;
      
      if (isAuthenticated) {
        // Validate token and get fresh user data
        const { isValid, user } = await authService.validateTokenAndGetUser();
        
        if (!isMountedRef.current) return;
        
        if (isValid && user) {
          setAuthState({
            isAuthenticated: true,
            user,
            isLoading: false,
            error: null,
          });
          return;
        } else {
          // Token is invalid, handle session expiration
          await SessionManager.handleInvalidToken();
          if (!isMountedRef.current) return;
          
          setAuthState({
            isAuthenticated: false,
            user: null,
            isLoading: false,
            error: null,
          });
          return;
        }
      }
      
      // No token - check if user was previously logged in
      if (!isMountedRef.current) return;
      
      // Check if there's user data from previous session
      const userData = await authService.getUserData();
      
      if (userData && !SessionManager.isCurrentlyLoggingOut()) {
        // User was previously logged in but now has no token - session expired
        console.log('🔐 useAuth: User was logged in but no token found - handling session expiration');
        await SessionManager.handleSessionExpiration('Your session has expired');
      }
      
      setAuthState({
        isAuthenticated: false,
        user: null,
        isLoading: false,
        error: null,
      });
    } catch (error: unknown) {
      if (!isMountedRef.current) return;
      
      // Don't set error for aborted requests
      if (error.name === 'AbortError') return;
      
      console.error('🔐 useAuth: Error during auth check:', error);
      
      // Check if it's an authentication error that should trigger session expiration
      // But only if user is not currently logging out
      if (!SessionManager.isCurrentlyLoggingOut() && 
          (error.status === 401 || error.code === 'INVALID_TOKEN' || error.code === 'INVALID_REFRESH_TOKEN')) {
        await SessionManager.handleInvalidToken();
      }
      
      setAuthState({
        isAuthenticated: false,
        user: null,
        isLoading: false,
        error: error instanceof Error ? error.message : 'An error occurred',
      });
    }
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const isOnboardingComplete = (user: User | null): boolean => {
    if (!user) return false;
    
    console.log('🔍 isOnboardingComplete: Checking user:', {
      onboardingStep: user.onboardingStep,
      careerLevelId: user.careerLevelId,
      roleTypeId: user.roleTypeId,
      roleType: user.roleType
    });
    
    // Check if user has completed onboarding
    if (user.onboardingStep === 'Completed') {
      console.log('✅ isOnboardingComplete: User has completed onboarding');
      return true;
    }
    
    // For legacy users without onboardingStep, check if they have all required info
    if (!user.onboardingStep) {
      // Legacy users need career info and skills to be considered complete
      // Since we can't check skills here, we'll assume they need to go through the flow
      console.log('⚠️ isOnboardingComplete: Legacy user without onboardingStep, assuming incomplete');
      return false;
    }
    
    console.log('❌ isOnboardingComplete: User has not completed onboarding');
    return false;
  };

  const getOnboardingNextStep = (user: User | null): string | null => {
    if (!user) return null;
    
    console.log('🔄 getOnboardingNextStep: Checking user onboarding state:', {
      onboardingStep: user.onboardingStep,
      careerLevelId: user.careerLevelId,
      roleTypeId: user.roleTypeId,
      roleType: user.roleType
    });
    
    // Check onboarding step progression
    switch (user.onboardingStep) {
      case 'EMAIL_VERIFIED':
        // User just signed up, needs to complete career role
        console.log('🔄 getOnboardingNextStep: User at EMAIL_VERIFIED, directing to careerRole');
        return '/auth/careerRole';
      case 'Completed':
        // User completed full onboarding
        console.log('🔄 getOnboardingNextStep: User at COMPLETED, directing to dashboard');
        return '/dashboard';
      default:
        // Legacy users or new users without onboardingStep
        // Need to determine their progress manually
        
        // First check: Do they have career/role info?
        if (!user.careerLevelId || !user.roleTypeId) {
          console.log('🔄 getOnboardingNextStep: User missing career/role info, directing to careerRole');
          return '/auth/careerRole';
        }
        
        // They have career/role info, check if they have skills
        // For now, assume they need to complete skills selection
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
          response = await authService.loginWithPhone({ phoneNo: emailOrPhone });
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
    } catch (error: unknown) {
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'An error occurred',
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
            phoneNo: emailOrPhone,
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
    } catch (error: unknown) {
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'An error occurred',
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
          careerLevelId: response.data.user.careerLevelId,
          roleTypeId: response.data.user.roleTypeId,
          roleType: response.data.user.roleType,
          onboardingStep: response.data.user.onboardingStep
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
    } catch (error: unknown) {
      console.error('❌ useAuth: OTP verification error:', error);
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'An error occurred',
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
    } catch (error: unknown) {
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'An error occurred',
      }));
      throw error;
    }
  };

  const updateProfile = async (userData: Partial<User>) => {
    try {
      console.log('🔄 useAuth: Starting profile update...');
      console.log('📊 useAuth: Profile data to update:', userData);
      
      // Use the API method to update profile on backend
      const payload: Record<string, unknown> = {};
      if (userData.careerLevelId) payload.careerLevelId = userData.careerLevelId;
      if (userData.roleType) payload.roleType = userData.roleType;
      if (userData.onboardingStep) payload.onboardingStep = userData.onboardingStep;
      if (userData.name) payload.name = userData.name;
      if (userData.email) payload.email = userData.email;

      const response = await authService.updateProfileViaAPI(payload);
      
      console.log('✅ useAuth: Profile update API response:', response);
      
      if (response.success && response.data) {
        // Update local state with the response from backend
        setAuthState(prev => ({
          ...prev,
          user: response.data,
        }));
        console.log('✅ useAuth: Local state updated with new user data');
        console.log('📊 useAuth: Updated user data:', {
          careerLevelId: response.data.careerLevelId,
          roleTypeId: response.data.roleTypeId,
          roleType: response.data.roleType,
          onboardingStep: response.data.onboardingStep,
          onboardingComplete: isOnboardingComplete(response.data)
        });
      } else {
        console.error('❌ useAuth: Profile update failed:', response.message);
        throw new Error(response.message || 'Profile update failed');
      }
    } catch (error: unknown) {
      console.error('❌ useAuth: Profile update error:', error);
      setAuthState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'An error occurred',
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
    } catch (error: unknown) {
      console.error('❌ useAuth: Error updating onboarding step:', error);
      setAuthState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'An error occurred',
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
