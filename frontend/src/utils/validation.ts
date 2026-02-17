// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Password validation: at least 8 characters
const PASSWORD_REGEX = /^.{8,}$/;

export const Validation = {
  /**
   * Validate email format
   */
  isValidEmail: (email: string): boolean => {
    return EMAIL_REGEX.test(email.trim());
  },

  /**
   * Validate password (minimum 8 characters)
   */
  isValidPassword: (password: string): boolean => {
    return PASSWORD_REGEX.test(password);
  },

  /**
   * Validate that two passwords match
   */
  passwordsMatch: (password: string, confirmPassword: string): boolean => {
    return password === confirmPassword;
  },

  /**
   * Validate that a field is not empty
   */
  isNotEmpty: (value: string): boolean => {
    return value.trim().length > 0;
  },

  /**
   * Validate minimum length
   */
  minLength: (value: string, length: number): boolean => {
    return value.trim().length >= length;
  },

  /**
   * Validate maximum length
   */
  maxLength: (value: string, length: number): boolean => {
    return value.trim().length <= length;
  },

  /**
   * Validate that value is a number
   */
  isNumber: (value: string): boolean => {
    return !isNaN(parseFloat(value)) && isFinite(Number(value));
  },

  /**
   * Validate numeric range
   */
  inRange: (value: number, min: number, max: number): boolean => {
    return value >= min && value <= max;
  },

  /**
   * Validate phone number (basic)
   */
  isValidPhone: (phone: string): boolean => {
    return /^\+?[\d\s\-()]{10,}$/.test(phone);
  },
};

/**
 * Error messages for display
 */
export const ErrorMessages = {
  EMAIL_REQUIRED: 'Email is required',
  EMAIL_INVALID: 'Please enter a valid email',
  PASSWORD_REQUIRED: 'Password is required',
  PASSWORD_TOO_SHORT: 'Password must be at least 8 characters',
  PASSWORD_MISMATCH: 'Passwords do not match',
  CONFIRM_PASSWORD_REQUIRED: 'Please confirm your password',
  FIRST_NAME_REQUIRED: 'First name is required',
  LAST_NAME_REQUIRED: 'Last name is required',
  PHONE_INVALID: 'Please enter a valid phone number',
  FIELD_REQUIRED: 'This field is required',
};
