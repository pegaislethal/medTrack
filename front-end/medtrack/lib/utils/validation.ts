/**
 * Frontend Validation Utilities
 * Client-side validation to reduce backend load
 */

/**
 * Validate email format
 */
export const validateEmail = (email: string): { valid: boolean; error?: string } => {
  if (!email || email.trim() === '') {
    return { valid: false, error: 'Email is required' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { valid: false, error: 'Please enter a valid email address' };
  }

  return { valid: true };
};

/**
 * Validate password
 */
export const validatePassword = (password: string): { valid: boolean; error?: string } => {
  if (!password || password.trim() === '') {
    return { valid: false, error: 'Password is required' };
  }

  if (password.length < 6) {
    return { valid: false, error: 'Password must be at least 6 characters long' };
  }

  if (password.length > 100) {
    return { valid: false, error: 'Password is too long' };
  }

  return { valid: true };
};

/**
 * Validate OTP
 */
export const validateOTP = (otp: string): { valid: boolean; error?: string } => {
  if (!otp || otp.trim() === '') {
    return { valid: false, error: 'OTP is required' };
  }

  if (otp.length !== 6) {
    return { valid: false, error: 'OTP must be 6 digits' };
  }

  if (!/^\d+$/.test(otp)) {
    return { valid: false, error: 'OTP must contain only numbers' };
  }

  return { valid: true };
};

/**
 * Validate login credentials
 */
export const validateLogin = (
  email: string,
  password: string
): { valid: boolean; error?: string } => {
  const emailValidation = validateEmail(email);
  if (!emailValidation.valid) {
    return emailValidation;
  }

  const passwordValidation = validatePassword(password);
  if (!passwordValidation.valid) {
    return passwordValidation;
  }

  return { valid: true };
};

