import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';
import authService, { AuthSuccessResponse } from './authService';
import { ApiResponse } from './api';

// Complete the auth session
WebBrowser.maybeCompleteAuthSession();

// Social provider types
export type SocialProvider = 'GOOGLE' | 'LINKEDIN';

// Social auth configuration
interface SocialAuthConfig {
  google: {
    clientId: string;
    redirectUri: string;
    scopes: string[];
  };
  linkedin: {
    clientId: string;
    redirectUri: string;
    scopes: string[];
  };
}

// Social user data interface
export interface SocialUserData {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  provider: SocialProvider;
}

class SocialAuthService {
  private config: SocialAuthConfig;

  constructor() {
    // Determine the appropriate redirect URI based on platform
    const isAndroid = Platform.OS === 'android';
    const isEmulator = __DEV__; // Assume development is emulator
    
    let googleRedirectUri;
    if (isAndroid && isEmulator) {
      // Use custom scheme for Android emulator
      googleRedirectUri = AuthSession.makeRedirectUri({
        scheme: 'skilldrill',
        path: 'auth/google',
      });
    } else {
      // Use web-based redirect for other platforms
      googleRedirectUri = 'http://localhost:3001/auth/google';
    }

    this.config = {
      google: {
        clientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || 'your-google-client-id',
        redirectUri: googleRedirectUri,
        scopes: ['openid', 'profile', 'email'],
      },
      linkedin: {
        clientId: process.env.EXPO_PUBLIC_LINKEDIN_CLIENT_ID || 'your-linkedin-client-id',
        redirectUri: AuthSession.makeRedirectUri({
          scheme: 'skilldrill',
          path: 'auth/linkedin',
        }),
        scopes: ['r_liteprofile', 'r_emailaddress'],
      },
    };
  }

