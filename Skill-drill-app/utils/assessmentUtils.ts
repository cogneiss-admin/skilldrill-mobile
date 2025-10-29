/**
 * Assessment Utilities - Centralized Business Logic
 * All assessment calculations and business rules in one place
 * Single source of truth for assessment logic across the app
 */

import { 
  AssessmentStatus, 
  AssessmentActionType, 
  AssessmentProgress,
  Assessment,
  ActivityCardProgressData 
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
 * Determine what action button should be shown for an assessment
 * Centralized logic for all assessment card components
 */
export const determineAssessmentAction = (
  assessmentStatus: AssessmentStatus,
  progressData?: ActivityCardProgressData,
  templateExists?: boolean
): AssessmentActionType => {
  
  // If assessment is completed, show results
  if (assessmentStatus === AssessmentStatus.COMPLETED) {
    return AssessmentActionType.ViewResults;
  }
  
  // If assessment is pending and has progress data, show resume
  if (assessmentStatus === AssessmentStatus.PENDING && progressData && progressData.completedResponses > 0) {
    return AssessmentActionType.ResumeAssessment;
  }
  
  // Otherwise show start (handles both new assessments and generation)
  return AssessmentActionType.StartAssessment;
};

/**
 * Get user-friendly action button text
 * Centralized button text logic
 */
export const getActionButtonText = (
  action: AssessmentActionType,
  isLoading?: boolean,
  templateExists?: boolean
): string => {
  if (isLoading) {
    return action === AssessmentActionType.StartAssessment && !templateExists 
      ? 'Generating...' 
      : 'Loading...';
  }

  switch (action) {
    case AssessmentActionType.StartAssessment:
      return templateExists ? 'Start Assessment' : 'Generate Assessment';
    case AssessmentActionType.ResumeAssessment:
      return 'Resume Assessment';
    case AssessmentActionType.ViewResults:
      return 'View Details';
    default:
      return 'Start Assessment';
  }
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
  backendData: any
): AssessmentProgress | null => {
  if (!backendData) return null;
  
  // Handle different backend response formats
  const completedResponses = backendData.completedResponses || 
                            backendData.responses?.length || 
                            0;
  const totalQuestions = backendData.totalQuestions || 
                        backendData.totalPrompts || 
                        backendData.total || 
                        1;
  
  return calculateAssessmentProgress(completedResponses, totalQuestions);
};

/**
 * Safe number utility (moved from mathUtils for assessment-specific use)
 */
export const safeNumber = (value: any, fallback: number = 0): number => {
  const num = Number(value);
  return isNaN(num) ? fallback : num;
};

/**
 * Safe percentage calculation
 */
export const safePercentage = (
  numerator: any, 
  denominator: any, 
  fallback: number = 0
): number => {
  const num = safeNumber(numerator);
  const den = safeNumber(denominator);
  
  if (den === 0) return fallback;
  return Math.round((num / den) * 100);
};