/**
 * useResponseScoringPolling Hook
 *
 * Polls for response scoring completion with a 5-second maximum wait time.
 * Shows next question as soon as either:
 * - 5 seconds have passed, OR
 * - Response scoring is completed
 * (whichever happens first)
 *
 * Usage:
 * const { startPolling, isPolling } = useResponseScoringPolling({
 *   onComplete: () => {
 *     // Show next question
 *   }
 * });
 *
 * // After submitting response and getting jobId
 * startPolling(jobId);
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import apiService from '../services/api';

interface UseResponseScoringPollingOptions {
  onComplete: () => void;
  maxWaitTimeMs?: number; // Default: 5000ms
  pollingIntervalMs?: number; // Default: 1000ms
}

interface UseResponseScoringPollingReturn {
  startPolling: (jobId: string) => void;
  cancelPolling: () => void;
  isPolling: boolean;
  scoringCompleted: boolean;
}

export function useResponseScoringPolling({
  onComplete,
  maxWaitTimeMs = 5000,
  pollingIntervalMs = 1000,
}: UseResponseScoringPollingOptions): UseResponseScoringPollingReturn {
  const [isPolling, setIsPolling] = useState(false);
  const [scoringCompleted, setScoringCompleted] = useState(false);

  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const maxWaitTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const onCompleteRef = useRef(onComplete);
  const hasCompletedRef = useRef(false);

  // Keep onComplete ref updated
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const cleanup = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    if (maxWaitTimeoutRef.current) {
      clearTimeout(maxWaitTimeoutRef.current);
      maxWaitTimeoutRef.current = null;
    }
    setIsPolling(false);
  }, []);

  const complete = useCallback(() => {
    if (hasCompletedRef.current) {
      return; // Already completed
    }
    hasCompletedRef.current = true;
    cleanup();
    onCompleteRef.current();
  }, [cleanup]);

  const checkJobStatus = useCallback(async (jobId: string) => {
    try {
      const response = await apiService.getJobStatus(jobId);

      if (response.success && response.data) {
        const { completed } = response.data;

        if (completed) {
          setScoringCompleted(true);
          complete();
          return true;
        }
      }
      return false;
    } catch (error) {
      console.warn('[ResponseScoringPolling] Error checking job status:', error);
      // Continue polling even on error
      return false;
    }
  }, [complete]);

  const startPolling = useCallback((jobId: string) => {
    if (!jobId) {
      console.warn('[ResponseScoringPolling] No jobId provided');
      return;
    }

    // Reset state
    hasCompletedRef.current = false;
    setScoringCompleted(false);
    setIsPolling(true);

    // Set max wait timeout (5 seconds)
    maxWaitTimeoutRef.current = setTimeout(() => {
      console.log('[ResponseScoringPolling] Max wait time reached (5s), showing next question');
      complete();
    }, maxWaitTimeMs);

    // Immediate check
    checkJobStatus(jobId).then(completed => {
      if (completed) {
        return; // Already completed in first check
      }

      // Start polling every 1 second
      pollingIntervalRef.current = setInterval(async () => {
        await checkJobStatus(jobId);
      }, pollingIntervalMs);
    });
  }, [maxWaitTimeMs, pollingIntervalMs, checkJobStatus, complete]);

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
    scoringCompleted,
  };
}
