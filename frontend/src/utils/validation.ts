/**
 * P2Pigeon - Secure P2P Communication Platform
 * 
 * @license AGPL-3.0 - https://opensource.org/licenses/AGPL-3.0
 * @copyright 2024-2026 P2Pigeon Contributors
 * @see https://github.com/p2pigeon/platform
 * 
 * Last updated: 2026-01-07
 */

/**
 * Validation Utilities
 * 
 * Type-safe validation functions for forms and user input. */

/**
 * Type for validation result
 */
export interface ValidationResult {
  isValid: boolean;
  errorMessage?: string;
}

/**
 * Common validation patterns
 */
export const patterns = {
  email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  url: /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w.-]*)*\/?$/,
  // Min 8 chars, 1 uppercase, 1 lowercase, 1 number
  strongPassword: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/,
  alphanumeric: /^[a-zA-Z0-9]+$/,
  numeric: /^[0-9]+$/,
  noSpecialChars: /^[a-zA-Z0-9\s]+$/
};

/**
 * Check if a string is empty or whitespace only
 */
export const isEmpty = (value?: string): boolean => {
  return value === undefined || value === null || value.trim() === '';
};

/**
 * Check if value meets minimum length requirement
 */
export const minLength = (value: string, length: number): ValidationResult => {
  return {
    isValid: value.length >= length,
    errorMessage: value.length >= length ? undefined : `Must be at least ${length} characters`
  };
};

/**
 * Check if value is within maximum length
 */
export const maxLength = (value: string, length: number): ValidationResult => {
  return {
    isValid: value.length <= length,
    errorMessage: value.length <= length ? undefined : `Cannot exceed ${length} characters`
  };
};

/**
 * Check if value matches a regex pattern
 */
export const matchesPattern = (value: string, pattern: RegExp, errorMessage: string): ValidationResult => {
  return {
    isValid: pattern.test(value),
    errorMessage: pattern.test(value) ? undefined : errorMessage
  };
};

/**
 * Validate an email address
 */
export const isValidEmail = (email: string): ValidationResult => {
  return matchesPattern(
    email,
    patterns.email,
    'Please enter a valid email address'
  );
};

/**
 * Validate a strong password
 */
export const isStrongPassword = (password: string): ValidationResult => {
  return matchesPattern(
    password,
    patterns.strongPassword,
    'Password must be at least 8 characters with uppercase, lowercase, and number'
  );
};

/**
 * Validate a URL
 */
export const isValidUrl = (url: string): ValidationResult => {
  return matchesPattern(
    url,
    patterns.url,
    'Please enter a valid URL'
  );
};

/**
 * Ensure two values match (e.g., password confirmation)
 */
export const valuesMatch = (value1: string, value2: string, fieldName = 'Values'): ValidationResult => {
  return {
    isValid: value1 === value2,
    errorMessage: value1 === value2 ? undefined : `${fieldName} must match`
  };
};

/**
 * Validate a number is within range
 */
export const isInRange = (value: number, min: number, max: number): ValidationResult => {
  return {
    isValid: value >= min && value <= max,
    errorMessage: value >= min && value <= max ? undefined : `Must be between ${min} and ${max}`
  };
};

/**
 * Compose multiple validators and return the first error
 */
export const compose = (...validators: ValidationResult[]): ValidationResult => {
  for (const result of validators) {
    if (!result.isValid) {
      return result;
    }
  }
  
  return { isValid: true };
};

/**
 * Extract all validation errors from an object
 * @param validations Object containing ValidationResults
 * @returns Object with just the error messages
 */
export const getValidationErrors = (validations: Record<string, ValidationResult>): Record<string, string | undefined> => {
  const errors: Record<string, string | undefined> = {};
  
  Object.keys(validations).forEach(key => {
    const validation = validations[key];
    if (!validation.isValid && validation.errorMessage) {
      errors[key] = validation.errorMessage;
    }
  });
  
  return errors;
};

export default {
  isEmpty,
  minLength,
  maxLength,
  matchesPattern,
  isValidEmail,
  isStrongPassword,
  isValidUrl,
  valuesMatch,
  isInRange,
  patterns,
  compose,
  getValidationErrors,
};
