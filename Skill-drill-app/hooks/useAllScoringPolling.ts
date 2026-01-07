/**
 * useAllScoringPolling Hook
 *
 * Polls for ALL response scoring jobs completion for an assessment.
 * Used on the last question to ensure all scoring is done before showing results.
 *
 * Behavior:
 * - Polls until ALL scoring jobs are completed
 * - If ANY scoring job fails after retries, calls onError with the error message
 * - No timeout - waits until all jobs complete or one fails
 *
 * Usage:
 * const { startPolling, isPolling, cancelPolling } = useAllScoringPolling({
 *   onComplete: () => {
 *     // All scoring done, can proceed to results
 *   },
 *   onError: (errorMessage) => {
 *     // Show error dialog
 *   }
 * });
 *
 * // After submitting last question
 * startPolling(assessmentId);
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import apiService from '../services/api';

interface UseAllScoringPollingOptions {
  onComplete: () => void;
  onError: (errorMessage: string) => void;
  pollingIntervalMs?: number; // Default: 1500ms
}

interface UseAllScoringPollingReturn {
  startPolling: (assessmentId: string) => void;
  cancelPolling: () => void;
  isPolling: boolean;
  progress: {
    completed: number;
    total: number;
    message: string;
  } | null;
}

export function useAllScoringPolling({
  onComplete,
  onError,
  pollingIntervalMs = 1500,
}: UseAllScoringPollingOptions): UseAllScoringPollingReturn {
  const [isPolling, setIsPolling] = useState(false);
  const [progress, setProgress] = useState<{
    completed: number;
    total: number;
    message: string;
  } | null>(null);

  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const onCompleteRef = useRef(onComplete);
  const onErrorRef = useRef(onError);
  const hasCompletedRef = useRef(false);
  const assessmentIdRef = useRef<string | null>(null);

  // Keep refs updated
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  const cleanup = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    setIsPolling(false);
    assessmentIdRef.current = null;
  }, []);

  const complete = useCallback(() => {
    if (hasCompletedRef.current) {
      return; // Already completed
    }
    hasCompletedRef.current = true;
    cleanup();
    onCompleteRef.current();
  }, [cleanup]);

  const fail = useCallback((errorMessage: string) => {
    if (hasCompletedRef.current) {
      return; // Already completed/failed
    }
    hasCompletedRef.current = true;
    cleanup();
    onErrorRef.current(errorMessage);
  }, [cleanup]);

  const checkScoringStatus = useCallback(async (assessmentId: string) => {
    try {
      const response = await apiService.getAssessmentScoringStatus(assessmentId);

      if (response.success && response.data) {
        const { allCompleted, hasFailed, completedCount, totalJobs, failedJobError, message } = response.data;

        // Update progress
        setProgress({
          completed: completedCount || 0,
          total: totalJobs || 0,
          message: message || 'Processing responses...',
        });

        // Check for failure first
        if (hasFailed) {
          fail(failedJobError || 'Unable to analyze response. Please try again.');
          return true;
        }

        // Check for completion
        if (allCompleted) {
          complete();
          return true;
        }

        // Still in progress
        return false;
      }
      return false;
    } catch (error) {
      console.warn('[AllScoringPolling] Error checking scoring status:', error);
      // Continue polling on network errors - don't fail immediately
      return false;
    }
  }, [complete, fail]);

  const startPolling = useCallback((assessmentId: string) => {
    if (!assessmentId) {
      console.warn('[AllScoringPolling] No assessmentId provided');
      return;
    }

    // Reset state
    hasCompletedRef.current = false;
    assessmentIdRef.current = assessmentId;
    setProgress(null);
    setIsPolling(true);

    // Initial check
    checkScoringStatus(assessmentId).then(done => {
      if (done) {
        return; // Already completed or failed
      }

      // Start polling
      pollingIntervalRef.current = setInterval(async () => {
        if (assessmentIdRef.current) {
          await checkScoringStatus(assessmentIdRef.current);
        }
      }, pollingIntervalMs);
    });
  }, [pollingIntervalMs, checkScoringStatus]);

  const cancelPolling = useCallback(() => {
    hasCompletedRef.current = true;
    cleanup();
  }, [cleanup]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    startPolling,
    cancelPolling,
    isPolling,
    progress,
  };
}

