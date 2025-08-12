import { useState } from 'react';
import { Alert } from 'react-native';
import socialAuthService, { SocialProvider } from '../services/socialAuthService';
import { useAuth } from './useAuth';

export const useSocialAuth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { updateProfile } = useAuth();

  const signInWithProvider = async (provider: SocialProvider) => {
    try {
      setIsLoading(true);
      setError(null);

      console.log(`🚀 Starting ${provider} authentication...`);

      // Check if provider is available
      if (!socialAuthService.isProviderAvailable(provider)) {
        throw new Error(`${provider} authentication is not configured`);
      }

      // Check network connectivity (basic check)
      // Note: navigator.onLine is not reliable in React Native
      // We'll let the actual network requests handle connectivity issues
      console.log('🌐 Network check skipped - will rely on actual network requests');

      // Perform social authentication
      const response = await socialAuthService.signInWithProvider(provider);

      if (response.success && response.data.user) {
        // Update local user profile
        await updateProfile(response.data.user);
        
        Alert.alert(
          'Success',
          `Successfully signed in with ${provider}!`,
          [{ text: 'OK' }]
        );

        return response;
      } else {
        throw new Error(response.message || `${provider} authentication failed`);
      }
    } catch (error: any) {
      console.error(`❌ ${provider} authentication error:`, error);
      
      let errorMessage = error.message || `${provider} authentication failed`;
      
      // Enhanced error handling
      if (error.message?.includes('not configured')) {
        errorMessage = `${provider} authentication is not configured. Please check your environment variables.`;
      } else if (error.message?.includes('network')) {
        errorMessage = 'Network error. Please check your internet connection.';
      } else if (error.message?.includes('cancelled')) {
        errorMessage = 'Authentication was cancelled.';
      } else if (error.message?.includes('Incomplete user data')) {
        errorMessage = 'Unable to get complete profile information. Please try again.';
      } else if (error.message?.includes('Invalid email format')) {
        errorMessage = 'Invalid email format received. Please check your account settings.';
      } else if (error.message?.includes('Client ID is not configured')) {
        errorMessage = `${provider} Client ID is not configured. Please set the environment variable.`;
      }
      
      setError(errorMessage);
      
      Alert.alert(
        'Authentication Error',
        errorMessage,
        [{ text: 'OK' }]
      );

      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithGoogle = () => signInWithProvider('GOOGLE');
  const signInWithLinkedIn = () => signInWithProvider('LINKEDIN');

  const isProviderAvailable = (provider: SocialProvider) => {
    return socialAuthService.isProviderAvailable(provider);
  };

  const getAvailableProviders = () => {
    return socialAuthService.getAvailableProviders();
  };

  const clearError = () => {
    setError(null);
  };

  return {
    isLoading,
    error,
    signInWithProvider,
    signInWithGoogle,
    signInWithLinkedIn,
    isProviderAvailable,
    getAvailableProviders,
    clearError,
  };
};

