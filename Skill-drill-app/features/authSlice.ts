import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { User } from '../services/api';
import authService from '../services/authService';

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  error: string | null;
  token: string | null;
  lastAuthCheck: number | null;
}

const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  isLoading: true,
  error: null,
  token: null,
  lastAuthCheck: null,
};

// Async thunks for better performance
export const checkAuthStatus = createAsyncThunk(
  'auth/checkStatus',
  async (_, { rejectWithValue }) => {
    try {
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
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const loginUser = createAsyncThunk(
  'auth/login',
  async ({ emailOrPhone, password }: { emailOrPhone: string; password?: string }, { rejectWithValue }) => {
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
          response = await authService.loginWithPhone({ phone_no: emailOrPhone });
        }
      }
      
      if (response.success && 'user' in response.data && response.data.user) {
        return response.data.user;
      } else {
        throw new Error(response.message);
      }
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const verifyOtpUser = createAsyncThunk(
  'auth/verifyOtp',
  async ({ identifier, otp }: { identifier: string; otp: string }, { rejectWithValue }) => {
    try {
      const response = await authService.verifyOtp({ identifier, otp });
      
      if (response.success && 'user' in response.data && response.data.user) {
        return response.data.user;
      } else {
        throw new Error(response.message);
      }
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await authService.logout();
      return true;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
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
  },
  extraReducers: (builder) => {
    builder
      // Check auth status
      .addCase(checkAuthStatus.pending, (state) => {
        state.isLoading = true;
        state.error = null;
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
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Verify OTP
      .addCase(verifyOtpUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(verifyOtpUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload;
        state.error = null;
      })
      .addCase(verifyOtpUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Logout
      .addCase(logoutUser.fulfilled, (state) => {
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.error = null;
      });
  },
});

export const { clearError, setUser, updateUserProfile, setToken } = authSlice.actions;
export default authSlice.reducer;
