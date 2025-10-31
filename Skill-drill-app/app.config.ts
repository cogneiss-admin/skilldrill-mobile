import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'SkillDrill',
  slug: 'skilldrill',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'skilldrill',
  userInterfaceStyle: 'automatic',
  newArchEnabled: true,
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.skilldrill.app',
  },
  android: {
    package: 'com.skilldrill.app',
    adaptiveIcon: {
      foregroundImage: './assets/images/adaptive-icon.png',
      backgroundColor: '#ffffff',
    },
    edgeToEdgeEnabled: true,
  },
  web: {
    bundler: 'metro',
    output: 'static',
    favicon: './assets/images/favicon.png',
  },
  plugins: [
    'expo-router',
    'expo-font',
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    // Backend API Configuration
    // Use environment variable or default based on platform
    // Do NOT default to localhost here. Leave empty so runtime picks platform-safe fallback
    // Set EXPO_PUBLIC_API_BASE_URL to override (e.g., http://YOUR_LAN_IP:3000/api)
    API_BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL || '',
    API_TIMEOUT: parseInt(process.env.EXPO_PUBLIC_API_TIMEOUT || process.env.API_TIMEOUT || '10000'),
    
    // Authentication
    ACCESS_TOKEN_KEY: process.env.ACCESS_TOKEN_KEY || 'skilldrill_access_token',
    REFRESH_TOKEN_KEY: process.env.REFRESH_TOKEN_KEY || 'skilldrill_refresh_token',
    USER_DATA_KEY: process.env.USER_DATA_KEY || 'skilldrill_user_data',
    
    // App Configuration
    APP_NAME: process.env.APP_NAME || 'SkillDrill',
    APP_VERSION: process.env.APP_VERSION || '1.0.0',
    
    // Development
    DEBUG_MODE: process.env.DEBUG_MODE === 'true',
    
    // Feature Flags
    ENABLE_SOCIAL_LOGIN: process.env.ENABLE_SOCIAL_LOGIN !== 'false',
    ENABLE_PASSWORD_LOGIN: process.env.ENABLE_PASSWORD_LOGIN !== 'false',
    ENABLE_OTP_LOGIN: process.env.ENABLE_OTP_LOGIN !== 'false',
    
    // Social Authentication
    GOOGLE_CLIENT_ID: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
    LINKEDIN_CLIENT_ID: process.env.EXPO_PUBLIC_LINKEDIN_CLIENT_ID,
  },
});
