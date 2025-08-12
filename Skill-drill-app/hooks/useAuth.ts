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
      
      const isAuthenticated = await authService.isAuthenticated();
      const user = await authService.getUserData();
      
      setAuthState({
        isAuthenticated,
        user,
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      setAuthState({
        isAuthenticated: false,
        user: null,
        isLoading: false,
        error: error.message,
      });
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
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const response = await authService.verifyOtp({
        identifier,
        otp,
      });
      
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
      await authService.updateUserProfile(userData);
      
      setAuthState(prev => ({
        ...prev,
        user: prev.user ? { ...prev.user, ...userData } : null,
      }));
    } catch (error: any) {
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
    login,
    signup,
    verifyOtp,
    logout,
    updateProfile,
    clearError,
    checkAuthStatus,
  };
};
