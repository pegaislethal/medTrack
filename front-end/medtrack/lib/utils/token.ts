/**
 * Token Management Utilities
 * Handles JWT token storage and retrieval from localStorage
 */

const TOKEN_KEY = 'medtrack_token';
const USER_KEY = 'medtrack_user';


/**
 * Save authentication token to localStorage
 */
export const saveToken = (token: string): void => {
  if (typeof window !== 'undefined') {
    console.log("Saving token: ",token)
    localStorage.setItem(TOKEN_KEY, token);
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
    
    // Verify token was removed
    const remainingToken = localStorage.getItem(TOKEN_KEY);
    const remainingUser = localStorage.getItem(USER_KEY);
    if (remainingToken || remainingUser) {
      console.warn('Token or user data may not have been fully removed from localStorage');
      // Force remove again
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
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
 * Check if user is authenticated
 */
export const isAuthenticated = (): boolean => {
  return getToken() !== null;
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

