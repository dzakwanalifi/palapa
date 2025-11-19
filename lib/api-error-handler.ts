/**
 * Centralized API Error Handler
 * Handles "Failed to fetch" errors dan provides meaningful feedback
 */

export interface ApiError {
  type: 'network' | 'permission' | 'auth' | 'validation' | 'server' | 'unknown';
  message: string;
  originalError?: Error;
  details?: Record<string, any>;
  retryable: boolean;
}

export class ApiErrorHandler {
  /**
   * Handle Firebase Firestore permission errors
   */
  static handleFirestoreError(error: any): ApiError {
    const errorMessage = error?.message || error?.code || 'Unknown error';

    // Permission denied
    if (errorMessage.includes('PERMISSION_DENIED') || errorMessage.includes('insufficient permissions')) {
      return {
        type: 'permission',
        message: 'Firebase Firestore permissions not configured. Check security rules.',
        originalError: error,
        details: {
          code: error?.code,
          hint: 'Update Firestore security rules in Firebase Console'
        },
        retryable: false
      };
    }

    // Not found
    if (errorMessage.includes('NOT_FOUND')) {
      return {
        type: 'validation',
        message: 'Collection or document not found in Firestore',
        originalError: error,
        retryable: false
      };
    }

    // Network error
    if (errorMessage.includes('UNAVAILABLE') || errorMessage.includes('INTERNAL')) {
      return {
        type: 'network',
        message: 'Firestore connection unavailable',
        originalError: error,
        details: {
          code: error?.code,
          hint: 'Check your internet connection and Firebase project status'
        },
        retryable: true
      };
    }

    return {
      type: 'unknown',
      message: `Firestore error: ${errorMessage}`,
      originalError: error,
      retryable: false
    };
  }

  /**
   * Handle Gemini API errors
   */
  static handleGeminiError(error: any): ApiError {
    const errorMessage = error?.message || error?.status || 'Unknown error';

    if (error?.status === 401) {
      return {
        type: 'auth',
        message: 'Invalid Gemini API key. Check GEMINI_API_KEY in .env.local',
        originalError: error,
        retryable: false
      };
    }

    if (error?.status === 429) {
      return {
        type: 'server',
        message: 'Gemini API rate limit exceeded. Try again later.',
        originalError: error,
        retryable: true
      };
    }

    if (error?.status === 400) {
      return {
        type: 'validation',
        message: 'Invalid request to Gemini API',
        originalError: error,
        retryable: false
      };
    }

    return {
      type: 'unknown',
      message: `Gemini API error: ${errorMessage}`,
      originalError: error,
      retryable: false
    };
  }

  /**
   * Handle generic fetch errors (network issues)
   */
  static handleFetchError(error: any): ApiError {
    if (error instanceof TypeError) {
      if (error.message.includes('Failed to fetch')) {
        return {
          type: 'network',
          message: 'Network request failed. Check your internet connection and CORS configuration.',
          originalError: error,
          details: {
            hint: 'This often means: API is down, CORS blocked, or invalid URL'
          },
          retryable: true
        };
      }

      if (error.message.includes('NetworkError')) {
        return {
          type: 'network',
          message: 'Network error occurred',
          originalError: error,
          retryable: true
        };
      }
    }

    return {
      type: 'unknown',
      message: `Fetch error: ${error?.message || 'Unknown error'}`,
      originalError: error,
      retryable: false
    };
  }

  /**
   * Parse any API error and return structured ApiError
   */
  static parse(error: any, context?: string): ApiError {
    if (!error) {
      return {
        type: 'unknown',
        message: 'Unknown error occurred',
        retryable: false
      };
    }

    // Check error type
    if (error?.code === 'PERMISSION_DENIED' || error?.message?.includes('permission')) {
      return this.handleFirestoreError(error);
    }

    if (error?.name === 'ApiError' || error?.status) {
      return this.handleGeminiError(error);
    }

    if (error instanceof TypeError) {
      return this.handleFetchError(error);
    }

    // Default
    return {
      type: 'unknown',
      message: error?.message || 'An error occurred',
      originalError: error,
      retryable: false
    };
  }

  /**
   * Log error with context
   */
  static log(error: ApiError, context: string = 'API Error'): void {
    console.error(`[${context}] ${error.type.toUpperCase()}: ${error.message}`);

    if (error.details) {
      console.error('Details:', error.details);
    }

    if (error.originalError && process.env.NODE_ENV === 'development') {
      console.error('Original error:', error.originalError);
    }

    if (error.retryable) {
      console.info('This error is retryable. Consider implementing retry logic.');
    }
  }

  /**
   * Get user-friendly error message
   */
  static getMessage(error: ApiError): string {
    switch (error.type) {
      case 'network':
        return 'Network error. Please check your internet connection and try again.';
      case 'permission':
        return 'You do not have permission to access this resource. Please contact support.';
      case 'auth':
        return 'Authentication error. Please check your credentials.';
      case 'validation':
        return 'Invalid request. Please check your input and try again.';
      case 'server':
        return 'Server error. Please try again later.';
      default:
        return error.message || 'An unexpected error occurred.';
    }
  }
}

/**
 * React Hook for handling API errors
 */
export function useApiErrorHandler() {
  const handleError = (error: any, context?: string) => {
    const apiError = ApiErrorHandler.parse(error, context);
    ApiErrorHandler.log(apiError, context);
    return apiError;
  };

  return { handleError, ApiErrorHandler };
}

/**
 * Retry helper for retryable errors
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<T> {
  let lastError: ApiError | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      const apiError = ApiErrorHandler.parse(error);

      if (!apiError.retryable || attempt === maxRetries) {
        throw error;
      }

      lastError = apiError;
      const delay = initialDelay * Math.pow(2, attempt - 1);
      console.warn(`Attempt ${attempt} failed. Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError || new Error('Max retries exceeded');
}
