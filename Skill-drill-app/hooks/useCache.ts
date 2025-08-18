import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../hooks';
import { 
  cacheSkills, 
  cacheUserProfile, 
  cacheOnboardingData, 
  clearCache,
  setLastSyncTime 
} from '../features/appSlice';

export const useCache = () => {
  const dispatch = useAppDispatch();
  const cache = useAppSelector(state => state.app.cache);
  const lastSyncTime = useAppSelector(state => state.app.lastSyncTime);

  const cacheSkillsData = useCallback((skills: any[]) => {
    dispatch(cacheSkills(skills));
    dispatch(setLastSyncTime(Date.now()));
  }, [dispatch]);

  const cacheUserProfileData = useCallback((profile: any) => {
    dispatch(cacheUserProfile(profile));
    dispatch(setLastSyncTime(Date.now()));
  }, [dispatch]);

  const cacheOnboardingDataData = useCallback((data: any) => {
    dispatch(cacheOnboardingData(data));
    dispatch(setLastSyncTime(Date.now()));
  }, [dispatch]);

  const clearAllCache = useCallback(() => {
    dispatch(clearCache());
  }, [dispatch]);

  const isCacheValid = useCallback((maxAge: number = 5 * 60 * 1000) => {
    if (!lastSyncTime) return false;
    return Date.now() - lastSyncTime < maxAge;
  }, [lastSyncTime]);

  const getCachedSkills = useCallback(() => {
    return cache.skills;
  }, [cache.skills]);

  const getCachedUserProfile = useCallback(() => {
    return cache.userProfile;
  }, [cache.userProfile]);

  const getCachedOnboardingData = useCallback(() => {
    return cache.onboardingData;
  }, [cache.onboardingData]);

  return {
    // Cache data
    skills: cache.skills,
    userProfile: cache.userProfile,
    onboardingData: cache.onboardingData,
    lastSyncTime,
    
    // Actions
    cacheSkills: cacheSkillsData,
    cacheUserProfile: cacheUserProfileData,
    cacheOnboardingData: cacheOnboardingDataData,
    clearCache: clearAllCache,
    
    // Utilities
    isCacheValid,
    getCachedSkills,
    getCachedUserProfile,
    getCachedOnboardingData,
    
    // Computed values
    hasSkills: cache.skills.length > 0,
    hasUserProfile: !!cache.userProfile,
    hasOnboardingData: !!cache.onboardingData,
    cacheAge: lastSyncTime ? Date.now() - lastSyncTime : null,
  };
};
