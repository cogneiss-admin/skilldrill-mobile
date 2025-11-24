/**
 * useSubscription Hook
 *
 * Manages user subscription state and drill credits.
 *
 * Features:
 * - Load subscription status
 * - Track available drill credits
 * - Check if user can unlock drills
 * - Handle subscription-based drill unlocking
 * - Refresh subscription data
 *
 * Usage:
 * const {
 *   loading,
 *   subscription,
 *   hasActiveSubscription,
 *   availableCredits,
 *   canUnlockDrills,
 *   unlockWithCredits,
 *   refresh
 * } = useSubscription();
 */

import { useState, useEffect, useCallback } from 'react';
import apiService from '../services/api';
import { useToast } from './useToast';

interface Subscription {
  id: string;
  userId: string;
  plan: string; // 'MONTHLY' | 'ANNUAL' | 'BASIC' | 'PREMIUM'
  status: string; // 'ACTIVE' | 'CANCELLED' | 'EXPIRED' | 'PAUSED'
  startDate: string;
  endDate: string | null;
  autoRenew: boolean;
  credits: number; // Available drill credits
  usedCredits: number;
  totalCredits: number;
  provider: string; // 'stripe' | 'razorpay'
  providerSubscriptionId: string;
  createdAt: string;
  updatedAt: string;
}

interface UnlockParams {
  skillId: string;
  assessmentId?: string;
  recommendationId?: string;
}

interface UseSubscriptionReturn {
  loading: boolean;
  error: string | null;
  subscription: Subscription | null;
  hasActiveSubscription: boolean;
  availableCredits: number;
  canUnlockDrills: (drillCount: number) => boolean;
  unlockWithCredits: (params: UnlockParams) => Promise<string>; // Returns assignmentId
  refresh: () => Promise<void>;
}

export const useSubscription = (): UseSubscriptionReturn => {
  const { showError, showSuccess } = useToast();

  // State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);

  /**
   * Load subscription status
   */
  const loadSubscription = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('[Subscription] Loading subscription status...');

      try {
        const res = await apiService.getSubscription();

        if (!res.success) {
          // User might not have a subscription - this is okay
          console.log('[Subscription] No active subscription found');
          setSubscription(null);
          return;
        }

        const subscriptionData = res.data;
        setSubscription(subscriptionData);

        console.log('[Subscription] Subscription loaded:', {
          plan: subscriptionData.plan,
          status: subscriptionData.status,
          credits: subscriptionData.credits,
          endDate: subscriptionData.endDate
        });
      } catch (apiError: unknown) {
        // If endpoint doesn't exist yet, just log and continue
        if (apiError.status === 404 || apiError.message?.includes('Route') || apiError.message?.includes('not found')) {
          console.log('[Subscription] Subscription endpoint not implemented yet');
          setSubscription(null);
        } else {
          throw apiError;
        }
      }

    } catch (err: unknown) {
      console.error('[Subscription] Load error:', err);
      setError(null); // Don't set error for missing endpoints
      setSubscription(null);
    } finally {
      setLoading(false);
    }
  }, [showError]);

  // Load subscription on mount
  useEffect(() => {
    loadSubscription();
  }, [loadSubscription]);

  /**
   * Check if user can unlock drills with available credits
   */
  const canUnlockDrills = useCallback((drillCount: number): boolean => {
    if (!subscription || subscription.status !== 'ACTIVE') {
      return false;
    }

    return subscription.credits >= drillCount;
  }, [subscription]);

  /**
   * Unlock drills using subscription credits
   */
  const unlockWithCredits = async (params: UnlockParams): Promise<string> => {
    if (!subscription || subscription.status !== 'ACTIVE') {
      throw new Error('No active subscription found');
    }

    if (subscription.credits <= 0) {
      throw new Error('Insufficient credits. Please purchase more drills or upgrade your plan.');
    }

    try {
      console.log('[Subscription] Unlocking drills with credits:', {
        skillId: params.skillId,
        availableCredits: subscription.credits
      });

      // Create drill assignment using subscription credits
      const res = await apiService.createDrillAssignment({
        skillId: params.skillId,
        source: 'Subscription',
        recommendationId: params.recommendationId
      });

      if (!res.success) {
        throw new Error(res.message || 'Failed to unlock drills');
      }

      const assignmentId = res.data.id;

      console.log('[Subscription] ✅ Drills unlocked with credits:', assignmentId);

      // Update local subscription state (reduce credits)
      setSubscription({
        ...subscription,
        credits: subscription.credits - 1, // Assuming 1 credit per drill pack
        usedCredits: subscription.usedCredits + 1
      });

      showSuccess('Drills unlocked successfully!');

      return assignmentId;

    } catch (err: unknown) {
      console.error('[Subscription] Unlock error:', err);
      showError(err.message || 'Failed to unlock drills');
      throw err;
    }
  };

  /**
   * Refresh subscription data
   */
  const refresh = async () => {
    await loadSubscription();
  };

  // Computed values
  const hasActiveSubscription = subscription?.status === 'ACTIVE';
  const availableCredits = subscription?.credits || 0;

  return {
    loading,
    error,
    subscription,
    hasActiveSubscription,
    availableCredits,
    canUnlockDrills,
    unlockWithCredits,
    refresh
  };
};
