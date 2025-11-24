// Error handling utilities for the mobile app

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
  details?: Record<string, unknown>;
}

export interface ValidationError {
  field: string;
  message: string;
}

export class AppError extends Error {
  public code?: string;
  public status?: number;
  public details?: Record<string, unknown>;

  constructor(message: string, code?: string, status?: number, details?: Record<string, unknown>) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

// Parse API error responses
export function parseApiError(error: unknown): ApiError {
  if (error instanceof AppError) {
    return {
      message: error.message,
      code: error.code,
      status: error.status,
      details: error.details,
    };
  }

  // Handle Axios errors
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const axiosError = error as { response?: { data?: { message?: string; error?: string; code?: string; details?: Record<string, unknown>; retry_after?: number; retryAfter?: number }; status?: number } };
    if (axiosError.response?.data) {
      const data = axiosError.response.data;
      return {
        message: data.message || data.error || 'An error occurred',
        code: data.code,
        status: axiosError.response.status,
        details: {
          ...(data.details || {}),
          retryAfter: data.retry_after || data.retryAfter,
        },
      };
    }
  }

  // Handle Error objects
  if (error instanceof Error) {
    return {
      message: error.message,
      code: undefined,
      status: undefined,
    };
  }

  return {
    message: 'An unexpected error occurred',
  };
}

// Format error messages for display
export function formatErrorMessage(error: ApiError | string): string {
  if (typeof error === 'string') {
    return error;
  }

  // Handle common error codes
  if (error.code) {
    switch (error.code) {
      case 'USER_NOT_FOUND':
        return 'Account not found. Please sign up.';
      case 'ACCOUNT_PENDING_VERIFICATION':
        return 'Account pending verification.';
      case 'ACCOUNT_SUSPENDED':
        return 'Account suspended. Contact support.';
      case 'ACCOUNT_INACTIVE':
        return 'Account inactive. Contact support.';
      case 'NETWORK_ERROR':
        return 'Connection error. Check internet.';
      case 'TIMEOUT':
        return 'Request timeout. Try again.';
      case 'INVALID_OTP':
        return 'Invalid OTP. Try again.';
      case 'OTP_EXPIRED':
        return 'OTP expired. Request new one.';
      case 'OTP_RATE_LIMIT_EXCEEDED': {
        // If backend provides retry-after seconds, format a friendlier message
        const errorDetails = error.details as { retryAfter?: number; retry_after?: number } | undefined;
        const seconds = errorDetails?.retryAfter || errorDetails?.retry_after;
        if (typeof seconds === 'number' && seconds > 0) {
          const mins = Math.ceil(seconds / 60);
          return `Too many OTP requests. Try again in ${mins} minute${mins > 1 ? 's' : ''}.`;
        }
        return 'Too many OTP requests. Please try again later.';
      }
      case 'TOO_MANY_ATTEMPTS':
        return 'Too many attempts. Try later.';
      case 'INVALID_CREDENTIALS':
        return 'Invalid email or password.';
      case 'EMAIL_ALREADY_EXISTS':
        return 'Email already exists.';
      case 'PHONE_ALREADY_EXISTS':
        return 'Phone number already exists.';
      default:
        return error.message || 'Something went wrong.';
    }
  }

  // Handle HTTP status codes
  if (error.status) {
    switch (error.status) {
      case 400:
        return error.message || 'Invalid request.';
      case 401:
        return 'Not authorized. Please log in.';
      case 403:
        return 'Access denied.';
      case 404:
        return 'Resource not found.';
      case 409:
        return 'Resource already exists.';
      case 422:
        return error.message || 'Validation failed.';
      case 429:
        return 'Too many requests. Try later.';
      case 500:
        return 'Server error. Try later.';
      case 502:
      case 503:
      case 504:
        return 'Service unavailable. Try later.';
      default:
        return error.message || 'Something went wrong.';
    }
  }

  return error.message || 'Something went wrong.';
}

