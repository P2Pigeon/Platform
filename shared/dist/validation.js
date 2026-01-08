"use strict";
/**
 * Validation Utilities (Shared)
 * Type-safe validation functions for forms and user input
 * Extracted from frontend/src/utils/validation.ts
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getValidationErrors = exports.compose = exports.isInRange = exports.valuesMatch = exports.isValidUrl = exports.isStrongPassword = exports.isValidEmail = exports.matchesPattern = exports.maxLength = exports.minLength = exports.isEmpty = exports.patterns = void 0;
/**
 * Common validation patterns
 */
exports.patterns = {
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
const isEmpty = (value) => {
    return value === undefined || value === null || value.trim() === '';
};
exports.isEmpty = isEmpty;
/**
 * Check if value meets minimum length requirement
 */
const minLength = (value, length) => {
    return {
        isValid: value.length >= length,
        errorMessage: value.length >= length ? undefined : `Must be at least ${length} characters`
    };
};
exports.minLength = minLength;
/**
 * Check if value is within maximum length
 */
const maxLength = (value, length) => {
    return {
        isValid: value.length <= length,
        errorMessage: value.length <= length ? undefined : `Cannot exceed ${length} characters`
    };
};
exports.maxLength = maxLength;
/**
 * Check if value matches a regex pattern
 */
const matchesPattern = (value, pattern, errorMessage) => {
    return {
        isValid: pattern.test(value),
        errorMessage: pattern.test(value) ? undefined : errorMessage
    };
};
exports.matchesPattern = matchesPattern;
/**
 * Validate an email address
 */
const isValidEmail = (email) => {
    return (0, exports.matchesPattern)(email, exports.patterns.email, 'Please enter a valid email address');
};
exports.isValidEmail = isValidEmail;
/**
 * Validate a strong password
 */
const isStrongPassword = (password) => {
    return (0, exports.matchesPattern)(password, exports.patterns.strongPassword, 'Password must be at least 8 characters, include uppercase, lowercase and a number');
};
exports.isStrongPassword = isStrongPassword;
/**
 * Validate a URL
 */
const isValidUrl = (url) => {
    return (0, exports.matchesPattern)(url, exports.patterns.url, 'Please enter a valid URL');
};
exports.isValidUrl = isValidUrl;
/**
 * Ensure two values match (e.g., password confirmation)
 */
const valuesMatch = (value1, value2, fieldName = 'Values') => {
    return {
        isValid: value1 === value2,
        errorMessage: value1 === value2 ? undefined : `${fieldName} do not match`
    };
};
exports.valuesMatch = valuesMatch;
/**
 * Validate a number is within range
 */
const isInRange = (value, min, max) => {
    return {
        isValid: value >= min && value <= max,
        errorMessage: value >= min && value <= max ? undefined : `Must be between ${min} and ${max}`
    };
};
exports.isInRange = isInRange;
/**
 * Compose multiple validators and return the first error
 */
const compose = (...validators) => {
    for (const v of validators) {
        if (!v.isValid)
            return v;
    }
    return { isValid: true };
};
exports.compose = compose;
/**
 * Extract all validation errors from an object
 * @param validations Object containing ValidationResults
 * @returns Object with just the error messages
 */
const getValidationErrors = (validations) => {
    const errors = {};
    Object.keys(validations).forEach(key => {
        const validation = validations[key];
        if (!validation.isValid && validation.errorMessage) {
            errors[key] = validation.errorMessage;
        }
    });
    return errors;
};
exports.getValidationErrors = getValidationErrors;
exports.default = {
    isEmpty: exports.isEmpty,
    minLength: exports.minLength,
    maxLength: exports.maxLength,
    matchesPattern: exports.matchesPattern,
    isValidEmail: exports.isValidEmail,
    isStrongPassword: exports.isStrongPassword,
    isValidUrl: exports.isValidUrl,
    valuesMatch: exports.valuesMatch,
    isInRange: exports.isInRange,
    patterns: exports.patterns,
    compose: exports.compose,
    getValidationErrors: exports.getValidationErrors,
};
