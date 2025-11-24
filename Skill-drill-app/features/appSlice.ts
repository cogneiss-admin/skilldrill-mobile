import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { Skill } from "./skillsSlice";
import { User } from "../services/api";

export type AppState = {
  ready: boolean;
  isOnline: boolean;
  lastSyncTime: number | null;
  cache: {
    skills: Skill[];
    userProfile: User | null;
    onboardingData: Record<string, unknown> | null;
  };
  performance: {
    appLoadTime: number | null;
    lastInteractionTime: number;
  };
  ui: {
    currentRoute: string;
    isLoading: boolean;
    theme: 'light' | 'dark' | 'auto';
  };
};

const initialState: AppState = {
  ready: false,
  isOnline: true,
  lastSyncTime: null,
  cache: {
    skills: [],
    userProfile: null,
    onboardingData: null,
  },
  performance: {
    appLoadTime: null,
    lastInteractionTime: Date.now(),
  },
  ui: {
    currentRoute: '/',
    isLoading: false,
    theme: 'auto',
  },
};

const appSlice = createSlice({
  name: "app",
  initialState,
  reducers: {
    setReady(state, action: PayloadAction<boolean | undefined>) {
      state.ready = action.payload ?? true;
    },
    setOnlineStatus(state, action: PayloadAction<boolean>) {
      state.isOnline = action.payload;
    },
    setLastSyncTime(state, action: PayloadAction<number>) {
      state.lastSyncTime = action.payload;
    },
    cacheSkills(state, action: PayloadAction<Skill[]>) {
      state.cache.skills = action.payload;
    },
    cacheUserProfile(state, action: PayloadAction<User>) {
      state.cache.userProfile = action.payload;
    },
    cacheOnboardingData(state, action: PayloadAction<Record<string, unknown>>) {
      state.cache.onboardingData = action.payload;
    },
    clearCache(state) {
      state.cache = initialState.cache;
    },
    setAppLoadTime(state, action: PayloadAction<number>) {
      state.performance.appLoadTime = action.payload;
    },
    updateLastInteraction(state) {
      state.performance.lastInteractionTime = Date.now();
    },
    setCurrentRoute(state, action: PayloadAction<string>) {
      state.ui.currentRoute = action.payload;
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.ui.isLoading = action.payload;
    },
    setTheme(state, action: PayloadAction<'light' | 'dark' | 'auto'>) {
      state.ui.theme = action.payload;
    },
  },
});

export const { 
  setReady, 
  setOnlineStatus, 
  setLastSyncTime, 
  cacheSkills, 
  cacheUserProfile, 
  cacheOnboardingData,
  clearCache,
  setAppLoadTime,
  updateLastInteraction,
  setCurrentRoute,
  setLoading,
  setTheme,
} = appSlice.actions;

export default appSlice.reducer;
