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

  const isMountedRef = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const checkAuthStatus = async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();
    
    try {
      if (!isMountedRef.current) return;
      
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const isAuthenticated = await authService.isAuthenticated();
      
      if (!isMountedRef.current) return;
      
      if (isAuthenticated) {
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
      
      if (!isMountedRef.current) return;
      
      const userData = await authService.getUserData();
      
      if (userData && !SessionManager.isCurrentlyLoggingOut()) {
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
      
      if (error.name === 'AbortError') return;
      
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
    
    if (user.onboardingStep === 'Completed') {
      return true;
    }
    
    if (!user.onboardingStep) {
      return false;
    }
    
    return false;
  };

  const getOnboardingNextStep = (user: User | null): string | null => {
    if (!user) return null;
    
    switch (user.onboardingStep) {
      case 'EMAIL_VERIFIED':
        return '/auth/careerRole';
      case 'Completed':
        return '/dashboard';
      default:
        
        if (!user.careerLevelId || !user.roleTypeId) {
          return '/auth/careerRole';
        }
        
        return '/auth/skills';
    }
  };

  const login = async (emailOrPhone: string, password?: string) => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
      
      let response;
      if (password) {
        response = await authService.loginWithPassword({
          email: emailOrPhone,
          password,
        });
      } else {
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
        response = await authService.signupWithPassword({
          email: emailOrPhone,
          name,
          password,
        });
      } else {
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

  type VerifyOtpParams =
    | { otp: string; sessionId: string }
    | { otp: string; identifier: string };

  const verifyOtp = async (params: VerifyOtpParams) => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

      const response = await authService.verifyOtp(params);

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
      
      const payload: Record<string, unknown> = {};
      if (userData.careerLevelId) payload.careerLevelId = userData.careerLevelId;
      if (userData.roleType) payload.roleType = userData.roleType;
      if (userData.onboardingStep) payload.onboardingStep = userData.onboardingStep;
      if (userData.name) payload.name = userData.name;
      if (userData.email) payload.email = userData.email;

      const response = await authService.updateProfileViaAPI(payload);
      
      if (response.success && response.data) {
        setAuthState(prev => ({
          ...prev,
          user: response.data,
        }));
      } else {
        throw new Error(response.message || 'Profile update failed');
      }
    } catch (error: unknown) {
      setAuthState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'An error occurred',
      }));
      throw error;
    }
  };

  const updateOnboardingStep = async (step: string) => {
    try {
      await authService.updateOnboardingStep(step);
      
      await checkAuthStatus();
    } catch (error: unknown) {
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
