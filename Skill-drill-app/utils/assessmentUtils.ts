/**
 * Assessment Utilities - Centralized Business Logic
 * All assessment calculations and business rules in one place
 * Single source of truth for assessment logic across the app
 */

import {
  AssessmentStatus,
  AssessmentActionType,
  AssessmentProgress,
  Assessment
} from '../types/assessment';

/**
 * Calculate assessment progress from completed responses and total questions
 * This is the SINGLE function used across the entire app for progress calculation
 */
export const calculateAssessmentProgress = (
  completedResponses: number, 
  totalQuestions: number
): AssessmentProgress => {
  const completed = Math.max(0, completedResponses);
  const total = Math.max(1, totalQuestions); // Prevent division by zero
  const percentage = Math.round((completed / total) * 100);
  const currentQuestion = completed + 1;
  const isComplete = completed >= total;

  return {
    currentQuestion,
    totalQuestions: total,
    completedResponses: completed,
    percentage,
    isComplete
  };
};

/**
 * Check if assessment is resumable (has some progress but not complete)
 */
export const isAssessmentResumable = (
  status: AssessmentStatus,
  completedResponses: number,
  totalQuestions: number
): boolean => {
  return status === AssessmentStatus.PENDING && 
         completedResponses > 0 && 
         completedResponses < totalQuestions;
};

/**
 * Check if assessment is complete
 */
export const isAssessmentComplete = (
  status: AssessmentStatus,
  completedResponses?: number,
  totalQuestions?: number
): boolean => {
  if (status === AssessmentStatus.COMPLETED) {
    return true;
  }
  
  if (completedResponses !== undefined && totalQuestions !== undefined) {
    return completedResponses >= totalQuestions;
  }
  
  return false;
};

/**
 * Get assessment status badge color
 * Centralized styling logic
 */
export const getAssessmentStatusColor = (status: AssessmentStatus): string => {
  switch (status) {
    case AssessmentStatus.COMPLETED:
      return '#10B981'; // Green
    case AssessmentStatus.PENDING:
      return '#8B5CF6'; // Purple
    default:
      return '#6B7280'; // Gray
  }
};

/**
 * Get assessment status label for display
 */
export const getAssessmentStatusLabel = (status: AssessmentStatus): string => {
  switch (status) {
    case AssessmentStatus.COMPLETED:
      return 'COMPLETED';
    case AssessmentStatus.PENDING:
      return 'PENDING';
    default:
      return status;
  }
};

/**
 * Validate assessment data for consistency
 * Used for runtime checks and debugging
 */
export const validateAssessmentData = (assessment: Assessment): string[] => {
  const errors: string[] = [];
  
  if (!assessment.id) errors.push('Missing assessment ID');
  if (!assessment.skillId) errors.push('Missing skill ID');
  if (!assessment.skillName) errors.push('Missing skill name');
  if (assessment.totalQuestions <= 0) errors.push('Invalid total questions count');
  if (!Object.values(AssessmentStatus).includes(assessment.status)) {
    errors.push('Invalid assessment status');
  }
  
  return errors;
};

/**
 * Convert backend progress data to standardized format
 * Handles different data formats from various API endpoints
 */
export const normalizeProgressData = (
  backendData: Record<string, unknown>
): AssessmentProgress | null => {
  if (!backendData) return null;

  // Use exact field names from backend: currentQuestion, totalQuestions
  const currentQuestion = Number(backendData.currentQuestion);
  const totalQuestions = Number(backendData.totalQuestions);

  if (!currentQuestion || !totalQuestions) return null;

  const completedResponses = currentQuestion - 1;
  const percentage = Math.round((completedResponses / totalQuestions) * 100);
  const isComplete = completedResponses >= totalQuestions;

  return {
    currentQuestion,
    totalQuestions,
    completedResponses,
    percentage,
    isComplete
  };
};

// Import safe utilities from mathUtils (single source of truth)
import { safeNumber } from './mathUtils';

/**
 * Safe percentage calculation (assessment-specific wrapper)
 * Uses mathUtils for consistency
 */
export const safePercentage = (
  numerator: unknown, 
  denominator: unknown, 
  fallback: number = 0
): number => {
  const num = safeNumber(numerator);
  const den = safeNumber(denominator);
  
  if (den === 0) return fallback;
  return Math.round((num / den) * 100);
};

// Re-export safeNumber for convenience
export { safeNumber };