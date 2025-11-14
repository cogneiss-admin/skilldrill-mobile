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

      // Find first incomplete drill
      const firstIncompleteIndex = assignmentData.items.findIndex(
        (item: DrillItem) => !item.isCompleted
      );

      if (firstIncompleteIndex !== -1) {
        setCurrentIndex(firstIncompleteIndex);
      } else {
        // All drills completed - start from beginning for review
        setCurrentIndex(0);
      }

      console.log('[DrillProgress] Assignment loaded:', {
        total: assignmentData.total,
        completed: assignmentData.completed,
        percentage: assignmentData.completionPercentage
      });

    } catch (err: any) {
      console.error('[DrillProgress] Load error:', err);
      setError(err.message || 'Failed to load drills');
      showError(err.message || 'Failed to load drills');
    } finally {
      setLoading(false);
    }
  }, [assignmentId, showError]);

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
        durationSec: params.durationSec
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

      // Check for milestone
      if (result.milestone?.reached) {
        console.log('[DrillProgress] 🎉 Milestone reached!', {
          percentage: result.progress.completionPercentage,
          avgScore: result.milestone.aggregate.averageScore
        });

        setMilestoneData({
          reached: true,
          percentage: result.progress.completionPercentage,
          averageScore: result.milestone.aggregate.averageScore,
          attemptsCount: result.milestone.aggregate.attemptsCount
        });
      } else {
        // No milestone - show brief success and auto-advance
        showSuccess('Drill completed!');

        // Auto-advance to next drill after short delay
        setTimeout(() => {
          nextDrill();
        }, 1500);
      }

    } catch (err: any) {
      console.error('[DrillProgress] Submit error:', err);
      showError(err.message || 'Failed to submit drill');
      throw err;
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * Navigate to next drill
   */
  const nextDrill = () => {
    if (!assignment) return;

    if (currentIndex < assignment.items.length - 1) {
      setCurrentIndex(currentIndex + 1);
      console.log('[DrillProgress] Advanced to drill', currentIndex + 2);
    } else {
      console.log('[DrillProgress] Already at last drill');
    }
  };

  /**
   * Navigate to previous drill
   */
  const previousDrill = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      console.log('[DrillProgress] Moved to drill', currentIndex);
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
