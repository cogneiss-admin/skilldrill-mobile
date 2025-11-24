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

