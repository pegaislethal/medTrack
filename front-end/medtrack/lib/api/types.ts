/**
 * Shared API Types
 * Common types used across different API services
 */

export interface ApiError {
  status: string;
  message: string;
  error?: string;
  statusCode?: number;
}