// Get user-friendly error title
export function getErrorTitle(error: ApiError | string): string {
  if (typeof error === 'string') {
    return 'Error';
  }

  if (error.code) {
    switch (error.code) {
      case 'USER_NOT_FOUND':
        return 'Account Not Found';
      case 'ACCOUNT_PENDING_VERIFICATION':
        return 'Account Pending';
      case 'ACCOUNT_SUSPENDED':
        return 'Account Suspended';
      case 'ACCOUNT_INACTIVE':
        return 'Account Inactive';
      case 'NETWORK_ERROR':
        return 'Connection Error';
      case 'TIMEOUT':
        return 'Timeout';
      case 'INVALID_OTP':
        return 'Invalid OTP';
      case 'OTP_EXPIRED':
        return 'OTP Expired';
      case 'TOO_MANY_ATTEMPTS':
        return 'Too Many Attempts';
      case 'INVALID_CREDENTIALS':
        return 'Invalid Credentials';
      case 'EMAIL_ALREADY_EXISTS':
        return 'Email Already Exists';
      case 'PHONE_ALREADY_EXISTS':
        return 'Phone Already Exists';
      default:
        return 'Error';
    }
  }

  if (error.status) {
    switch (error.status) {
      case 400:
        return 'Invalid Request';
      case 401:
        return 'Unauthorized';
      case 403:
        return 'Access Denied';
      case 404:
        return 'Not Found';
      case 409:
        return 'Conflict';
      case 422:
        return 'Validation Error';
      case 429:
        return 'Too Many Requests';
      case 500:
        return 'Server Error';
      case 502:
      case 503:
      case 504:
        return 'Service Unavailable';
      default:
        return 'Error';
    }
  }

  return 'Error';
}

// Check if error is retryable
export function isRetryableError(error: ApiError | string): boolean {
  if (typeof error === 'string') {
    return false;
  }

  if (error.code) {
    return ['NETWORK_ERROR', 'TIMEOUT'].includes(error.code);
  }

  if (error.status) {
    return error.status >= 500 || error.status === 429;
  }

  return false;
}

// Get error severity level
export function getErrorSeverity(error: ApiError | string): 'low' | 'medium' | 'high' | 'critical' {
  if (typeof error === 'string') {
    return 'medium';
  }

  if (error.code) {
    switch (error.code) {
      case 'USER_NOT_FOUND':
      case 'EMAIL_ALREADY_EXISTS':
      case 'PHONE_ALREADY_EXISTS':
        return 'low';
      case 'ACCOUNT_PENDING_VERIFICATION':
      case 'INVALID_OTP':
      case 'OTP_EXPIRED':
      case 'INVALID_CREDENTIALS':
        return 'medium';
      case 'TOO_MANY_ATTEMPTS':
        return 'high';
      case 'ACCOUNT_SUSPENDED':
      case 'ACCOUNT_INACTIVE':
      case 'NETWORK_ERROR':
      case 'TIMEOUT':
        return 'critical';
      default:
        return 'medium';
    }
  }

  if (error.status) {
    switch (error.status) {
      case 400:
      case 422:
        return 'low';
      case 401:
      case 403:
      case 404:
      case 409:
        return 'medium';
      case 429:
        return 'high';
      case 500:
      case 502:
      case 503:
      case 504:
        return 'critical';
      default:
        return 'medium';
    }
  }

  return 'medium';
}

// Create a standardized error object
export function createError(
  message: string,
  code?: string,
  status?: number,
  details?: Record<string, unknown>
): AppError {
  return new AppError(message, code, status, details);
}

// Handle network errors
export function handleNetworkError(error: unknown): ApiError {
  if (error instanceof Error && (error.name === 'NetworkError' || error.message?.includes('network'))) {
    return {
      message: 'Network error. Please check your internet connection and try again.',
      code: 'NETWORK_ERROR',
    };
  }

  if (error instanceof Error && (error.name === 'TimeoutError' || error.message?.includes('timeout'))) {
    return {
      message: 'Request timed out. Please try again.',
      code: 'TIMEOUT',
    };
  }

  return parseApiError(error);
}

// Log error for debugging
export function logError(error: unknown, context?: string) {
  const errorInfo = {
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    context,
    timestamp: new Date().toISOString(),
    userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
  };

  console.error('Mobile App Error:', errorInfo);

  // In production, you might want to send this to an error tracking service
  if (__DEV__) {
    console.group('Error Details');
    console.log('Context:', context);
    console.log('Error:', error);
    console.log('Stack:', error instanceof Error ? error.stack : undefined);
    console.groupEnd();
  }
}

// Validation helpers
export const validators = {
  required: (fieldName: string) => (value: unknown): string | null => 
    !value || (typeof value === "string" && value.trim() === "") 
      ? `${fieldName} is required` 
      : null,
  
  email: (value: string) => {
    if (!value) return null;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value) ? null : 'Please enter a valid email address';
  },
  
  phone: (value: string) => {
    if (!value) return null;
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(value.replace(/[\s\-\(\)]/g, "")) ? null : 'Please enter a valid phone number';
  },
  
  minLength: (min: number) => (value: string) => 
    value && value.length < min 
      ? `Must be at least ${min} characters` 
      : null,
  
  maxLength: (max: number) => (value: string) => 
    value && value.length > max 
      ? `Must be no more than ${max} characters` 
      : null,
  
  otp: (value: string) => {
    if (!value) return null;
    const otpRegex = /^\d{6}$/;
    return otpRegex.test(value) ? null : 'Please enter a valid 6-digit OTP';
  },
};
