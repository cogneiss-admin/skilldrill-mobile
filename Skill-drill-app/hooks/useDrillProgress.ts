/**
 * useDrillProgress Hook
 *
 * Manages drill practice state and milestone feedback.
 *
 * Features:
 * - Load drill assignment with all items
 * - Track current drill and progress
 * - Submit drill attempts with AI scoring
 * - Detect milestone completions (25%, 50%, 75%, 100%)
 * - Show aggregate feedback at milestones
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
 *   milestoneData,
 *   submitDrill,
 *   nextDrill,
 *   previousDrill,
 *   dismissMilestone
 * } = useDrillProgress(assignmentId);
 */

import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiService from '../services/api';
import { useToast } from './useToast';

const DRILL_SESSION_KEY = 'drill_session_data';

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

interface MilestoneData {
  reached: boolean;
  percentage: number;
  averageScore: number;
  attemptsCount: number;
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
    nextMilestonePct: number | null;
  };
  submitting: boolean;
  milestoneData: MilestoneData | null;
  sessionId: string | null;
  submitDrill: (params: SubmitDrillParams) => Promise<void>;
  nextDrill: () => void;
  previousDrill: () => void;
  goToDrill: (index: number) => void;
  dismissMilestone: () => void;
  refresh: () => Promise<void>;
}

