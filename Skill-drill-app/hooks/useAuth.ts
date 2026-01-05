import { useEffect, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from './index';
import {
  selectUser,
  selectIsAuthenticated,
  selectAuthLoading,
  selectAuthError,
  selectIsOnboardingComplete,
  selectOnboardingNextStep,
} from '../features/selectors';
import {
  checkAuthStatus,
  loginUser,
  signupUser,
  verifyOtpUser,
  logoutUser,
  updateProfileUser,
  updateOnboardingStepUser,
  clearError,
} from '../features/authSlice';
import { User } from '../services/api';
import authService from '../services/authService';

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  error: string | null;
}

export const useAuth = () => {
  const dispatch = useAppDispatch();

  const user = useAppSelector(selectUser);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const isLoading = useAppSelector(selectAuthLoading);
  const error = useAppSelector(selectAuthError);
  const isOnboardingCompleteValue = useAppSelector(selectIsOnboardingComplete);
  const onboardingNextStep = useAppSelector(selectOnboardingNextStep);

  useEffect(() => {
    dispatch(checkAuthStatus());
  }, [dispatch]);

  const login = useCallback(async (emailOrPhone: string, password?: string) => {
    try {
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
        await dispatch(checkAuthStatus());
      }

      return response;
    } catch (err) {
      throw err;
    }
  }, [dispatch]);

  const signup = useCallback(async (emailOrPhone: string, name: string, password?: string) => {
    try {
      const result = await dispatch(signupUser({ emailOrPhone, name, password })).unwrap();
      return result.response;
    } catch (err) {
      throw err;
    }
  }, [dispatch]);

  type VerifyOtpParams =
    | { otp: string; sessionId: string }
    | { otp: string; identifier: string };

  const verifyOtp = useCallback(async (params: VerifyOtpParams) => {
    try {
      const response = await authService.verifyOtp(params);

      if (response.success && 'user' in response.data && response.data.user) {
        await dispatch(checkAuthStatus());
      }

      return response;
    } catch (err) {
      throw err;
    }
  }, [dispatch]);

  const logout = useCallback(async () => {
    try {
      await dispatch(logoutUser()).unwrap();
    } catch (err) {
      throw err;
    }
  }, [dispatch]);

  const updateProfile = useCallback(async (userData: Partial<User>) => {
    try {
      await dispatch(updateProfileUser(userData)).unwrap();
    } catch (err) {
      throw err;
    }
  }, [dispatch]);

  const updateOnboardingStep = useCallback(async (step: string) => {
    try {
      await dispatch(updateOnboardingStepUser(step)).unwrap();
    } catch (err) {
      throw err;
    }
  }, [dispatch]);

  const handleClearError = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  const handleCheckAuthStatus = useCallback(async () => {
    await dispatch(checkAuthStatus());
  }, [dispatch]);

  return {
    isAuthenticated,
    user,
    isLoading,
    error,
    isOnboardingComplete: () => isOnboardingCompleteValue,
    getOnboardingNextStep: () => onboardingNextStep,
    login,
    signup,
    verifyOtp,
    logout,
    updateProfile,
    updateOnboardingStep,
    clearError: handleClearError,
    checkAuthStatus: handleCheckAuthStatus,
  };
};
