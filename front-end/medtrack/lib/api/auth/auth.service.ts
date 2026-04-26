/**
 * Authentication API Service
 * Handles all authentication-related API calls
 */

import { getApiUrl, API_ENDPOINTS } from '../config';
import { saveToken, saveUser, removeToken, getToken, getAuthHeader } from '../../utils/token';
import type { ApiError } from '../types';

// Types
export interface RegisterRequest {
  fullname: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface OTPVerificationRequest {
  email: string;
  otp: string;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordReset {
  email: string;
  newPassword: string;
}

export interface AuthResponse {
  status: string;
  message: string;
  token?: string;
  user?: {
    id: string;
    fullname: string;
    email: string;
    profilePicture?: any;
  };
  email?: string;
  error?: string;
  isFirstLogin?: boolean;
}

/**
 * Make API request with error handling
 */
const apiRequest = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const url = getApiUrl(endpoint);
  
  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
  };

  const response = await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw {
      status: data.status || 'error',
      message: data.message || 'An error occurred',
      error: data.error,
      statusCode: response.status,
    } as ApiError & { statusCode: number };
  }

  return data as T;
};

/**
 * Register a new user
 */
export const registerUser = async (
  data: RegisterRequest
): Promise<AuthResponse> => {
  return apiRequest<AuthResponse>(API_ENDPOINTS.AUTH.REGISTER, {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

/**
 * Verify OTP for registration
 */
export const verifyOTP = async (
  data: OTPVerificationRequest
): Promise<AuthResponse> => {
  return apiRequest<AuthResponse>(API_ENDPOINTS.AUTH.VERIFY_OTP, {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

/**
 * Login user
 */
export const loginUser = async (
  data: LoginRequest
): Promise<AuthResponse> => {
  return apiRequest<AuthResponse>(API_ENDPOINTS.AUTH.LOGIN, {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

/**
 * Verify OTP for login
 */
export const verifyLoginOTP = async (
  data: OTPVerificationRequest
): Promise<AuthResponse> => {
  const response = await apiRequest<AuthResponse>(
    API_ENDPOINTS.AUTH.VERIFY_LOGIN_OTP,
    {
      method: 'POST',
      body: JSON.stringify(data),
    }
  );

  // Save token and user data if login is successful
  if (response.status === 'success' && response.token && response.user) {
    try {
      saveToken(response.token);
      saveUser(response.user);
      
      // Verify token was saved
      if (typeof window !== 'undefined') {
        const savedToken = localStorage.getItem('medtrack_token');
        if (!savedToken || savedToken !== response.token) {
          console.error('Failed to save token to localStorage');
          throw new Error('Failed to save authentication token');
        }
      }
    } catch (error) {
      console.error('Error saving token:', error);
      throw error;
    }
  }

  return response;
};

/**
 * Get current authenticated user
 */
export const getCurrentUser = async (): Promise<AuthResponse> => {
  const token = getToken();

  if (!token) {
    throw {
      status: 'error',
      message: 'No authentication token found',
      statusCode: 401,
    } as ApiError & { statusCode: number };
  }

  return apiRequest<AuthResponse>(API_ENDPOINTS.AUTH.CURRENT_USER, {
    method: 'GET',
    headers: getAuthHeader() as HeadersInit,
  });
};

/**
 * Request password reset
 */
export const requestPasswordReset = async (
  data: PasswordResetRequest
): Promise<{ success: boolean; message: string }> => {
  return apiRequest<{ success: boolean; message: string }>(
    API_ENDPOINTS.AUTH.PASSWORD_RESET_REQUEST,
    {
      method: 'POST',
      body: JSON.stringify(data),
    }
  );
};

/**
 * Reset password
 */
export const resetPassword = async (
  data: PasswordReset
): Promise<{ success: boolean; message: string }> => {
  return apiRequest<{ success: boolean; message: string }>(
    API_ENDPOINTS.AUTH.PASSWORD_RESET,
    {
      method: 'POST',
      body: JSON.stringify(data),
    }
  );
};

/**
 * Change first login password
 */
export const changeFirstPassword = async (
  data: any
): Promise<{ success: boolean; message: string }> => {
  const token = getToken();

  if (!token) {
    throw {
      status: 'error',
      message: 'No authentication token found',
      statusCode: 401,
    } as ApiError & { statusCode: number };
  }

  return apiRequest<{ success: boolean; message: string }>(
    API_ENDPOINTS.AUTH.CHANGE_FIRST_PASSWORD,
    {
      method: 'POST',
      headers: getAuthHeader() as HeadersInit,
      body: JSON.stringify(data),
    }
  );
};

/**
 * Logout user
 */
export const logoutUser = (): void => {
  removeToken();
};

