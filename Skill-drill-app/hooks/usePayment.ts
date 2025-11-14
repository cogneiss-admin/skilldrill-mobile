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
 *   onSuccess: (assignmentId) => navigate(`/drillPractice?assignmentId=${assignmentId}`)
 * });
 */

import { useState } from 'react';
import { useStripe } from '@stripe/stripe-react-native';
import apiService from '../services/api';
import { useToast } from './useToast';

interface PaymentParams {
  priceId: string;
  metadata: {
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
  const { showError, showSuccess } = useToast();
  const [processing, setProcessing] = useState(false);

  /**
   * Process Stripe payment
   */
  const processPayment = async (params: PaymentParams) => {
    setProcessing(true);

    try {
      // Step 1: Create checkout session on backend
      console.log('[Payment] Creating checkout session...');

      const checkoutRes = await apiService.createCheckout({
        priceId: params.priceId,
        provider: 'stripe',
        metadata: params.metadata
      });

      if (!checkoutRes.success) {
        throw new Error(checkoutRes.message || 'Failed to create checkout session');
      }

      const { clientSecret, publishableKey } = checkoutRes.data;

      console.log('[Payment] Checkout session created');

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
        console.error('[Payment] Init error:', initError);
        throw new Error(initError.message || 'Failed to initialize payment');
      }

      console.log('[Payment] Payment sheet initialized');

      // Step 3: Present payment sheet to user
      const { error: presentError } = await presentPaymentSheet();

      if (presentError) {
        // User cancelled payment
        if (presentError.code === 'Canceled') {
          console.log('[Payment] User cancelled payment');
          showError('Payment cancelled');
          params.onCancel?.();
          return;
        }

        // Other payment errors
        console.error('[Payment] Present error:', presentError);
        throw new Error(presentError.message || 'Payment failed');
      }

      console.log('[Payment] ✅ Payment successful!');
      showSuccess('Payment successful! Generating your drills...');

      // Step 4: Poll for drill assignment
      // Backend webhook will create the assignment
      const assignmentId = await pollForAssignment(params.metadata.skillId);

      console.log('[Payment] ✅ Drill assignment created:', assignmentId);

      // Step 5: Success callback
      params.onSuccess(assignmentId);

    } catch (error: any) {
      console.error('[Payment] Error:', error);
      showError(error.message || 'Payment processing failed');
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
    console.log('[Payment] Polling for drill assignment...');

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        // Wait before polling
        if (attempt > 1) {
          await sleep(intervalMs);
        }

        console.log(`[Payment] Poll attempt ${attempt}/${maxAttempts}`);

        // Fetch all assignments
        const res = await apiService.getDrillAssignments();

        if (res.success && res.data?.assignments) {
          // Find most recent assignment for this skill
          const latestAssignment = res.data.assignments
            .filter((a: any) => a.skillId === skillId)
            .sort((a: any, b: any) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            )[0];

          if (latestAssignment) {
            console.log('[Payment] ✅ Assignment found:', latestAssignment.id);
            return latestAssignment.id;
          }
        }

        console.log('[Payment] Assignment not ready yet, retrying...');

      } catch (error) {
        console.warn('[Payment] Poll error:', error);
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
