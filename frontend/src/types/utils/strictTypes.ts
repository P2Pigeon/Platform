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
 * @file Strict type utilities
 * @description Utility types for strict null safety and type checking. */

/**
 * NonNullable type that explicitly removes null and undefined
 * @template T - The input type
 */
export type Required<T> = {
  [P in keyof T]-?: NonNullable<T[P]>;
};

/**
 * Makes specific properties of an object required and non-nullable
 * @template T - The object type
 * @template K - Keys to make required
 */
export type RequiredProps<T, K extends keyof T> = T & {
  [P in K]-?: NonNullable<T[P]>;
};

/**
 * Ensures all nested properties are non-nullable
 * @template T - The object type
 */
export type DeepRequired<T> = {
  [P in keyof T]-?: T[P] extends object ? DeepRequired<T[P]> : NonNullable<T[P]>;
};

/**
 * Assertion function to verify non-null values
 * @param value - The value to check
 * @param message - Optional error message
 */
export function assertNonNull<T>(
  value: T,
  message: string = 'Value must not be null or undefined'
): asserts value is NonNullable<T> {
  if (value === null || value === undefined) {
    throw new Error(message);
  }
}

/**
 * Type guard to check if value is defined (not null or undefined)
 * @param value - The value to check
 */
export function isDefined<T>(value: T): value is NonNullable<T> {
  return value !== null && value !== undefined;
}

/**
 * Type safe null coalescing that handles potential null values
 * @param value - The potentially null value
 * @param defaultValue - The fallback value
 */
export function nullCoalesce<T, D>(value: T | null | undefined, defaultValue: D): T | D {
  return (value !== null && value !== undefined) ? value : defaultValue;
}

/**
 * Type for values that are explicitly allowed to be null
 * (makes the null case explicit in the code)
 * @template T - The base type
 */
export type Nullable<T> = T | null;

/**
 * Type for values that are explicitly allowed to be undefined
 * (makes the undefined case explicit in the code)
 * @template T - The base type
 */
export type Optional<T> = T | undefined;

/**
 * Type assertion for records with specific value types
 * @template K - The key type
 * @template V - The value type
 */
export type StrictRecord<K extends string | number | symbol, V> = {
  [P in K]: V;
};

/**
 * Ensures all properties of an object match the given type
 * @template V - The value type
 */
export type StrictObject<V> = Record<string, V>;

/**
 * Ensures the object has only the specified keys
 * @template T - The object type
 * @template K - The allowed keys
 */
export type StrictKeys<T, K extends keyof T> = {
  [P in K]: T[P];
} & {
  [P in Exclude<keyof T, K>]?: never;
};
