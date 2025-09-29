import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../hooks';
import { 
  checkAuthStatus, 
  loginUser, 
  verifyOtpUser, 
  logoutUser, 
  clearError, 
  updateUserProfile 
} from '../features/authSlice';
import type { User } from '../services/api';

export const useReduxAuth = () => {
  const dispatch = useAppDispatch();
  const auth = useAppSelector(state => state.auth);

  const checkAuth = useCallback(() => {
    dispatch(checkAuthStatus());
  }, [dispatch]);

  const login = useCallback(async (emailOrPhone: string, password?: string) => {
    return dispatch(loginUser({ emailOrPhone, password }));
  }, [dispatch]);

  const verifyOtp = useCallback(async (identifier: string, otp: string) => {
    return dispatch(verifyOtpUser({ identifier, otp }));
  }, [dispatch]);

  const logout = useCallback(async () => {
    return dispatch(logoutUser());
  }, [dispatch]);

  const clearAuthError = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  const updateProfile = useCallback((userData: Partial<User>) => {
    dispatch(updateUserProfile(userData));
  }, [dispatch]);

  const isOnboardingComplete = useCallback((user: User | null): boolean => {
    if (!user) return false;
    
    if (user.onboarding_step === 'Completed') {
      return true;
    }
    
    if (!user.onboarding_step) {
      return false;
    }
    
    return false;
  }, []);

  const getOnboardingNextStep = useCallback((user: User | null): string | null => {
    if (!user) return null;
    
    switch (user.onboarding_step) {
      case 'EMAIL_VERIFIED':
        return '/auth/career-role';
      case 'Completed':
        return '/dashboard';
      default:
        if (!user.career_stage || !user.role_type) {
          return '/auth/career-role';
        }
        return '/auth/skills';
    }
  }, []);

  return {
    // State
    isAuthenticated: auth.isAuthenticated,
    user: auth.user,
    isLoading: auth.isLoading,
    error: auth.error,
    token: auth.token,
    lastAuthCheck: auth.lastAuthCheck,
    
    // Actions
    checkAuth,
    login,
    verifyOtp,
    logout,
    clearError: clearAuthError,
    updateProfile,
    
    // Computed values
    isOnboardingComplete: () => isOnboardingComplete(auth.user),
    getOnboardingNextStep: () => getOnboardingNextStep(auth.user),
  };
};
