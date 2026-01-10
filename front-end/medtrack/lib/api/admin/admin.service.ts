/**
 * Admin API Service
 * Handles all admin-related API calls
 */

import { getApiUrl, API_ENDPOINTS } from '../config';
import { saveToken, saveUser, removeToken, getToken, getAuthHeader } from '../../utils/token';
import type { ApiError } from '../types';

// Types
export interface AdminRegisterRequest {
  fullname: string;
  email: string;
  password: string;
}

export interface AdminLoginRequest {
  email: string;
  password: string;
}

export interface AdminOTPVerificationRequest {
  email: string;
  otp: string;
}

export interface AdminAuthResponse {
  status: string;
  message: string;
  token?: string;
  admin?: {
    id: string;
    fullname: string;
    email: string;
    role: string;
  };
  email?: string;
  error?: string;
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
 * Register a new admin
 */
export const registerAdmin = async (
  data: AdminRegisterRequest
): Promise<AdminAuthResponse> => {
  return apiRequest<AdminAuthResponse>(API_ENDPOINTS.ADMIN.REGISTER, {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

/**
 * Verify OTP for admin registration
 */
export const verifyAdminOTP = async (
  data: AdminOTPVerificationRequest
): Promise<AdminAuthResponse> => {
  return apiRequest<AdminAuthResponse>(API_ENDPOINTS.ADMIN.VERIFY_OTP, {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

/**
 * Login admin
 */
export const loginAdmin = async (
  data: AdminLoginRequest
): Promise<AdminAuthResponse> => {
  return apiRequest<AdminAuthResponse>(API_ENDPOINTS.ADMIN.LOGIN, {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

/**
 * Verify OTP for admin login
 */
export const verifyAdminLoginOTP = async (
  data: AdminOTPVerificationRequest
): Promise<AdminAuthResponse> => {
  const response = await apiRequest<AdminAuthResponse>(
    API_ENDPOINTS.ADMIN.VERIFY_LOGIN_OTP,
    {
      method: 'POST',
      body: JSON.stringify(data),
    }
  );

  // Save token and admin data if login is successful
  if (response.status === 'success' && response.token && response.admin) {
    try {
      saveToken(response.token);
      saveUser(response.admin);
      
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
 * Get all users (Admin only)
 */
export const getAllUsers = async (): Promise<{
  success: boolean;
  message: string;
  data: any[];
}> => {
  const token = getToken();

  if (!token) {
    throw {
      status: 'error',
      message: 'No authentication token found',
      statusCode: 401,
    } as ApiError & { statusCode: number };
  }

  return apiRequest<{ success: boolean; message: string; data: any[] }>(
    API_ENDPOINTS.ADMIN.GET_ALL_USERS,
    {
      method: 'GET',
      headers: getAuthHeader() as HeadersInit,
    }
  );
};

/**
 * Delete user by ID (Admin only)
 */
export const deleteUser = async (userId: string): Promise<{
  success: boolean;
  message: string;
}> => {
  const token = getToken();

  if (!token) {
    throw {
      status: 'error',
      message: 'No authentication token found',
      statusCode: 401,
    } as ApiError & { statusCode: number };
  }

  return apiRequest<{ success: boolean; message: string }>(
    `${API_ENDPOINTS.ADMIN.DELETE_USER}/${userId}`,
    {
      method: 'DELETE',
      headers: getAuthHeader() as HeadersInit,
    }
  );
};

/**
 * Logout admin
 */
export const logoutAdmin = (): void => {
  removeToken();
};

