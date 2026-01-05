/**
 * usePayment Hook
 *
 * Reusable hook for handling Stripe payment flow
 *
 * Features:
 * - Initialize Stripe checkout
 * - Process payment
 * - Poll for drill assignment after payment
 * - Error handling
 *
 * Usage:
 * const { processPayment, processing } = usePayment();
 *
 * await processPayment({
 *   priceId: 'price_123',
 *   metadata: { skillId, assessmentId, recommendationId },
 *   onSuccess: (assignmentId) => navigate(`/drillsScenarios?assignmentId=${assignmentId}`)
 * });
 */

import { useState } from 'react';
import { useStripe } from '@stripe/stripe-react-native';
import apiService from '../services/api';

interface PaymentParams {
  // Legacy mode: use priceId for fixed pricing
  priceId?: string;
  // Dynamic mode: use recommendationId for token-based pricing
  recommendationId?: string;
  // Subscription mode: use planId for subscription purchase
  planId?: string;
  couponCode?: string;
  metadata?: {
    skillId: string;
    assessmentId?: string;
    recommendationId?: string;
  };
  onSuccess: (assignmentId: string) => void;
  onCancel?: () => void;
}

interface UsePaymentReturn {
  processPayment: (params: PaymentParams) => Promise<void>;
  processing: boolean;
}

export const usePayment = (): UsePaymentReturn => {
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [processing, setProcessing] = useState(false);

  /**
   * Process Stripe payment
   */
  const processPayment = async (params: PaymentParams) => {
    setProcessing(true);

    try {
      // Validate input parameters
      if (!params.priceId && !params.recommendationId && !params.planId) {
        throw new Error('Either priceId, recommendationId, or planId is required');
      }

      // Step 1: Create checkout session on backend
      const checkoutRequest: import('../types/pricing').CheckoutRequest = {
        provider: 'stripe',
        couponCode: params.couponCode,
      };

      // Subscription mode: use planId
      if (params.planId) {
        checkoutRequest.planId = params.planId;
      } else if (params.recommendationId) {
        checkoutRequest.recommendationId = params.recommendationId;
      } else if (params.priceId) {
        checkoutRequest.priceId = params.priceId;
        checkoutRequest.metadata = params.metadata;
      }

      const checkoutRes = await apiService.createCheckout(checkoutRequest);

      if (!checkoutRes.success) {
        throw new Error(checkoutRes.message || 'Failed to create checkout session');
      }

      const { clientSecret, publishableKey } = checkoutRes.data;

      // Step 2: Initialize Stripe payment sheet
      const { error: initError } = await initPaymentSheet({
        paymentIntentClientSecret: clientSecret,
        merchantDisplayName: 'SkillDrill',
        returnURL: `${process.env.EXPO_PUBLIC_APP_SCHEME}://payment-success`,
        defaultBillingDetails: {
          // Can add user email/name here if available
        },
      });

      if (initError) {
        throw new Error(initError.message || 'Failed to initialize payment');
      }

      // Step 3: Present payment sheet to user
      const { error: presentError } = await presentPaymentSheet();

      if (presentError) {
        // User cancelled payment
        if (presentError.code === 'Canceled') {
          params.onCancel?.();
          return;
        }

        // Other payment errors
        throw new Error(presentError.message || 'Payment failed');
      }

      // Success! The Stripe webhook will create the DrillAssignment in the background.
      // We don't need to poll - just redirect to Activity page where user can start drills.
      // The assignment will be there by the time user navigates (webhook is fast).
      params.onSuccess('');

    } catch (error: unknown) {

      throw error;
    } finally {
      setProcessing(false);
    }
  };

  /**
   * Poll for drill assignment creation
   *
   * After payment succeeds, backend webhook creates the drill assignment.
   * This function polls the API until the assignment is found.
   */
  const pollForAssignment = async (
    skillId: string,
    maxAttempts: number = 15,
    intervalMs: number = 2000
  ): Promise<string> => {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        // Wait before polling
        if (attempt > 1) {
          await sleep(intervalMs);
        }

        // Fetch all assignments
        const res = await apiService.getDrillAssignments();

        if (res.success && res.data?.assignments) {
          // Find most recent assignment for this skill
          interface DrillAssignment {
            id: string;
            skillId: string;
            createdAt: string;
          }
          const assignments = (res.data.assignments as DrillAssignment[]) || [];
          const latestAssignment = assignments
            .filter((a) => a.skillId === skillId)
            .sort((a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            )[0];

          if (latestAssignment) {
            return latestAssignment.id;
          }
        }

      } catch (error) {
        // Continue polling even on errors
      }
    }

    // Timeout - assignment not created in time
    throw new Error(
      'Drill assignment is taking longer than expected. Please check "My Drills" in a moment.'
    );
  };

  return {
    processPayment,
    processing,
  };
};

/**
 * Sleep utility for polling
 */
const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};