export const useDrillProgress = (assignmentId: string): UseDrillProgressReturn => {
  const { showError, showSuccess } = useToast();

  // State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [milestoneData, setMilestoneData] = useState<MilestoneData | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);

  /**
   * Save session data to AsyncStorage
   */
  const saveSessionData = useCallback(async (sessionId: string, assignmentId: string, currentIndex: number) => {
    try {
      const sessionData = {
        sessionId,
        assignmentId,
        currentIndex,
        timestamp: Date.now()
      };
      await AsyncStorage.setItem(DRILL_SESSION_KEY, JSON.stringify(sessionData));
      console.log('[DrillProgress] Session data saved:', sessionData);
    } catch (err) {
      console.warn('[DrillProgress] Failed to save session data:', err);
    }
  }, []);

  /**
   * Load session data from AsyncStorage
   */
  const loadSessionData = useCallback(async (): Promise<{ sessionId: string; assignmentId: string; currentIndex: number } | null> => {
    try {
      const data = await AsyncStorage.getItem(DRILL_SESSION_KEY);
      if (data) {
        const sessionData = JSON.parse(data);
        // Check if session is for current assignment and not too old (24 hours)
        if (sessionData.assignmentId === assignmentId && 
            Date.now() - sessionData.timestamp < 24 * 60 * 60 * 1000) {
          console.log('[DrillProgress] Session data loaded:', sessionData);
          return sessionData;
        } else {
          // Clear stale session data
          await AsyncStorage.removeItem(DRILL_SESSION_KEY);
        }
      }
      return null;
    } catch (err) {
      console.warn('[DrillProgress] Failed to load session data:', err);
      return null;
    }
  }, [assignmentId]);

  /**
   * Start or resume drill session
   */
  const startOrResumeSession = useCallback(async (assignmentData: Assignment) => {
    try {
      // Check for existing session in AsyncStorage first
      const savedSession = await loadSessionData();
      
      let sessionResponse;
      if (savedSession) {
        // Try to resume from saved session
        try {
          const statusRes = await apiService.getDrillSessionStatus(assignmentId);
          if (statusRes.success && statusRes.data.hasActiveSession) {
            // Use existing session
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
            // Start new session
            sessionResponse = await apiService.startDrillSession(assignmentId);
          }
        } catch (err) {
          // Start new session if resume fails
          sessionResponse = await apiService.startDrillSession(assignmentId);
        }
      } else {
        // Start new session
        sessionResponse = await apiService.startDrillSession(assignmentId);
      }

      if (!sessionResponse.success) {
        throw new Error(sessionResponse.message || 'Failed to start session');
      }

      const sessionData = sessionResponse.data;
      setSessionId(sessionData.sessionId);

      // Use session's currentDrillIndex if available, otherwise find first incomplete
      let initialIndex = sessionData.currentDrillIndex !== undefined 
        ? sessionData.currentDrillIndex 
        : assignmentData.items.findIndex((item: DrillItem) => !item.isCompleted);

      if (initialIndex === -1) {
        initialIndex = 0; // All completed, start from beginning
      }

      setCurrentIndex(initialIndex);
      await saveSessionData(sessionData.sessionId, assignmentId, initialIndex);

      console.log('[DrillProgress] Session started/resumed:', {
        sessionId: sessionData.sessionId,
        isResuming: sessionData.isResuming,
        currentIndex: initialIndex
      });

      return sessionData.sessionId;
    } catch (err: unknown) {
      console.error('[DrillProgress] Session start error:', err);
      // Don't fail completely, just continue without session tracking
      return null;
    }
  }, [assignmentId, loadSessionData, saveSessionData]);

  /**
   * Load assignment and drill items
   */
  const loadAssignment = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('[DrillProgress] Loading assignment:', assignmentId);

      const res = await apiService.getDrillAssignment(assignmentId);

      if (!res.success) {
        throw new Error(res.message || 'Failed to load drill assignment');
      }

      const assignmentData = res.data;

      // Sort items by orderIndex
      assignmentData.items.sort((a: DrillItem, b: DrillItem) => a.orderIndex - b.orderIndex);

      setAssignment(assignmentData);

      // Start or resume session
      const sessionId = await startOrResumeSession(assignmentData);
      if (sessionId) {
        setSessionId(sessionId);
      }

      // If session didn't set index, find first incomplete drill
      if (!sessionId) {
        const firstIncompleteIndex = assignmentData.items.findIndex(
          (item: DrillItem) => !item.isCompleted
        );

        if (firstIncompleteIndex !== -1) {
          setCurrentIndex(firstIncompleteIndex);
        } else {
          // All drills completed - start from beginning for review
          setCurrentIndex(0);
        }
      }

      console.log('[DrillProgress] Assignment loaded:', {
        total: assignmentData.total,
        completed: assignmentData.completed,
        percentage: assignmentData.completionPercentage,
        hasSession: !!sessionId
      });

    } catch (err: unknown) {
      console.error('[DrillProgress] Load error:', err);
      setError(err.message || 'Failed to load drills');
      showError(err.message || 'Failed to load drills');
    } finally {
      setLoading(false);
    }
  }, [assignmentId, showError, startOrResumeSession]);

  // Load assignment on mount
  useEffect(() => {
    if (assignmentId) {
      loadAssignment();
    }
  }, [assignmentId, loadAssignment]);

  /**
   * Submit drill attempt
   */
  const submitDrill = async (params: SubmitDrillParams) => {
    if (!assignment || !currentDrill) {
      showError('No drill selected');
      return;
    }

    setSubmitting(true);

    try {
      console.log('[DrillProgress] Submitting drill attempt:', {
        drillItemId: currentDrill.id,
        hasText: !!params.textContent,
        hasAudio: !!params.audioUrl
      });

      const res = await apiService.submitDrillAttempt({
        drillItemId: currentDrill.id,
        textContent: params.textContent,
        audioUrl: params.audioUrl,
        durationSec: params.durationSec,
        sessionId: sessionId || undefined
      });

      if (!res.success) {
        throw new Error(res.message || 'Failed to submit drill');
      }

      const result = res.data;

      console.log('[DrillProgress] Drill scored:', {
        score: result.finalScore,
        percentage: result.progress.completionPercentage,
        milestone: result.milestone?.reached
      });

      // Update local state
      const updatedItems = assignment.items.map(item => {
        if (item.id === currentDrill.id) {
          return {
            ...item,
            isCompleted: true,
            lastAttempt: {
              id: 'new', // Backend doesn't return attempt ID in response
              finalScore: result.finalScore,
              submittedAt: new Date().toISOString(),
              responseType: params.textContent ? 'TEXT' : 'AUDIO'
            }
          };
        }
        return item;
      });

      setAssignment({
        ...assignment,
        items: updatedItems,
        completed: assignment.completed + 1,
        completionPercentage: result.progress.completionPercentage
      });

      // Check if milestone reached and set milestone data
      if (result.milestone?.reached && result.milestone.aggregate) {
        console.log('[DrillProgress] Milestone reached!', {
          percentage: result.progress.completionPercentage,
          averageScore: result.milestone.aggregate.averageScore,
          attemptsCount: result.milestone.aggregate.attemptsCount
        });

        setMilestoneData({
          reached: true,
          percentage: result.progress.completionPercentage,
          averageScore: result.milestone.aggregate.averageScore,
          attemptsCount: result.milestone.aggregate.attemptsCount
        });

        // Keep submitting=true to prevent re-submission while modal is showing
        // Modal will call dismissMilestone which will clear submitting state
        return;
      }

      // Show success and auto-advance to next drill
      showSuccess('Drill completed!');
      setSubmitting(false);

      // Check if all drills are completed
      const allCompleted = updatedItems.every(item => item.isCompleted);
      if (allCompleted && sessionId) {
        // Complete the session
        try {
          await apiService.completeDrillSession(sessionId);
          await AsyncStorage.removeItem(DRILL_SESSION_KEY);
          setSessionId(null);
        } catch (err) {
          console.warn('[DrillProgress] Failed to complete session:', err);
        }
      }

      // Auto-advance to next drill after short delay
      setTimeout(() => {
        nextDrill();
      }, 1500);

    } catch (err: unknown) {
      console.error('[DrillProgress] Submit error:', err);
      showError(err.message || 'Failed to submit drill');
      setSubmitting(false);
      throw err;
    }
  };

  /**
   * Update session activity when navigating
   */
  const updateSessionActivity = useCallback(async (newIndex: number) => {
    if (sessionId && assignmentId) {
      try {
        await apiService.updateDrillSessionActivity(sessionId, newIndex);
        await saveSessionData(sessionId, assignmentId, newIndex);
      } catch (err) {
        console.warn('[DrillProgress] Failed to update session activity:', err);
      }
    }
  }, [sessionId, assignmentId, saveSessionData]);

  /**
   * Navigate to next drill
   */
  const nextDrill = () => {
    if (!assignment) return;

    if (currentIndex < assignment.items.length - 1) {
      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex);
      updateSessionActivity(newIndex);
      console.log('[DrillProgress] Advanced to drill', newIndex + 1);
    } else {
      console.log('[DrillProgress] Already at last drill');
    }
  };

  /**
   * Navigate to previous drill
   */
  const previousDrill = () => {
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      setCurrentIndex(newIndex);
      updateSessionActivity(newIndex);
      console.log('[DrillProgress] Moved to drill', newIndex + 1);
    } else {
      console.log('[DrillProgress] Already at first drill');
    }
  };

  /**
   * Jump to specific drill
   */
  const goToDrill = (index: number) => {
    if (!assignment) return;

    if (index >= 0 && index < assignment.items.length) {
      setCurrentIndex(index);
      updateSessionActivity(index);
      console.log('[DrillProgress] Jumped to drill', index + 1);
    } else {
      console.warn('[DrillProgress] Invalid drill index:', index);
    }
  };

  /**
   * Dismiss milestone modal and auto-advance
   */
  const dismissMilestone = () => {
    console.log('[DrillProgress] Dismissing milestone');
    setMilestoneData(null);
    setSubmitting(false); // Re-enable submit button for next drill
    nextDrill();
  };

  /**
   * Refresh assignment data
   */
  const refresh = async () => {
    await loadAssignment();
  };

  // Computed values
  const drills = assignment?.items || [];
  const currentDrill = drills[currentIndex] || null;
  const totalDrills = drills.length;
  const completedCount = assignment?.completed || 0;

  const progress = {
    percentage: assignment?.completionPercentage || 0,
    nextMilestonePct: assignment ? calculateNextMilestone(assignment.completionPercentage) : null
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
    milestoneData,
    sessionId,
    submitDrill,
    nextDrill,
    previousDrill,
    goToDrill,
    dismissMilestone,
    refresh
  };
};

/**
 * Calculate next milestone percentage
 */
const calculateNextMilestone = (currentPercentage: number): number | null => {
  const milestones = [25, 50, 75, 100];

  for (const milestone of milestones) {
    if (currentPercentage < milestone) {
      return milestone;
    }
  }

  return null; // All milestones completed
};
