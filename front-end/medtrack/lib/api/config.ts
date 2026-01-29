

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// API endpoints
export const API_ENDPOINTS = {
  // Auth endpoints
  AUTH: {
    REGISTER: '/users/register',
    LOGIN: '/users/login',
    VERIFY_OTP: '/users/verify-otp',
    VERIFY_LOGIN_OTP: '/users/verify-login-otp',
    CURRENT_USER: '/current-user',
    PASSWORD_RESET_REQUEST: '/users/password-reset/request',
    PASSWORD_RESET: '/users/password-reset/reset',
  },
  // Admin endpoints
  ADMIN: {
    REGISTER: '/admin/register',
    LOGIN: '/admin/login',
    VERIFY_OTP: '/admin/verify-otp',
    VERIFY_LOGIN_OTP: '/admin/verify-login-otp',
    GET_ALL_USERS: '/admin/page',
    DELETE_USER: '/admin/user',
  },
  // Medicine endpoints
  MEDICINES: {
    BASE: '/medicines',
    GET_ALL: '/medicines',
    GET_BY_ID: '/medicines',
    CREATE: '/medicines',
    UPDATE: '/medicines',
    DELETE: '/medicines',
  },
};

/**
 * Get full API URL for an endpoint
 */
export const getApiUrl = (endpoint: string): string => {
  return `${API_BASE_URL}${endpoint}`;
};

