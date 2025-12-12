import { Alert } from 'react-native';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';

export class SessionManager {
  private static isHandlingSessionExpiration = false;
  private static isLoggingOut = false;
  private static logoutTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private static sessionExpirationDebounceTimer: ReturnType<typeof setTimeout> | null = null;

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
      return;
    }

    // Prevent multiple simultaneous session expiration handlers
    if (this.isHandlingSessionExpiration) {
      return;
    }

    // Debounce: If multiple calls happen within 500ms, only process the first one
    if (this.sessionExpirationDebounceTimer) {
      return;
    }

    this.sessionExpirationDebounceTimer = setTimeout(() => {
      this.sessionExpirationDebounceTimer = null;
    }, 500);

    this.isHandlingSessionExpiration = true;

    try {
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
      // Lazy import to avoid circular dependency
      const { store, persistor } = await import('../store');
      const { clearAuth } = await import('../features/authSlice');
      
      // Clear Redux state (in-memory tokens + user data)
      store.dispatch(clearAuth());

      // Clear persisted SecureStore data (refresh token)
      await SecureStore.deleteItemAsync('auth');

      // Purge redux-persist storage
      await persistor.purge();
    } catch (error) {
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
    } catch (error) {
      // Fallback: try to navigate to the root
      try {
        router.replace('/');
      } catch (fallbackError) {
      }
    }
  }

  /**
   * Check if user is currently on a protected route
   */
  static isOnProtectedRoute(): boolean {
    // Add logic to check if current route requires authentication
    // For now, we'll assume all routes except login/signup are protected
    const publicRoutes = ['/auth/login', '/auth/signup', '/auth/otp', '/'];
    return true;
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
  }
}

export default SessionManager;
