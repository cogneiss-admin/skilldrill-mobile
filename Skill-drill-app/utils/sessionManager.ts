import { router } from 'expo-router';
import tokenManager from './tokenManager';

export class SessionManager {
  private static isHandlingSessionExpiration = false;
  private static isLoggingOut = false;
  private static logoutTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private static sessionExpirationDebounceTimer: ReturnType<typeof setTimeout> | null = null;

  static setLoggingOut(isLoggingOut: boolean): void {
    this.isLoggingOut = isLoggingOut;
    
    if (isLoggingOut) {
      if (this.logoutTimeoutId) {
        clearTimeout(this.logoutTimeoutId);
      }
      this.logoutTimeoutId = setTimeout(() => {
        this.isLoggingOut = false;
        this.logoutTimeoutId = null;
      }, 10000);
    } else {
      if (this.logoutTimeoutId) {
        clearTimeout(this.logoutTimeoutId);
        this.logoutTimeoutId = null;
      }
    }
  }

  static isCurrentlyLoggingOut(): boolean {
    return this.isLoggingOut;
  }

  static async handleSessionExpiration() {
    if (this.isLoggingOut) {
      return;
    }

    if (this.isHandlingSessionExpiration) {
      return;
    }

    if (this.sessionExpirationDebounceTimer) {
      return;
    }

    this.sessionExpirationDebounceTimer = setTimeout(() => {
      this.sessionExpirationDebounceTimer = null;
    }, 500);

    this.isHandlingSessionExpiration = true;

    try {
      await this.clearAuthData();
      this.redirectToLogin();
    } catch {
      this.redirectToLogin();
    } finally {
      setTimeout(() => {
        this.isHandlingSessionExpiration = false;
      }, 2000);
    }
  }

  static async clearAuthData(): Promise<void> {
    try {
      const { store } = await import('../store');
      const { clearAuth } = await import('../features/authSlice');
      
      store.dispatch(clearAuth());
      await tokenManager.clearAllTokens();
    } catch {
    }
  }

  static redirectToLogin(): void {
    try {
      this.isLoggingOut = false;
      if (this.logoutTimeoutId) {
        clearTimeout(this.logoutTimeoutId);
        this.logoutTimeoutId = null;
      }
      
      router.replace('/auth/login');
    } catch {
      try {
        router.replace('/');
      } catch {
      }
    }
  }

  static isOnProtectedRoute(): boolean {
    return true;
  }

  static async handleTokenRefreshFailure(): Promise<void> {
    await this.handleSessionExpiration();
  }

  static async handleInvalidToken(): Promise<void> {
    await this.handleSessionExpiration();
  }

  static async handleUnauthorized(): Promise<void> {
    await this.handleSessionExpiration();
  }

  static async triggerSessionExpiration(): Promise<void> {
    await this.handleSessionExpiration();
  }

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

  static initialize(): void {
    this.resetFlags();
  }
}

export default SessionManager;
