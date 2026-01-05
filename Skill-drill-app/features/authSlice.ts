import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { User } from '../services/api';

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  error: string;
  token: string;
  refreshToken: string;
  lastAuthCheck: number;
}

const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  isLoading: true,
  error: '',
  token: '',
  refreshToken: '',
  lastAuthCheck: 0,
};

// Async thunks for better performance
export const checkAuthStatus = createAsyncThunk(
  'auth/checkStatus',
  async (_, { rejectWithValue }) => {
    try {
      const { default: authService } = await import('../services/authService');
      const isAuthenticated = await authService.isAuthenticated();
      
      if (isAuthenticated) {
        const { isValid, user } = await authService.validateTokenAndGetUser();
        
        if (isValid && user) {
          return { isAuthenticated: true, user };
        } else {
          await authService.clearAuthData();
          return { isAuthenticated: false, user: null };
        }
      }
      
      return { isAuthenticated: false, user: null };
    } catch (error: unknown) {
      return rejectWithValue(error instanceof Error ? error.message : 'An error occurred');
    }
  }
);

export const loginUser = createAsyncThunk(
  'auth/login',
  async ({ emailOrPhone, password }: { emailOrPhone: string; password?: string }, { rejectWithValue }) => {
    try {
      const { default: authService } = await import('../services/authService');
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
        return response.data.user;
      } else {
        throw new Error(response.message);
      }
    } catch (error: unknown) {
      return rejectWithValue(error instanceof Error ? error.message : 'An error occurred');
    }
  }
);

export const verifyOtpUser = createAsyncThunk(
  'auth/verifyOtp',
  async ({ identifier, otp }: { identifier: string; otp: string }, { rejectWithValue }) => {
    try {
      const { default: authService } = await import('../services/authService');
      const response = await authService.verifyOtp({ identifier, otp });
      
      if (response.success && 'user' in response.data && response.data.user) {
        return response.data.user;
      } else {
        throw new Error(response.message);
      }
    } catch (error: unknown) {
      return rejectWithValue(error instanceof Error ? error.message : 'An error occurred');
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      const { default: authService } = await import('../services/authService');
      await authService.logout();
      return true;
    } catch (error: unknown) {
      return rejectWithValue(error instanceof Error ? error.message : 'An error occurred');
    }
  }
);

export const signupUser = createAsyncThunk(
  'auth/signup',
  async (
    { emailOrPhone, name, password }: { emailOrPhone: string; name: string; password?: string },
    { rejectWithValue }
  ) => {
    try {
      const { default: authService } = await import('../services/authService');
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
        return { user: response.data.user, response };
      } else {
        return { user: null, response };
      }
    } catch (error: unknown) {
      return rejectWithValue(error instanceof Error ? error.message : 'An error occurred');
    }
  }
);

export const updateProfileUser = createAsyncThunk(
  'auth/updateProfile',
  async (userData: Partial<User>, { rejectWithValue }) => {
    try {
      const { default: authService } = await import('../services/authService');

      const payload: Record<string, unknown> = {};
      if (userData.careerLevelId) payload.careerLevelId = userData.careerLevelId;
      if (userData.roleType) payload.roleType = userData.roleType;
      if (userData.onboardingStep) payload.onboardingStep = userData.onboardingStep;
      if (userData.name) payload.name = userData.name;
      if (userData.email) payload.email = userData.email;

      const response = await authService.updateProfileViaAPI(payload);

      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.message || 'Profile update failed');
      }
    } catch (error: unknown) {
      return rejectWithValue(error instanceof Error ? error.message : 'An error occurred');
    }
  }
);

export const updateOnboardingStepUser = createAsyncThunk(
  'auth/updateOnboardingStep',
  async (step: string, { dispatch, rejectWithValue }) => {
    try {
      const { default: authService } = await import('../services/authService');
      await authService.updateOnboardingStep(step);
      // Re-check auth status to get updated user data
      dispatch(checkAuthStatus());
      return step;
    } catch (error: unknown) {
      return rejectWithValue(error instanceof Error ? error.message : 'An error occurred');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = '';
    },
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
    },
    updateUserProfile: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
    setToken: (state, action: PayloadAction<string>) => {
      state.token = action.payload;
    },
    setRefreshToken: (state, action: PayloadAction<string>) => {
      state.refreshToken = action.payload;
    },
    setTokens: (state, action: PayloadAction<{ accessToken: string; refreshToken: string }>) => {
      state.token = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
    },
    clearAuth: (state) => {
      state.isAuthenticated = false;
      state.user = null;
      state.token = '';
      state.refreshToken = '';
      state.error = '';
    },
  },
  extraReducers: (builder) => {
    builder
      // Check auth status
      .addCase(checkAuthStatus.pending, (state) => {
        state.isLoading = true;
        state.error = '';
      })
      .addCase(checkAuthStatus.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = action.payload.isAuthenticated;
        state.user = action.payload.user;
        state.lastAuthCheck = Date.now();
      })
      .addCase(checkAuthStatus.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
        state.user = null;
      })

      // Login
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = '';
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload;
        state.error = '';
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Verify OTP
      .addCase(verifyOtpUser.pending, (state) => {
        state.isLoading = true;
        state.error = '';
      })
      .addCase(verifyOtpUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload;
        state.error = '';
      })
      .addCase(verifyOtpUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Logout
      .addCase(logoutUser.fulfilled, (state) => {
        state.isAuthenticated = false;
        state.user = null;
        state.token = '';
        state.refreshToken = '';
        state.error = '';
      })

      // Signup
      .addCase(signupUser.pending, (state) => {
        state.isLoading = true;
        state.error = '';
      })
      .addCase(signupUser.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload.user) {
          state.isAuthenticated = true;
          state.user = action.payload.user;
        }
        state.error = '';
      })
      .addCase(signupUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Update Profile
      .addCase(updateProfileUser.pending, (state) => {
        state.isLoading = true;
        state.error = '';
      })
      .addCase(updateProfileUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.error = '';
      })
      .addCase(updateProfileUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Update Onboarding Step
      .addCase(updateOnboardingStepUser.pending, (state) => {
        state.isLoading = true;
        state.error = '';
      })
      .addCase(updateOnboardingStepUser.fulfilled, (state) => {
        state.isLoading = false;
        state.error = '';
      })
      .addCase(updateOnboardingStepUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  clearError,
  setUser,
  updateUserProfile,
  setToken,
  setRefreshToken,
  setTokens,
  clearAuth
} = authSlice.actions;
export default authSlice.reducer;
