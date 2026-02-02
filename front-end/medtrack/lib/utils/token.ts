/**
 * Token Management Utilities
 * Handles JWT token storage and retrieval from localStorage
 */

const TOKEN_KEY = 'medtrack_token';
const USER_KEY = 'medtrack_user';
const TOKEN_TIMESTAMP_KEY = 'medtrack_token_timestamp';
const TOKEN_EXPIRATION_TIME =60 * 60 * 1000; //60 minutes in milliseconds


/**
 * Save authentication token to localStorage
 * Also saves the current timestamp for expiration tracking
 */
export const saveToken = (token: string): void => {
  if (typeof window !== 'undefined') {
    console.log("Saving token: ",token)
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(TOKEN_TIMESTAMP_KEY, Date.now().toString());
  }
};

/**
 * Get authentication token from localStorage
 */
export const getToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(TOKEN_KEY);
  }
  return null;
};

/**
 * Remove authentication token from localStorage
 */
export const removeToken = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(TOKEN_TIMESTAMP_KEY);
    
    // Verify token was removed
    const remainingToken = localStorage.getItem(TOKEN_KEY);
    const remainingUser = localStorage.getItem(USER_KEY);
    const remainingTimestamp = localStorage.getItem(TOKEN_TIMESTAMP_KEY);
    if (remainingToken || remainingUser || remainingTimestamp) {
      console.warn('Token or user data may not have been fully removed from localStorage');
      // Force remove again
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem(TOKEN_TIMESTAMP_KEY);
    }
  }
};

/**
 * Save user data to localStorage
 */
export const saveUser = (user: any): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }
};

/**
 * Get user data from localStorage
 */
export const getUser = (): any | null => {
  if (typeof window !== 'undefined') {
    const userStr = localStorage.getItem(USER_KEY);
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch (e) {
        return null;
      }
    }
  }
  return null;
};

/**
 * Check if token has expired (30 minutes)
 */
export const isTokenExpired = (): boolean => {
  if (typeof window === 'undefined') {
    return false;
  }

  const token = getToken();
  if (!token) {
    return true; // No token means expired
  }

  const timestampStr = localStorage.getItem(TOKEN_TIMESTAMP_KEY);
  if (!timestampStr) {
    return true; // No timestamp means expired
  }

  try {
    const timestamp = parseInt(timestampStr, 10);
    const currentTime = Date.now();
    const elapsedTime = currentTime - timestamp;
    
    return elapsedTime >= TOKEN_EXPIRATION_TIME;
  } catch (e) {
    return true; // Invalid timestamp means expired
  }
};

/**
 * Check and clear expired token
 */
export const checkAndClearExpiredToken = (): boolean => {
  if (isTokenExpired()) {
    removeToken();
    return true; // Token was expired and cleared
  }
  return false; // Token is still valid
};

/**
 * Check if user is authenticated
 * Also checks if token has expired
 */
export const isAuthenticated = (): boolean => {
  if (typeof window === 'undefined') {
    return false;
  }

  const token = getToken();
  if (!token) {
    return false;
  }

  // Check if token has expired
  if (isTokenExpired()) {
    removeToken();
    return false;
  }

  return true;
};

/**
 * Get authorization header for API requests
 */
export const getAuthHeader = (): { Authorization: string } | {} => {
  const token = getToken();
  if (token) {
    return { Authorization: `Bearer ${token}` };
  }
  return {};
};

