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
  creditValue: number; // Dollar value per credit (e.g., 1 credit = $5.00)
  provider: string; // 'stripe' | 'razorpay'
  providerSubscriptionId: string;
  createdAt: string;
  updatedAt: string;
}

interface UnlockParams {
  skillId: string;
  assessmentId?: string;
  recommendationId?: string;
  drillPackPrice?: number; // Price of the drill pack for credit calculation
}

interface UseSubscriptionReturn {
  loading: boolean;
  error: string | null;
  subscription: Subscription | null;
  hasActiveSubscription: boolean;
  availableCredits: number;
  creditValue: number; // Dollar value per credit
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


      try {
        const res = await apiService.getSubscription();

        if (!res.success) {
          // User might not have a subscription - this is okay
          setSubscription(null);
          return;
        }

        const subscriptionData = res.data;
        setSubscription(subscriptionData);
      } catch (apiError: unknown) {
        // If endpoint doesn't exist yet, just log and continue
        if (apiError.status === 404 || apiError.message?.includes('Route') || apiError.message?.includes('not found')) {
          setSubscription(null);
        } else {
          throw apiError;
        }
      }

    } catch (err: unknown) {
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
   * Calculates credits needed based on drill pack price and credit value
   */
  const unlockWithCredits = async (params: UnlockParams): Promise<string> => {
    if (!subscription || subscription.status !== 'ACTIVE') {
      throw new Error('No active subscription found');
    }

    if (!subscription.creditValue || subscription.creditValue <= 0) {
      throw new Error('Credit value not configured. Please contact support.');
    }

    // Calculate credits needed if drill pack price is provided
    let creditsNeeded = 1; // Default fallback
    if (params.drillPackPrice && params.drillPackPrice > 0) {
      creditsNeeded = Math.ceil(params.drillPackPrice / subscription.creditValue);
    }

    if (subscription.credits < creditsNeeded) {
      throw new Error(`Insufficient credits. Need ${creditsNeeded} credits, but only have ${subscription.credits}. Please purchase more credits or upgrade your plan.`);
    }

    try {

      // Create drill assignment using subscription credits
      const res = await apiService.createDrillAssignment({
        skillId: params.skillId,
        source: 'Subscription',
        recommendationId: params.recommendationId,
        drillPackPrice: params.drillPackPrice
      });

      if (!res.success) {
        throw new Error(res.message || 'Failed to unlock drills');
      }

      const assignmentId = res.data.id;


      // Update local subscription state (reduce credits by calculated amount)
      setSubscription({
        ...subscription,
        credits: subscription.credits - creditsNeeded,
        usedCredits: subscription.usedCredits + creditsNeeded
      });

      showSuccess('Drills unlocked successfully!');

      return assignmentId;

    } catch (err: unknown) {
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
    creditValue: subscription?.creditValue || 0,
    canUnlockDrills,
    unlockWithCredits,
    refresh
  };
};
