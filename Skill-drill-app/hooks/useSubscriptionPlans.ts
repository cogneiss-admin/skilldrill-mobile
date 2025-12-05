/**
 * useSubscriptionPlans Hook
 *
 * Fetches available subscription plans for the user's career level.
 * Used to conditionally render subscription options vs "Coming Soon" UI.
 *
 * Usage:
 * const {
 *   loading,
 *   error,
 *   plans,
 *   hasPlans,
 *   refresh
 * } = useSubscriptionPlans();
 */

import { useState, useEffect, useCallback } from 'react';
import apiService from '../services/api';

export interface SubscriptionPlan {
  planId: string;
  planName: string;
  planDescription: string | null;
  durationMonths: number;
  price: number;
  priceFormatted: string;
  monthlyPrice: number;
  monthlyPriceFormatted: string;
  currency: string;
  credits: number;
  creditValue: number;
  displayOrder: number;
}

interface UseSubscriptionPlansReturn {
  loading: boolean;
  error: string | null;
  plans: SubscriptionPlan[];
  hasPlans: boolean;
  refresh: () => Promise<void>;
}

export const useSubscriptionPlans = (): UseSubscriptionPlansReturn => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);

  /**
   * Load subscription plans
   */
  const loadPlans = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('[SubscriptionPlans] Loading subscription plans...');

      const res = await apiService.getSubscriptionPlans();

      if (!res.success) {
        console.log('[SubscriptionPlans] Failed to load plans:', res.message);
        setPlans([]);
        return;
      }

      const plansData = res.data?.plans || [];
      setPlans(plansData);

      console.log('[SubscriptionPlans] Plans loaded:', {
        count: plansData.length,
        plans: plansData.map((p: SubscriptionPlan) => p.planName)
      });

    } catch (err: unknown) {
      console.error('[SubscriptionPlans] Load error:', err);
      // Don't set error for missing endpoints - just return empty plans
      if ((err as any)?.status === 404 || (err as any)?.message?.includes('not found')) {
        console.log('[SubscriptionPlans] Endpoint not available yet');
      }
      setPlans([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load plans on mount
  useEffect(() => {
    loadPlans();
  }, [loadPlans]);

  /**
   * Refresh plans data
   */
  const refresh = async () => {
    await loadPlans();
  };

  // Computed values
  const hasPlans = plans.length > 0;

  return {
    loading,
    error,
    plans,
    hasPlans,
    refresh
  };
};