  // Google Authentication
  public async signInWithGoogle(): Promise<ApiResponse<AuthSuccessResponse>> {
    try {
      // Debug configuration
      console.log('🔍 Google OAuth Configuration:');
      console.log('Client ID:', this.config.google.clientId);
      console.log('Scopes:', this.config.google.scopes);

      // Check if client ID is properly configured
      if (!this.config.google.clientId || this.config.google.clientId === 'your-google-client-id' || this.config.google.clientId === 'your-actual-google-client-id-here') {
        throw new Error('Google Client ID is not configured. Please set EXPO_PUBLIC_GOOGLE_CLIENT_ID in your .env file with your actual Google Client ID.');
      }

      // For Android clients, we don't use redirect URI in the OAuth flow
      const request = new AuthSession.AuthRequest({
        clientId: this.config.google.clientId,
        scopes: this.config.google.scopes,
        redirectUri: this.config.google.redirectUri, // Keep for TypeScript compatibility
        responseType: AuthSession.ResponseType.Code,
        extraParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      });

      console.log('🚀 Starting Google OAuth flow for Android...');
      const result = await request.promptAsync({
        authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
      });

      console.log('📱 OAuth Result:', result.type, (result as any).params);

      if (result.type === 'success' && result.params.code) {
        console.log('✅ Authorization code received, exchanging for tokens...');
        return await this.handleGoogleCallback(result.params.code);
      } else if (result.type === 'cancel') {
        throw new Error('Google authentication was cancelled by user');
      } else if (result.type === 'error') {
        throw new Error(`Google OAuth error: ${result.error?.message || 'Unknown error'}`);
      } else {
        throw new Error('Google authentication failed - no authorization code received');
      }
    } catch (error: any) {
      console.error('❌ Google sign-in error:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        stack: error.stack
      });
      throw new Error(error.message || 'Google authentication failed');
    }
  }

  private async handleGoogleCallback(code: string): Promise<ApiResponse<AuthSuccessResponse>> {
    try {
      console.log('🔄 Exchanging authorization code for tokens...');
      
      // For Android clients, we don't include redirect_uri in token exchange
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: this.config.google.clientId,
          code,
          grant_type: 'authorization_code',
          redirect_uri: this.config.google.redirectUri, // Include for compatibility
        }),
      });

      console.log('📡 Token response status:', tokenResponse.status);
      const tokenData = await tokenResponse.json();
      console.log('📡 Token response data:', tokenData);

      if (!tokenResponse.ok) {
        console.error('❌ Token exchange failed:', tokenData);
        throw new Error(tokenData.error_description || `Failed to get Google tokens: ${tokenResponse.status}`);
      }

      // Get user info
      const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      });

      const userData = await userResponse.json();

      if (!userResponse.ok) {
        throw new Error('Failed to get Google user info');
      }

      // Validate required user data
      if (!userData.id || !userData.email || !userData.name) {
        throw new Error('Incomplete user data received from Google');
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(userData.email)) {
        throw new Error('Invalid email format received from Google');
      }

      // Create social user data
      const socialUserData: SocialUserData = {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        avatar_url: userData.picture || null,
        provider: 'GOOGLE',
      };

      // Send to backend for authentication
      return await authService.signupWithSocial({
        social_id: socialUserData.id,
        email: socialUserData.email,
        name: socialUserData.name,
        auth_provider: 'GOOGLE',
        avatar_url: socialUserData.avatar_url,
      });
    } catch (error: any) {
      console.error('Google callback error:', error);
      throw new Error(error.message || 'Google authentication failed');
    }
  }

  // LinkedIn Authentication
  public async signInWithLinkedIn(): Promise<ApiResponse<AuthSuccessResponse>> {
    try {
      const request = new AuthSession.AuthRequest({
        clientId: this.config.linkedin.clientId,
        scopes: this.config.linkedin.scopes,
        redirectUri: this.config.linkedin.redirectUri,
        responseType: AuthSession.ResponseType.Code,
        extraParams: {
          state: await Crypto.digestStringAsync(
            Crypto.CryptoDigestAlgorithm.SHA256,
            Math.random().toString(),
            { encoding: Crypto.CryptoEncoding.HEX }
          ),
        },
      });

      const result = await request.promptAsync({
        authorizationEndpoint: 'https://www.linkedin.com/oauth/v2/authorization',
      });

      if (result.type === 'success' && result.params.code) {
        return await this.handleLinkedInCallback(result.params.code);
      } else {
        throw new Error('LinkedIn authentication was cancelled or failed');
      }
    } catch (error: any) {
      console.error('LinkedIn sign-in error:', error);
      throw new Error(error.message || 'LinkedIn authentication failed');
    }
  }

  private async handleLinkedInCallback(code: string): Promise<ApiResponse<AuthSuccessResponse>> {
    try {
      // Exchange code for tokens
      const tokenResponse = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: this.config.linkedin.clientId,
          code,
          grant_type: 'authorization_code',
          redirect_uri: this.config.linkedin.redirectUri,
        }),
      });

      const tokenData = await tokenResponse.json();

      if (!tokenResponse.ok) {
        throw new Error(tokenData.error_description || 'Failed to get LinkedIn tokens');
      }

      // Get user profile
      const profileResponse = await fetch('https://api.linkedin.com/v2/me', {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      });

      const profileData = await profileResponse.json();

      if (!profileResponse.ok) {
        throw new Error('Failed to get LinkedIn profile');
      }

      // Get user email
      const emailResponse = await fetch('https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))', {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      });

      const emailData = await emailResponse.json();

      if (!emailResponse.ok) {
        throw new Error('Failed to get LinkedIn email');
      }

      const email = emailData.elements?.[0]?.['handle~']?.emailAddress;

      if (!email) {
        throw new Error('LinkedIn email not found');
      }

      // Validate required user data
      if (!profileData.id || !email || !profileData.localizedFirstName || !profileData.localizedLastName) {
        throw new Error('Incomplete user data received from LinkedIn');
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new Error('Invalid email format received from LinkedIn');
      }

      // Create social user data
      const socialUserData: SocialUserData = {
        id: profileData.id,
        email,
        name: `${profileData.localizedFirstName} ${profileData.localizedLastName}`,
        avatar_url: undefined, // LinkedIn doesn't provide avatar in basic profile
        provider: 'LINKEDIN',
      };

      // Send to backend for authentication
      return await authService.signupWithSocial({
        social_id: socialUserData.id,
        email: socialUserData.email,
        name: socialUserData.name,
        auth_provider: 'LINKEDIN',
        avatar_url: socialUserData.avatar_url,
      });
    } catch (error: any) {
      console.error('LinkedIn callback error:', error);
      throw new Error(error.message || 'LinkedIn authentication failed');
    }
  }

  // Generic social sign-in method
  public async signInWithProvider(provider: SocialProvider): Promise<ApiResponse<AuthSuccessResponse>> {
    switch (provider) {
      case 'GOOGLE':
        return await this.signInWithGoogle();
      case 'LINKEDIN':
        return await this.signInWithLinkedIn();
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  }

  // Check if social auth is available
  public isProviderAvailable(provider: SocialProvider): boolean {
    switch (provider) {
      case 'GOOGLE':
        return !!this.config.google.clientId && this.config.google.clientId !== 'your-google-client-id';
      case 'LINKEDIN':
        return !!this.config.linkedin.clientId && this.config.linkedin.clientId !== 'your-linkedin-client-id';
      default:
        return false;
    }
  }

  // Get available providers
  public getAvailableProviders(): SocialProvider[] {
    const providers: SocialProvider[] = [];
    
    if (this.isProviderAvailable('GOOGLE')) {
      providers.push('GOOGLE');
    }
    
    if (this.isProviderAvailable('LINKEDIN')) {
      providers.push('LINKEDIN');
    }
    
    return providers;
  }
}

// Create and export singleton instance
export const socialAuthService = new SocialAuthService();
export default socialAuthService;

