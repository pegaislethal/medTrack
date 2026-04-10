

const LOCAL_API_BASE_URL = "http://localhost:5000/api";
const PROD_API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://medtrack-2t04.onrender.com/api";

// If the frontend is running locally, talk to the local backend.
// On Vercel/production, use the deployed backend.
const isLocalFrontend =
  typeof window !== "undefined" &&
  (window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1");

export const API_BASE_URL = isLocalFrontend
  ? LOCAL_API_BASE_URL
  : PROD_API_BASE_URL;

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
  // Pharmacists endpoints
  PHARMACISTS: {
    BASE: '/pharmacists',
    GET_ALL: '/pharmacists',
    CREATE: '/pharmacists',
    UPDATE: '/pharmacists',
    DELETE: '/pharmacists',
  },
  // Medicine endpoints
  MEDICINES: {
    BASE: '/medicines',
    GET_ALL: '/medicines',
    GET_BY_ID: '/medicines',
    CREATE: '/medicines',
    UPDATE: '/medicines',
    DELETE: '/medicines',
    PURCHASE: '/medicines',
    PURCHASE_ANALYTICS: '/medicines/analytics/purchases',
    PURCHASE_HISTORY: '/medicines/purchases/history',
  },
  PAYMENT: {
    CONFIG: '/payment/config',
    INITIATE: '/payment/initiate',
    CONFIRM: '/payment/confirm',
  },
};

/**
 * Get full API URL for an endpoint
 */
export const getApiUrl = (endpoint: string): string => {
  return `${API_BASE_URL}${endpoint}`;
};

