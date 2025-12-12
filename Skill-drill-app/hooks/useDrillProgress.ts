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
import { useToast } from './useToast';

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
  completionData: CompletionData | null; // Only set when 100% complete
  sessionId: string | null;
  submitDrill: (params: SubmitDrillParams) => Promise<void>;
  nextDrill: () => void;
  previousDrill: () => void;
  goToDrill: (index: number) => void;
  handleCompletion: () => void; // Called when user dismisses 100% completion results
  refresh: () => Promise<void>;
}

export const useDrillProgress = (assignmentId: string): UseDrillProgressReturn => {
  const router = useRouter();
  const { showError } = useToast();

  // State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [isLoadingOverallFeedback, setIsLoadingOverallFeedback] = useState(false);
  const [completionData, setCompletionData] = useState<CompletionData | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);


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
      } catch (err) {
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
      setError(err.message || 'Failed to load drills');
      showError(err.message || 'Failed to load drills');
    } finally {
      setLoading(false);
    }
  }, [assignmentId, showError, startOrResumeSession]);

  useEffect(() => {
    if (assignmentId) {
      loadAssignment();
    }
  }, [assignmentId, loadAssignment]);

  const submitDrill = async (params: SubmitDrillParams) => {
    if (!assignment || !currentDrill) {
      showError('No drill selected');
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
              responseType: params.textContent ? 'TEXT' : 'AUDIO'
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
          } catch (err) {
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
        setIsLoadingOverallFeedback(true);

        const assignmentIdForPolling = result.assignmentId || assignment.id;
        if (!assignmentIdForPolling) {
          throw new Error('Assignment ID not found for polling');
        }

        const maxRetries = 20;
        const retryDelay = 2000;
        let attempts = 0;

        const pollForOverallFeedback = async (): Promise<void> => {
          try {
            const response = await apiService.getDrillResults(assignmentIdForPolling);

            if (response.success) {
              if (response.data.status === 'ready') {
                setIsLoadingOverallFeedback(false);
                
                const aggregateRes = await apiService.getDrillAggregate(assignmentIdForPolling);
                if (!aggregateRes.success || !aggregateRes.data) {
                  throw new Error('Failed to fetch aggregate data');
                }
                const aggregate = aggregateRes.data;

                if (!response.data.skillName) {
                  throw new Error('Skill name not found in drill results');
                }

                if (aggregate.averageScore === undefined || aggregate.attemptsCount === undefined) {
                  throw new Error('Aggregate data incomplete');
                }

                const completionDataToSet = {
                  reached: true,
                  skillName: response.data.skillName,
                  overall: {
                    finalScore: response.data.finalScore,
                    feedbackGood: response.data.feedbackGood,
                    feedbackImprove: response.data.feedbackImprove,
                    feedbackSummary: response.data.feedbackSummary
                  },
                  stats: {
                    averageScore: aggregate.averageScore,
                    attemptsCount: aggregate.attemptsCount
                  }
                };

                setCompletionData(completionDataToSet);

                router.replace({
                  pathname: "/drillsResults",
                  params: {
                    overall: JSON.stringify({
                      ...completionDataToSet.overall,
                      skillName: response.data.skillName
                    }),
                    averageScore: String(aggregate.averageScore),
                    attemptsCount: String(aggregate.attemptsCount),
                  }
                });
              } else if (response.data.status === 'processing') {
                attempts++;
                if (attempts >= maxRetries) {
                  setIsLoadingOverallFeedback(false);
                  showError('Results are taking longer than expected. Please try again later.');
                } else {
                  setTimeout(pollForOverallFeedback, retryDelay);
                }
              } else {
                setIsLoadingOverallFeedback(false);
                showError('Unexpected response format');
              }
            } else {
              setIsLoadingOverallFeedback(false);
              showError(response.message || 'Failed to load drill results');
            }
          } catch (error) {
            attempts++;
            if (attempts >= maxRetries) {
              setIsLoadingOverallFeedback(false);
              showError('Failed to load drill results. Please try again later.');
            } else {
              setTimeout(pollForOverallFeedback, retryDelay);
            }
          }
        };

        pollForOverallFeedback();
        return;
      }

      if (result.progress.completionPercentage !== 100) {
        const allCompleted = updatedItems.every(item => item.isCompleted);
        if (allCompleted && sessionId) {
          try {
            await apiService.completeDrillSession(sessionId);
            setSessionId(null);
          } catch (err) {
          }
        }

        setSubmitting(false);
        nextDrill();
      }

    } catch (err: unknown) {
      showError(err.message || 'Failed to submit drill');
      setSubmitting(false);
      throw err;
    }
  };

  const updateSessionActivity = useCallback(async (newIndex: number) => {
    if (sessionId && assignmentId) {
      try {
        await apiService.updateDrillSessionActivity(sessionId, newIndex);
      } catch (err) {
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
      } catch (err) {
      }
    }
  };

  const refresh = async () => {
    await loadAssignment();
  };

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
      completionData: null,
      sessionId: null,
      submitDrill: async () => {},
      nextDrill: () => {},
      previousDrill: () => {},
      goToDrill: () => {},
      handleCompletion: () => {},
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
    completionData,
    sessionId,
    submitDrill,
    nextDrill,
    previousDrill,
    goToDrill,
    handleCompletion,
    refresh
  };
};

