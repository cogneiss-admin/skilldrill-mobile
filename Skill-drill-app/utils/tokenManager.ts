import * as SecureStore from 'expo-secure-store';

const SECURE_KEYS = {
  REFRESH_TOKEN: 'sd_refresh_token',
  TOKEN_METADATA: 'sd_token_meta',
} as const;

interface TokenMetadata {
  accessTokenExpiry: number;
  refreshTokenExpiry: number;
  lastRefresh: number;
}

class TokenManager {
  private accessToken: string | null = null;
  private refreshPromise: Promise<string> | null = null;

  getAccessToken(): string | null {
    return this.accessToken;
  }

  setAccessToken(token: string | null): void {
    this.accessToken = token;
  }

  clearAccessToken(): void {
    this.accessToken = null;
  }

  isAccessTokenExpired(): boolean {
    if (!this.accessToken) return true;
    try {
      const payload = this.decodeTokenPayload(this.accessToken);
      const bufferSeconds = 60;
      return Date.now() >= (payload.exp * 1000) - (bufferSeconds * 1000);
    } catch {
      return true;
    }
  }

  async getRefreshToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(SECURE_KEYS.REFRESH_TOKEN);
    } catch {
      return null;
    }
  }

  async setRefreshToken(token: string): Promise<void> {
    await SecureStore.setItemAsync(SECURE_KEYS.REFRESH_TOKEN, token);
    await this.updateTokenMetadata({ lastRefresh: Date.now() });
  }

  async clearRefreshToken(): Promise<void> {
    await SecureStore.deleteItemAsync(SECURE_KEYS.REFRESH_TOKEN);
  }

  private async getTokenMetadata(): Promise<TokenMetadata | null> {
    try {
      const data = await SecureStore.getItemAsync(SECURE_KEYS.TOKEN_METADATA);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  private async updateTokenMetadata(partial: Partial<TokenMetadata>): Promise<void> {
    const existing = await this.getTokenMetadata() || {
      accessTokenExpiry: 0,
      refreshTokenExpiry: 0,
      lastRefresh: 0,
    };
    await SecureStore.setItemAsync(
      SECURE_KEYS.TOKEN_METADATA,
      JSON.stringify({ ...existing, ...partial })
    );
  }

  async clearAllTokens(): Promise<void> {
    this.accessToken = null;
    await Promise.all([
      SecureStore.deleteItemAsync(SECURE_KEYS.REFRESH_TOKEN),
      SecureStore.deleteItemAsync(SECURE_KEYS.TOKEN_METADATA),
    ]);
  }

  async refreshAccessToken(
    refreshFn: (refreshToken: string) => Promise<{ accessToken: string; refreshToken: string }>
  ): Promise<string> {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = this.executeRefresh(refreshFn);
    
    try {
      return await this.refreshPromise;
    } finally {
      this.refreshPromise = null;
    }
  }

  private async executeRefresh(
    refreshFn: (refreshToken: string) => Promise<{ accessToken: string; refreshToken: string }>
  ): Promise<string> {
    const currentRefreshToken = await this.getRefreshToken();
    
    if (!currentRefreshToken) {
      throw new Error('No refresh token available');
    }

    const { accessToken, refreshToken: newRefreshToken } = await refreshFn(currentRefreshToken);

    this.setAccessToken(accessToken);
    await this.setRefreshToken(newRefreshToken);

    return accessToken;
  }

  private decodeTokenPayload(token: string): { exp: number; iat: number; id: string } {
    const parts = token.split('.');
    if (parts.length !== 3) throw new Error('Invalid token format');
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  }

  async hasValidSession(): Promise<boolean> {
    const refreshToken = await this.getRefreshToken();
    return !!refreshToken;
  }
}

export const tokenManager = new TokenManager();
export default tokenManager;

