import { useCallback, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../hooks';
import { 
  setAppLoadTime, 
  updateLastInteraction, 
  setCurrentRoute,
  setLoading,
  setOnlineStatus 
} from '../features/appSlice';

export const usePerformance = () => {
  const dispatch = useAppDispatch();
  const performance = useAppSelector(state => state.app.performance);
  const ui = useAppSelector(state => state.app.ui);
  const isOnline = useAppSelector(state => state.app.isOnline);

  // Track app load time
  const trackAppLoad = useCallback(() => {
    const loadTime = Date.now();
    dispatch(setAppLoadTime(loadTime));
  }, [dispatch]);

  // Track user interactions
  const trackInteraction = useCallback(() => {
    dispatch(updateLastInteraction());
  }, [dispatch]);

  // Track route changes
  const trackRouteChange = useCallback((route: string) => {
    dispatch(setCurrentRoute(route));
    trackInteraction();
  }, [dispatch, trackInteraction]);

  // Track loading states
  const setLoadingState = useCallback((loading: boolean) => {
    dispatch(setLoading(loading));
  }, [dispatch]);

  // Track online status
  const setOnlineState = useCallback((online: boolean) => {
    dispatch(setOnlineStatus(online));
  }, [dispatch]);

  // Auto-track interactions
  useEffect(() => {
    const handleInteraction = () => {
      trackInteraction();
    };

    // Track various user interactions
    document.addEventListener('touchstart', handleInteraction, { passive: true });
    document.addEventListener('click', handleInteraction, { passive: true });
    document.addEventListener('scroll', handleInteraction, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleInteraction);
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('scroll', handleInteraction);
    };
  }, [trackInteraction]);

  // Track online/offline status
  useEffect(() => {
    const handleOnline = () => setOnlineState(true);
    const handleOffline = () => setOnlineState(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [setOnlineState]);

  return {
    // Performance metrics
    appLoadTime: performance.appLoadTime,
    lastInteractionTime: performance.lastInteractionTime,
    
    // UI state
    currentRoute: ui.currentRoute,
    isLoading: ui.isLoading,
    isOnline,
    
    // Actions
    trackAppLoad,
    trackInteraction,
    trackRouteChange,
    setLoadingState,
    setOnlineState,
    
    // Computed values
    timeSinceLastInteraction: performance.lastInteractionTime 
      ? Date.now() - performance.lastInteractionTime 
      : 0,
    appLoadDuration: performance.appLoadTime 
      ? performance.appLoadTime - (performance.appLoadTime - 1000) // Approximate
      : null,
  };
};
