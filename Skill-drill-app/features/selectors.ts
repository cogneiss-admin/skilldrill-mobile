import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../store';

export const selectAuth = (state: RootState) => state.auth;
export const selectUser = (state: RootState) => state.auth.user;
export const selectIsAuthenticated = (state: RootState) => state.auth.isAuthenticated;
export const selectAuthLoading = (state: RootState) => state.auth.isLoading;
export const selectAuthError = (state: RootState) => state.auth.error;
export const selectAccessToken = (state: RootState) => state.auth.token;
export const selectRefreshToken = (state: RootState) => state.auth.refreshToken;

export const selectIsOnboardingComplete = createSelector(
  [selectUser],
  (user) => {
    if (!user) return false;
    return user.onboardingStep === 'Completed' || user.onboardingCompletedAt !== undefined;
  }
);

export const selectOnboardingNextStep = createSelector(
  [selectUser],
  (user) => {
    if (!user) return '/auth/login';

    switch (user.onboardingStep) {
      case 'EMAIL_VERIFIED':
      case 'PHONE_VERIFIED':
        return '/auth/careerRole';
      case 'Completed':
        return '/dashboard';
      default:
        if (!user.careerLevelId || !user.roleTypeId) {
          return '/auth/careerRole';
        }
        return '/auth/skills';
    }
  }
);

export const selectUserCareerLevel = createSelector(
  [selectUser],
  (user) => user?.careerLevel || null
);

export const selectUserRoleType = createSelector(
  [selectUser],
  (user) => user?.roleType || null
);

export const selectAppState = (state: RootState) => state.app;
export const selectAppReady = (state: RootState) => state.app.ready;
export const selectIsOnline = (state: RootState) => state.app.isOnline;
export const selectLastSyncTime = (state: RootState) => state.app.lastSyncTime;
export const selectTheme = (state: RootState) => state.app.ui.theme;
export const selectCurrentRoute = (state: RootState) => state.app.ui.currentRoute;
export const selectGlobalLoading = (state: RootState) => state.app.ui.isLoading;

export const selectCachedSkills = (state: RootState) => state.app.cache.skills;
export const selectCachedUserProfile = (state: RootState) => state.app.cache.userProfile;
export const selectCachedOnboardingData = (state: RootState) => state.app.cache.onboardingData;

export const selectIsAppReady = createSelector(
  [selectIsAuthenticated, selectIsOnboardingComplete, selectAuthLoading],
  (isAuthenticated, isOnboardingComplete, isLoading) => {
    if (isLoading) return false;
    return isAuthenticated && isOnboardingComplete;
  }
);

export const selectUserDisplayInfo = createSelector(
  [selectUser],
  (user) => {
    if (!user) return null;
    return {
      name: user.name,
      email: user.email,
      avatar: user.avatarUrl,
      isVerified: user.isVerified,
    };
  }
);
