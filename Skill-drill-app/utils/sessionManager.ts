import { Alert } from 'react-native';
import { router } from 'expo-router';
import { store, persistor } from '../store';
import { clearAuth } from '../features/authSlice';
import * as SecureStore from 'expo-secure-store';

export class SessionManager {
  private static isHandlingSessionExpiration = false;
  private static isLoggingOut = false;
  private static logoutTimeoutId: NodeJS.Timeout | null = null;
  private static sessionExpirationDebounceTimer: NodeJS.Timeout | null = null;

  /**
   * Set logout state to prevent session expiration alerts during logout
   */
  static setLoggingOut(isLoggingOut: boolean): void {
    this.isLoggingOut = isLoggingOut;
    
    if (isLoggingOut) {
      // Set a timeout to automatically reset the logout flag after 10 seconds
      // This prevents the flag from getting stuck if logout fails or is interrupted
      if (this.logoutTimeoutId) {
        clearTimeout(this.logoutTimeoutId);
      }
      this.logoutTimeoutId = setTimeout(() => {
        console.log('🔐 Auto-resetting logout flag after timeout');
        this.isLoggingOut = false;
        this.logoutTimeoutId = null;
      }, 10000); // 10 seconds timeout
    } else {
      // Clear the timeout if logout is completed normally
      if (this.logoutTimeoutId) {
        clearTimeout(this.logoutTimeoutId);
        this.logoutTimeoutId = null;
      }
    }
  }

  /**
   * Check if currently logging out
   */
  static isCurrentlyLoggingOut(): boolean {
    return this.isLoggingOut;
  }

  /**
   * Handle session expiration by showing alert and redirecting to login
   * Uses debouncing to prevent multiple alerts from race conditions
   */
  static async handleSessionExpiration(reason: string = 'Session expired') {
    // Don't show session expiration alert if user is logging out
    if (this.isLoggingOut) {
      console.log('🔐 Skipping session expiration alert - user is logging out');
      return;
    }

    // Prevent multiple simultaneous session expiration handlers
    if (this.isHandlingSessionExpiration) {
      console.log('🔐 Session expiration already being handled, skipping duplicate');
      return;
    }

    // Debounce: If multiple calls happen within 500ms, only process the first one
    if (this.sessionExpirationDebounceTimer) {
      console.log('🔐 Session expiration debounced, skipping duplicate within 500ms');
      return;
    }

    this.sessionExpirationDebounceTimer = setTimeout(() => {
      this.sessionExpirationDebounceTimer = null;
    }, 500);

    this.isHandlingSessionExpiration = true;

    try {
      console.log(`🔐 Handling session expiration: ${reason}`);

      // Clear all auth data
      await this.clearAuthData();

      // Show alert to user
      Alert.alert(
        'Session Expired',
        `${reason}. Please log in again.`,
        [
          {
            text: 'OK',
            onPress: () => {
              // Navigate to login screen
              this.redirectToLogin();
            }
          }
        ],
        { cancelable: false }
      );
    } catch (error) {
      console.error('❌ Error handling session expiration:', error);
      // Fallback: just redirect to login
      this.redirectToLogin();
    } finally {
      // Reset flag after a delay to allow for navigation
      setTimeout(() => {
        this.isHandlingSessionExpiration = false;
      }, 2000); // Increased to 2 seconds for better safety
    }
  }

  /**
   * Clear all authentication data from Redux and SecureStore
   */
  static async clearAuthData(): Promise<void> {
    try {
      // Clear Redux state (in-memory tokens + user data)
      store.dispatch(clearAuth());

      // Clear persisted SecureStore data (refresh token)
      await SecureStore.deleteItemAsync('auth');

      // Purge redux-persist storage
      await persistor.purge();

      console.log('🔐 Auth data cleared successfully from Redux + SecureStore');
    } catch (error) {
      console.error('Error clearing auth data:', error);
    }
  }

  /**
   * Redirect to login screen
   */
  static redirectToLogin(): void {
    try {
      // Reset logout flag when redirecting to login
      this.isLoggingOut = false;
      if (this.logoutTimeoutId) {
        clearTimeout(this.logoutTimeoutId);
        this.logoutTimeoutId = null;
      }
      
      // Navigate to login screen and reset the navigation stack
      router.replace('/auth/login');
      console.log('🔄 Redirected to login screen');
    } catch (error) {
      console.error('Error redirecting to login:', error);
      // Fallback: try to navigate to the root
      try {
        router.replace('/');
      } catch (fallbackError) {
        console.error('Fallback navigation failed:', fallbackError);
      }
    }
  }

  /**
   * Check if user is currently on a protected route
   */
  static isOnProtectedRoute(): boolean {
    // Add logic to check if current route requires authentication
    // For now, we'll assume all routes except login/signup are protected
    const currentPath = router.getCurrentPath?.() || '';
    const publicRoutes = ['/auth/login', '/auth/signup', '/auth/otp', '/'];
    
    return !publicRoutes.some(route => currentPath.startsWith(route));
  }

  /**
   * Handle token refresh failure
   */
  static async handleTokenRefreshFailure(): Promise<void> {
    await this.handleSessionExpiration('Your session has expired');
  }

  /**
   * Handle invalid token error
   */
  static async handleInvalidToken(): Promise<void> {
    await this.handleSessionExpiration('Invalid session token');
  }

  /**
   * Handle unauthorized access
   */
  static async handleUnauthorized(): Promise<void> {
    await this.handleSessionExpiration('Unauthorized access');
  }

  /**
   * Manually trigger session expiration (for testing purposes)
   */
  static async triggerSessionExpiration(reason: string = 'Session expired'): Promise<void> {
    await this.handleSessionExpiration(reason);
  }

  /**
   * Reset all session management flags (for cleanup purposes)
   */
  static resetFlags(): void {
    this.isHandlingSessionExpiration = false;
    this.isLoggingOut = false;
    if (this.logoutTimeoutId) {
      clearTimeout(this.logoutTimeoutId);
      this.logoutTimeoutId = null;
    }
    if (this.sessionExpirationDebounceTimer) {
      clearTimeout(this.sessionExpirationDebounceTimer);
      this.sessionExpirationDebounceTimer = null;
    }
  }

  /**
   * Initialize session manager (call this when app starts)
   */
  static initialize(): void {
    // Reset all flags when app initializes
    this.resetFlags();
    console.log('🔐 SessionManager initialized');
  }
}

export default SessionManager;
