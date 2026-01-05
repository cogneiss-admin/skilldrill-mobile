/**
 * API Types
 * Type definitions for API requests and responses
 */

import { User, AuthTokens } from '../services/api';

/**
 * Authentication Response - response from login/signup endpoints
 */
export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user?: User;
  signupToken?: string;
}

/**
 * Signup Response - response from signup endpoints
 */
export interface SignupResponse {
  signupToken?: string;
  message?: string;
  success?: boolean;
}

/**
 * Career Level - represents a career level option
 */
export interface CareerLevel {
  id: string;
  name: string;
  description?: string;
  order: number;
}

/**
 * Role Type - represents a role type option
 */
export interface RoleType {
  id: string;
  name: string;
  description?: string;
  order: number;
}

/**
 * Country - represents a country option
 */
export interface Country {
  code: string;
  name: string;
  flag?: string;
  region?: string;
}

/**
 * AI Job Status Types - matches backend AIGenerationJob model
 */
export type AIJobStatusType =
  | 'pending'
  | 'running'
  | 'runningSecondary'
  | 'completed'
  | 'failed';

/**
 * AI Job Status Response - response from job status endpoint
 */
export interface AIJobStatus {
  jobId: string;
  status: AIJobStatusType;
  message: string;
  attemptCount: number;
  maxAttempts: number;
  modelTier: 'primary' | 'secondary';
  completed: boolean;
  failed: boolean;
  error: string | null;
  retryable: boolean;
  retryCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Polling Configuration for AI jobs
 */
export interface PollingConfig {
  initialDelay: number;      // Initial delay in ms (default: 1000)
  maxDelay: number;          // Maximum delay cap in ms (default: 10000)
  backoffFactor: number;     // Exponential backoff multiplier (default: 1.5)
  maxAttempts: number;       // Maximum polling attempts (default: 30)
}

