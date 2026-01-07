import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import tokenManager from '../utils/tokenManager';
import authService from '../services/authService';
import { setUser, setAuthenticated, clearAuth, setLoading } from '../features/authSlice';
import SessionManager from '../utils/sessionManager';
import type { AppDispatch } from '../store';

export function useAuthBootstrap() {
  const dispatch = useDispatch<AppDispatch>();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    async function bootstrap() {
      try {
        SessionManager.initialize();
        dispatch(setLoading(true));

        const hasSession = await tokenManager.hasValidSession();
        
        if (!hasSession) {
          dispatch(clearAuth());
          setIsInitialized(true);
          return;
        }

        try {
          await tokenManager.refreshAccessToken(async (refreshToken) => {
            const response = await authService.refreshToken(refreshToken);
            return {
              accessToken: response.data.accessToken,
              refreshToken: response.data.refreshToken,
            };
          });

          const profileResponse = await authService.getProfileFromAPI();
          
          if (profileResponse.success && profileResponse.data) {
            dispatch(setUser(profileResponse.data));
            dispatch(setAuthenticated(true));
          } else {
            await tokenManager.clearAllTokens();
            dispatch(clearAuth());
          }
        } catch {
          await tokenManager.clearAllTokens();
          dispatch(clearAuth());
        }
      } catch {
        dispatch(clearAuth());
      } finally {
        dispatch(setLoading(false));
        setIsInitialized(true);
      }
    }

    bootstrap();
  }, [dispatch]);

  return { isInitialized };
}

export default useAuthBootstrap;

