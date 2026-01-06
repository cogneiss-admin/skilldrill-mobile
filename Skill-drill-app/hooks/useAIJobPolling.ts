import { useState, useCallback, useRef, useEffect } from 'react';
import { apiService } from '../services/api';
import { AIJobStatus, PollingConfig } from '../types/api';

interface UseAIJobPollingOptions {
  onComplete?: (status: AIJobStatus) => void;
  onError?: (error: Error, status?: AIJobStatus) => void;
  onProgress?: (status: AIJobStatus) => void;
}

export interface UseAIJobPollingReturn {
  startPolling: (jobId: string, config?: Partial<PollingConfig>) => void;
  cancelPolling: () => void;
  retry: () => void;
  reset: () => void;
  status: AIJobStatus | null;
  progressMessage: string;
  isPolling: boolean;
  error: Error | null;
  attemptCount: number;
  canRetry: boolean;
}

const DEFAULT_CONFIG: PollingConfig = {
  initialDelay: 1000,
  maxDelay: 10000,
  backoffFactor: 1.5,
  maxAttempts: 0, // 0 = no limit, backend controls lifecycle via job status
};

export const useAIJobPolling = (
  options: UseAIJobPollingOptions = {}
): UseAIJobPollingReturn => {
  const { onComplete, onError, onProgress } = options;

  const [status, setStatus] = useState<AIJobStatus | null>(null);
  const [progressMessage, setProgressMessage] = useState<string>('');
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [attemptCount, setAttemptCount] = useState(0);
  const [canRetry, setCanRetry] = useState(false);

  const jobIdRef = useRef<string | null>(null);
  const configRef = useRef<PollingConfig>(DEFAULT_CONFIG);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isCancelledRef = useRef(false);
  const attemptRef = useRef(0);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      isCancelledRef.current = true;
    };
  }, []);

  const calculateDelay = useCallback((attempt: number): number => {
    const { initialDelay, maxDelay, backoffFactor } = configRef.current;
    const delay = initialDelay * Math.pow(backoffFactor, attempt);
    return Math.min(delay, maxDelay);
  }, []);

  const poll = useCallback(async () => {
    if (isCancelledRef.current || !jobIdRef.current) {
      return;
    }

    const jobId = jobIdRef.current;
    const config = configRef.current;

    try {
      const response = await apiService.getJobStatus(jobId);

      if (isCancelledRef.current) return;

      if (response.success) {
        const jobStatus = response.data as AIJobStatus;
        setStatus(jobStatus);
        setProgressMessage(jobStatus.message || 'Processing...');

        if (onProgress) {
          onProgress(jobStatus);
        }

        if (jobStatus.status === 'completed' || jobStatus.completed) {
          setIsPolling(false);
          setCanRetry(false);
          if (onComplete) {
            onComplete(jobStatus);
          }
          return;
        }

        if (jobStatus.status === 'failed' || jobStatus.failed) {
          setIsPolling(false);
          setCanRetry(jobStatus.retryable ?? true);
          const jobError = new Error(jobStatus.error || 'Job failed');
          setError(jobError);
          if (onError) {
            onError(jobError, jobStatus);
          }
          return;
        }

        attemptRef.current += 1;
        setAttemptCount(attemptRef.current);

        // Only enforce maxAttempts if it's > 0 (0 = no limit, backend controls)
        if (config.maxAttempts > 0 && attemptRef.current >= config.maxAttempts) {
          setIsPolling(false);
          setCanRetry(true);
          const timeoutError = new Error('Processing is taking longer than expected. Please try again.');
          setError(timeoutError);
          if (onError) {
            onError(timeoutError, jobStatus);
          }
          return;
        }

        const delay = calculateDelay(attemptRef.current);
        timeoutRef.current = setTimeout(poll, delay);
      } else {
        throw new Error(response.message || 'Failed to get job status');
      }
    } catch (err) {
      if (isCancelledRef.current) return;

      attemptRef.current += 1;
      setAttemptCount(attemptRef.current);

      // Only enforce maxAttempts if it's > 0 (0 = no limit, backend controls)
      if (config.maxAttempts > 0 && attemptRef.current >= config.maxAttempts) {
        setIsPolling(false);
        setCanRetry(true);
        const pollingError = err instanceof Error ? err : new Error('Polling failed');
        setError(pollingError);
        if (onError) {
          onError(pollingError);
        }
        return;
      }

      const delay = calculateDelay(attemptRef.current);
      timeoutRef.current = setTimeout(poll, delay);
    }
  }, [calculateDelay, onComplete, onError, onProgress]);

  const startPolling = useCallback((
    jobId: string,
    config: Partial<PollingConfig> = {}
  ) => {
    jobIdRef.current = jobId;
    configRef.current = { ...DEFAULT_CONFIG, ...config };
    isCancelledRef.current = false;
    attemptRef.current = 0;

    setStatus(null);
    setProgressMessage('Starting...');
    setIsPolling(true);
    setError(null);
    setAttemptCount(0);
    setCanRetry(false);
    poll();
  }, [poll]);

  const cancelPolling = useCallback(() => {
    isCancelledRef.current = true;
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsPolling(false);
    setProgressMessage('Cancelled');
  }, []);

  const retry = useCallback(() => {
    if (jobIdRef.current) {
      setError(null);
      isCancelledRef.current = false;
      attemptRef.current = 0;
      setAttemptCount(0);
      setIsPolling(true);
      setCanRetry(false);
      poll();
    }
  }, [poll]);

  const reset = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    isCancelledRef.current = true;
    jobIdRef.current = null;
    setStatus(null);
    setProgressMessage('');
    setIsPolling(false);
    setError(null);
    setAttemptCount(0);
    setCanRetry(false);
  }, []);

  return {
    startPolling,
    cancelPolling,
    retry,
    reset,
    status,
    progressMessage,
    isPolling,
    error,
    attemptCount,
    canRetry
  };
};

export default useAIJobPolling;
