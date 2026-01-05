import { useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/api';

export interface Subscription {
  id: string;
  userId: string;
  plan: string;
  status: string;
  startDate: string;
  endDate: string | null;
  autoRenew: boolean;
  credits: number;
  usedCredits: number;
  totalCredits: number;
  creditValue: number;
  provider: string;
  providerSubscriptionId: string;
  createdAt: string;
  updatedAt: string;
}

interface UnlockParams {
  skillId: string;
  assessmentId?: string;
  recommendationId?: string;
  drillPackPrice?: number;
}

interface UseSubscriptionReturn {
  loading: boolean;
  error: string | null;
  subscription: Subscription | null;
  hasActiveSubscription: boolean;
  availableCredits: number;
  creditValue: number;
  canUnlockDrills: (drillCount: number) => boolean;
  unlockWithCredits: (params: UnlockParams) => Promise<string>;
  refresh: () => Promise<void>;
  clearSubscriptionError: () => void;
}

export const useSubscription = (): UseSubscriptionReturn => {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const hasActiveSubscription = subscription?.status === 'ACTIVE';
  const availableCredits = subscription?.credits || 0;
  const creditValue = subscription?.creditValue || 0;

  const loadSubscription = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiService.getSubscription();
      if (res.success && res.data) {
        setSubscription(res.data);
      } else {
        setSubscription(null);
      }
    } catch (err: unknown) {
      const e = err as { status?: number; message?: string };
      if (e.status === 404 || e.message?.includes('not found')) {
        setSubscription(null);
      } else {
        setError(e.message || 'Failed to fetch subscription');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSubscription();
  }, [loadSubscription]);

  const canUnlockDrills = useCallback(
    (drillCount: number): boolean => {
      if (!subscription || subscription.status !== 'ACTIVE') {
        return false;
      }
      return subscription.credits >= drillCount;
    },
    [subscription]
  );

  const unlockWithCredits = useCallback(
    async (params: UnlockParams): Promise<string> => {
      if (!subscription || subscription.status !== 'ACTIVE') {
        throw new Error('No active subscription found');
      }

      if (!subscription.creditValue || subscription.creditValue <= 0) {
        throw new Error('Credit value not configured. Please contact support.');
      }

      let creditsNeeded = 1;
      if (params.drillPackPrice && params.drillPackPrice > 0) {
        creditsNeeded = Math.ceil(params.drillPackPrice / subscription.creditValue);
      }

      if (subscription.credits < creditsNeeded) {
        throw new Error(
          `Insufficient credits. Need ${creditsNeeded} credits, but only have ${subscription.credits}.`
        );
      }

      const res = await apiService.createDrillAssignment({
        skillId: params.skillId,
        source: 'Subscription',
        recommendationId: params.recommendationId,
        drillPackPrice: params.drillPackPrice,
      });

      if (!res.success) {
        throw new Error(res.message || 'Failed to unlock drills');
      }

      setSubscription(prev => prev ? {
        ...prev,
        credits: Math.max(0, prev.credits - creditsNeeded),
        usedCredits: prev.usedCredits + creditsNeeded,
      } : null);

      return res.data.id;
    },
    [subscription]
  );

  const refresh = useCallback(async () => {
    await loadSubscription();
  }, [loadSubscription]);

  const clearSubscriptionError = useCallback(() => {
    setError(null);
  }, []);

  return {
    loading,
    error,
    subscription,
    hasActiveSubscription,
    availableCredits,
    creditValue,
    canUnlockDrills,
    unlockWithCredits,
    refresh,
    clearSubscriptionError,
  };
};
