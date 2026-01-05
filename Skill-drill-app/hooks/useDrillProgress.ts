/**
 * useDrillProgress Hook
 *
 * Manages drill practice state and completion feedback.
 *
 * Features:
 * - Load drill assignment with all items
 * - Track current drill and progress
 * - Submit drill attempts with AI scoring
 * - Show overall feedback at 100% completion
 * - Navigate between drills
 *
 * Usage:
 * const {
 *   loading,
 *   drills,
 *   currentDrill,
 *   currentIndex,
 *   totalDrills,
 *   completedCount,
 *   progress,
 *   submitting,
 *   completionData,
 *   submitDrill,
 *   nextDrill,
 *   previousDrill,
 *   handleCompletion
 * } = useDrillProgress(assignmentId);
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'expo-router';
import apiService from '../services/api';
import { useAIJobPolling } from './useAIJobPolling';
import { AIJobStatusType } from '../types/api';

interface DrillItem {
  id: string;
  orderIndex: number;
  scenarioText: string;
  isCompleted: boolean;
  lastAttempt: {
    id: string;
    finalScore: number;
    submittedAt: string;
    responseType: 'TEXT' | 'AUDIO';
  } | null;
}

interface Assignment {
  id: string;
  skillId: string;
  skillName?: string;
  skillCategory?: string;
  source: string;
  status: string;
  total: number;
  completed: number;
  completionPercentage: number;
  createdAt: string;
  updatedAt: string;
  items: DrillItem[];
}

interface CompletionData {
  reached: boolean;
  skillName: string;
  overall: {
    finalScore: number;
    feedbackGood: string;
    feedbackImprove: string;
    feedbackSummary: string;
  };
  stats: {
  averageScore: number;
  attemptsCount: number;
  };
}

interface SubmitDrillParams {
  textContent?: string;
  audioUrl?: string;
  durationSec?: number;
}

interface UseDrillProgressReturn {
  loading: boolean;
  error: string | null;
  assignment: Assignment | null;
  drills: DrillItem[];
  currentDrill: DrillItem | null;
  currentIndex: number;
  totalDrills: number;
  completedCount: number;
  progress: {
    percentage: number;
  };
  submitting: boolean;
  isLoadingOverallFeedback: boolean; // AI loader state for overall feedback generation
  aiStatus: AIJobStatusType | null; // Current AI job status
  aiProgressMessage: string; // Progress message from backend
  canRetryFeedback: boolean; // Whether feedback generation can be retried
  completionData: CompletionData | null; // Only set when 100% complete
  sessionId: string | null;
  submitDrill: (params: SubmitDrillParams) => Promise<void>;
  nextDrill: () => void;
  previousDrill: () => void;
  goToDrill: (index: number) => void;
  handleCompletion: () => void; // Called when user dismisses 100% completion results
  retryFeedback: () => void; // Retry failed feedback generation
  cancelFeedback: () => void; // Cancel stuck feedback generation
  refresh: () => Promise<void>;
}

export const useDrillProgress = (assignmentId: string): UseDrillProgressReturn => {
  const router = useRouter();

  // State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [completionData, setCompletionData] = useState<CompletionData | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [pendingResultsAssignmentId, setPendingResultsAssignmentId] = useState<string | null>(null);

  // AI Job Polling hook for feedback generation
  const {
    status: aiJobStatus,
    progressMessage: aiProgressMessage,
    isPolling: isPollingFeedback,
    canRetry: canRetryFeedback,
    startPolling: startFeedbackPolling,
    cancelPolling: cancelFeedbackPolling,
    retry: retryFeedbackPolling,
    reset: resetFeedbackPolling,
  } = useAIJobPolling({
    onComplete: async (jobStatus) => {
      // Feedback generation completed, fetch results
      if (pendingResultsAssignmentId) {
        await fetchAndNavigateToResults(pendingResultsAssignmentId);
      }
    },
    onError: (errorMessage) => {
      setError(`Feedback generation failed: ${errorMessage}`);
    },
  });

  // Computed state for isLoadingOverallFeedback (for backward compatibility)
  const isLoadingOverallFeedback = isPollingFeedback;

  // Helper function to fetch results and navigate to results screen
  const fetchAndNavigateToResults = useCallback(async (assignmentIdForResults: string) => {
    try {
      const response = await apiService.getDrillResults(assignmentIdForResults);

      if (!response.success || response.data.status !== 'ready') {
        throw new Error('Results not ready');
      }

      const aggregateRes = await apiService.getDrillAggregate(assignmentIdForResults);
      const aggregate = aggregateRes.success ? aggregateRes.data : null;

      const skillName = response.data.skillName || assignment?.skillName || 'Unknown Skill';
      const averageScore = aggregate?.averageScore ?? response.data.finalScore;
      const attemptsCount = aggregate?.attemptsCount ?? assignment?.completed ?? 1;

      const completionDataToSet = {
        reached: true,
        skillName,
        overall: {
          finalScore: response.data.finalScore,
          feedbackGood: response.data.feedbackGood,
          feedbackImprove: response.data.feedbackImprove,
          feedbackSummary: response.data.feedbackSummary,
        },
        stats: {
          averageScore,
          attemptsCount,
        },
      };

      setCompletionData(completionDataToSet);
      setPendingResultsAssignmentId(null);
      resetFeedbackPolling();

      router.replace({
        pathname: '/drillsResults',
        params: {
          overall: JSON.stringify({
            ...completionDataToSet.overall,
            skillName,
          }),
          averageScore: String(averageScore),
          attemptsCount: String(attemptsCount),
        },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch results';
      setError(message);
    }
  }, [assignment, router, resetFeedbackPolling]);

  const startOrResumeSession = useCallback(async (assignmentData: Assignment) => {
    try {
      let sessionResponse;
      
      try {
        const statusRes = await apiService.getDrillSessionStatus(assignmentId);
        if (statusRes.success && statusRes.data.hasActiveSession) {
          sessionResponse = {
            success: true,
            data: {
              sessionId: statusRes.data.sessionId,
              assignmentId: assignmentId,
              currentDrillIndex: statusRes.data.currentDrillIndex,
              isResuming: true
            }
          };
        } else {
          sessionResponse = await apiService.startDrillSession(assignmentId);
        }
      } catch {
        // Session status check failed, start new session
        sessionResponse = await apiService.startDrillSession(assignmentId);
      }

      if (!sessionResponse.success) {
        throw new Error(sessionResponse.message || 'Failed to start session');
      }

      const sessionData = sessionResponse.data;
      setSessionId(sessionData.sessionId);

      let initialIndex = sessionData.currentDrillIndex !== undefined 
        ? sessionData.currentDrillIndex 
        : assignmentData.items.findIndex((item: DrillItem) => !item.isCompleted);

      if (initialIndex === -1) {
        initialIndex = 0;
      }

      setCurrentIndex(initialIndex);

      return sessionData.sessionId;
    } catch (err: unknown) {
      return null;
    }
  }, [assignmentId]);

  const loadAssignment = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await apiService.getDrillAssignment(assignmentId);

      if (!res.success) {
        throw new Error(res.message || 'Failed to load drill assignment');
      }

      const assignmentData = res.data;

      assignmentData.items.sort((a: DrillItem, b: DrillItem) => a.orderIndex - b.orderIndex);

      setAssignment(assignmentData);

      const sessionId = await startOrResumeSession(assignmentData);
      if (sessionId) {
        setSessionId(sessionId);
      }

      if (!sessionId) {
        const firstIncompleteIndex = assignmentData.items.findIndex(
          (item: DrillItem) => !item.isCompleted
        );

        if (firstIncompleteIndex !== -1) {
          setCurrentIndex(firstIncompleteIndex);
        } else {
          setCurrentIndex(0);
        }
      }

    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load drills';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [assignmentId, startOrResumeSession]);

  useEffect(() => {
    if (assignmentId) {
      loadAssignment();
    }
  }, [assignmentId, loadAssignment]);

  const submitDrill = async (params: SubmitDrillParams) => {
    if (!assignment || !currentDrill) {
      return;
    }

    setSubmitting(true);

    try {
      const requestBody: {
        drillItemId: string;
        textContent?: string;
        audioUrl?: string;
        durationSec?: number;
        sessionId?: string;
      } = {
        drillItemId: currentDrill.id,
        textContent: params.textContent,
        audioUrl: params.audioUrl,
        durationSec: params.durationSec
      };

      if (sessionId) {
        requestBody.sessionId = sessionId;
      }

      const res = await apiService.submitDrillAttempt(requestBody);

      if (!res.success) {
        throw new Error(res.message || 'Failed to submit drill');
      }

      const result = res.data;

      const updatedItems = assignment.items.map(item => {
        if (item.id === currentDrill.id) {
          return {
            ...item,
            isCompleted: true,
            lastAttempt: {
              id: 'new',
              finalScore: result.finalScore,
              submittedAt: new Date().toISOString(),
              responseType: (params.textContent ? 'TEXT' : 'AUDIO') as 'TEXT' | 'AUDIO'
            }
          };
        }
        return item;
      });

      const updatedAssignment = {
        ...assignment,
        items: updatedItems,
        completed: assignment.completed + 1,
        completionPercentage: result.progress.completionPercentage
      };

      setAssignment(updatedAssignment);

      if (result.progress.completionPercentage === 100) {
        if (result.overall) {
          try {
            const assignmentIdForAggregate = result.assignmentId || assignment.id;
            if (!assignmentIdForAggregate) {
              throw new Error('Assignment ID not found');
            }

            const aggregateRes = await apiService.getDrillAggregate(assignmentIdForAggregate);
            if (!aggregateRes.success || !aggregateRes.data) {
              throw new Error('Failed to fetch aggregate data');
            }
            const aggregate = aggregateRes.data;

            if (!assignment.skillName) {
              throw new Error('Skill name not found in assignment');
            }

            if (aggregate.averageScore === undefined || aggregate.attemptsCount === undefined) {
              throw new Error('Aggregate data incomplete');
            }

            const completionDataToSet = {
              reached: true,
              skillName: assignment.skillName,
              overall: {
                finalScore: result.overall.finalScore,
                feedbackGood: result.overall.feedbackGood,
                feedbackImprove: result.overall.feedbackImprove,
                feedbackSummary: result.overall.feedbackSummary
              },
              stats: {
                averageScore: aggregate.averageScore,
                attemptsCount: aggregate.attemptsCount
              }
            };

            setCompletionData(completionDataToSet);
            setSubmitting(false);

            router.replace({
              pathname: "/drillsResults",
              params: {
                overall: JSON.stringify({
                  ...completionDataToSet.overall,
                  skillName: assignment.skillName
                }),
                averageScore: String(aggregate.averageScore),
                attemptsCount: String(aggregate.attemptsCount),
              }
            });
            return;
          } catch {
            // Aggregate fetch failed, use fallback data
            if (!assignment.skillName) {
              throw new Error('Skill name not found in assignment');
            }

            const completionDataToSet = {
              reached: true,
              skillName: assignment.skillName,
              overall: {
                finalScore: result.overall.finalScore,
                feedbackGood: result.overall.feedbackGood,
                feedbackImprove: result.overall.feedbackImprove,
                feedbackSummary: result.overall.feedbackSummary
              },
              stats: {
                averageScore: result.overall.finalScore,
                attemptsCount: result.progress.completed
              }
            };

            setCompletionData(completionDataToSet);
            setSubmitting(false);

            router.replace({
              pathname: "/drillsResults",
              params: {
                overall: JSON.stringify({
                  ...completionDataToSet.overall,
                  skillName: assignment.skillName
                }),
                averageScore: String(result.overall.finalScore),
                attemptsCount: String(result.progress.completed),
              }
            });
            return;
          }
        }

        setSubmitting(false);

        const assignmentIdForPolling = result.assignmentId || assignment.id;
        if (!assignmentIdForPolling) {
          throw new Error('Assignment ID not found for polling');
        }

        // Store assignment ID for when polling completes
        setPendingResultsAssignmentId(assignmentIdForPolling);

        // If backend returns a jobId, use AI job polling for progress updates
        if (result.jobId) {
          startFeedbackPolling(result.jobId);
        } else {
          // Fallback: fetch results directly after a short delay
          // The backend is generating feedback, poll results endpoint
          const pollForResults = async (attempt = 0): Promise<void> => {
            const maxAttempts = 30;
            const delay = Math.min(1000 * Math.pow(1.5, attempt), 10000); // Exponential backoff

            try {
              const response = await apiService.getDrillResults(assignmentIdForPolling);
              if (response.success && response.data.status === 'ready') {
                await fetchAndNavigateToResults(assignmentIdForPolling);
              } else if (attempt < maxAttempts) {
                setTimeout(() => pollForResults(attempt + 1), delay);
              } else {
                setError('Feedback generation timed out. Please try again.');
                resetFeedbackPolling();
              }
            } catch {
              if (attempt < maxAttempts) {
                setTimeout(() => pollForResults(attempt + 1), delay);
              } else {
                setError('Failed to fetch feedback. Please try again.');
                resetFeedbackPolling();
              }
            }
          };

          pollForResults();
        }
        return;
      }

      if (result.progress.completionPercentage !== 100) {
        const allCompleted = updatedItems.every(item => item.isCompleted);
        if (allCompleted && sessionId) {
          try {
            await apiService.completeDrillSession(sessionId);
            setSessionId(null);
          } catch {
            // Session completion failed silently - non-critical
          }
        }

        setSubmitting(false);
        nextDrill();
      }

    } catch (err: unknown) {
      setSubmitting(false);
      throw err;
    }
  };

  const updateSessionActivity = useCallback(async (newIndex: number) => {
    if (sessionId && assignmentId) {
      try {
        await apiService.updateDrillSessionActivity(sessionId, newIndex);
      } catch {
        // Session activity update failed silently - non-critical
      }
    }
  }, [sessionId, assignmentId]);

  const nextDrill = () => {
    if (!assignment) return;

    if (currentIndex < assignment.items.length - 1) {
      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex);
      updateSessionActivity(newIndex);
    }
  };

  const previousDrill = () => {
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      setCurrentIndex(newIndex);
      updateSessionActivity(newIndex);
    }
  };

  const goToDrill = (index: number) => {
    if (!assignment) return;

    if (index >= 0 && index < assignment.items.length) {
      setCurrentIndex(index);
      updateSessionActivity(index);
    }
  };

  const handleCompletion = async () => {
    setCompletionData(null);
    setSubmitting(false);

    if (sessionId) {
      try {
        await apiService.completeDrillSession(sessionId);
        setSessionId(null);
      } catch {
        // Session completion failed silently - non-critical
      }
    }
  };

  const refresh = async () => {
    await loadAssignment();
  };

  // Retry and cancel functions for AI feedback
  const retryFeedback = useCallback(() => {
    if (pendingResultsAssignmentId) {
      retryFeedbackPolling();
    }
  }, [pendingResultsAssignmentId, retryFeedbackPolling]);

  const cancelFeedback = useCallback(() => {
    cancelFeedbackPolling();
    setPendingResultsAssignmentId(null);
    setError(null);
  }, [cancelFeedbackPolling]);

  if (!assignment) {
    return {
      loading,
      error: error || 'Assignment not loaded',
      assignment: null,
      drills: [],
      currentDrill: null,
      currentIndex: 0,
      totalDrills: 0,
      completedCount: 0,
      progress: { percentage: 0 },
      submitting: false,
      isLoadingOverallFeedback: false,
      aiStatus: null,
      aiProgressMessage: '',
      canRetryFeedback: false,
      completionData: null,
      sessionId: null,
      submitDrill: async () => {},
      nextDrill: () => {},
      previousDrill: () => {},
      goToDrill: () => {},
      handleCompletion: () => {},
      retryFeedback: () => {},
      cancelFeedback: () => {},
      refresh: async () => {}
    };
  }

  const drills = assignment.items;
  const totalDrills = drills.length;
  
  if (currentIndex < 0 || currentIndex >= totalDrills) {
    throw new Error(`Invalid currentIndex: ${currentIndex}. Must be between 0 and ${totalDrills - 1}`);
  }
  
  const currentDrill = drills[currentIndex];
  const completedCount = assignment.completed;

  const progress = {
    percentage: assignment.completionPercentage
  };

  return {
    loading,
    error,
    assignment,
    drills,
    currentDrill,
    currentIndex,
    totalDrills,
    completedCount,
    progress,
    submitting,
    isLoadingOverallFeedback,
    aiStatus: aiJobStatus?.status || null,
    aiProgressMessage,
    canRetryFeedback,
    completionData,
    sessionId,
    submitDrill,
    nextDrill,
    previousDrill,
    goToDrill,
    handleCompletion,
    retryFeedback,
    cancelFeedback,
    refresh
  };
};

