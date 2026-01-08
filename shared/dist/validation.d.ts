/**
 * Validation Utilities (Shared)
 * Type-safe validation functions for forms and user input
 * Extracted from frontend/src/utils/validation.ts
 */
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
export declare const patterns: {
    email: RegExp;
    url: RegExp;
    strongPassword: RegExp;
    alphanumeric: RegExp;
    numeric: RegExp;
    noSpecialChars: RegExp;
};
/**
 * Check if a string is empty or whitespace only
 */
export declare const isEmpty: (value?: string) => boolean;
/**
 * Check if value meets minimum length requirement
 */
export declare const minLength: (value: string, length: number) => ValidationResult;
/**
 * Check if value is within maximum length
 */
export declare const maxLength: (value: string, length: number) => ValidationResult;
/**
 * Check if value matches a regex pattern
 */
export declare const matchesPattern: (value: string, pattern: RegExp, errorMessage: string) => ValidationResult;
/**
 * Validate an email address
 */
export declare const isValidEmail: (email: string) => ValidationResult;
/**
 * Validate a strong password
 */
export declare const isStrongPassword: (password: string) => ValidationResult;
/**
 * Validate a URL
 */
export declare const isValidUrl: (url: string) => ValidationResult;
/**
 * Ensure two values match (e.g., password confirmation)
 */
export declare const valuesMatch: (value1: string, value2: string, fieldName?: string) => ValidationResult;
/**
 * Validate a number is within range
 */
export declare const isInRange: (value: number, min: number, max: number) => ValidationResult;
/**
 * Compose multiple validators and return the first error
 */
export declare const compose: (...validators: ValidationResult[]) => ValidationResult;
/**
 * Extract all validation errors from an object
 * @param validations Object containing ValidationResults
 * @returns Object with just the error messages
 */
export declare const getValidationErrors: (validations: Record<string, ValidationResult>) => Record<string, string | undefined>;
declare const _default: {
    isEmpty: (value?: string) => boolean;
    minLength: (value: string, length: number) => ValidationResult;
    maxLength: (value: string, length: number) => ValidationResult;
    matchesPattern: (value: string, pattern: RegExp, errorMessage: string) => ValidationResult;
    isValidEmail: (email: string) => ValidationResult;
    isStrongPassword: (password: string) => ValidationResult;
    isValidUrl: (url: string) => ValidationResult;
    valuesMatch: (value1: string, value2: string, fieldName?: string) => ValidationResult;
    isInRange: (value: number, min: number, max: number) => ValidationResult;
    patterns: {
        email: RegExp;
        url: RegExp;
        strongPassword: RegExp;
        alphanumeric: RegExp;
        numeric: RegExp;
        noSpecialChars: RegExp;
    };
    compose: (...validators: ValidationResult[]) => ValidationResult;
    getValidationErrors: (validations: Record<string, ValidationResult>) => Record<string, string | undefined>;
};
export default _default;
//# sourceMappingURL=validation.d.ts.map