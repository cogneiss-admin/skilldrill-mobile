/**
 * Assessment Types - Single Source of Truth
 * All assessment-related types centralized here for consistency across the app
 * Any changes to assessment data structures should be made here only
 */

// Core Assessment Status - MUST match backend enum exactly
export enum AssessmentStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED'
}

// Assessment Action Types for UI interactions
export enum AssessmentActionType {
  StartAssessment = 'StartAssessment',
  ResumeAssessment = 'ResumeAssessment', 
  ViewResults = 'ViewResults'
}

// Core Assessment Data Models
export interface Assessment {
  id: string;
  userId: string;
  skillId: string;
  skillName: string;
  status: AssessmentStatus;
  totalQuestions: number;
  startedAt: string;
  completedAt?: string;
}

export interface AssessmentScenario {
  id: string;
  assessmentId: string;
  scenarioQuestion: string;
  orderIndex: number;
  author: string;
  isActive: boolean;
}

export interface AssessmentResponse {
  id: string;
  assessmentId: string;
  scenarioId: string;
  textContent: string;
  submittedAt: string;
  timeTakenSeconds?: number;
}

// Progress Data - Standardized across all components
export interface AssessmentProgress {
  currentQuestion: number;
  totalQuestions: number;
  completedResponses: number;
  percentage: number;
  isComplete: boolean;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message: string;
  code?: string;
}

export interface StartAssessmentResponse {
  sessionId: string;
  skillId: string;
  skillName: string;
  status: AssessmentStatus;
  question: {
    scenario: string;
    questionNumber: number;
  };
  progress: AssessmentProgress;
  isResuming?: boolean;
  resuming?: boolean; // Backend compatibility
}

export interface SubmitAnswerResponse {
  sessionId: string;
  isComplete: boolean;
  question?: {
    scenario: string;
    questionNumber: number;
  };
  progress?: AssessmentProgress;
}

// Assessment Results
export interface AssessmentResults {
  assessmentId: string;
  skillName: string;
  finalScore: number;
  subskillScores: SubskillScore[];
  feedback: AssessmentFeedback;
  completedAt: string;
}

export interface SubskillScore {
  id: string;
  name: string;
  score: number;
  weight: number;
}

export interface AssessmentFeedback {
  good: string;
  improve: string;
  summary: string;
  flaws: FlawFeedback[];
}

export interface FlawFeedback {
  tagId: string;
  tagName: string;
  severity: number;
  frequency: number;
  description: string;
}

// Component Props Types
export interface AssessmentCardProps {
  assessment: Assessment;
  progress?: AssessmentProgress;
  onAction: (action: AssessmentActionType, assessmentId: string) => void;
  isLoading?: boolean;
}

export interface AssessmentComponentProps {
  skillId: string;
  sessionId?: string;
  isResuming?: boolean;
  onComplete?: (results: AssessmentResults) => void;
  onExit?: () => void;
}

