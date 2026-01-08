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
 * FormInput Component
 * 
 * Accessible form input with validation and error handling. */
import React, { forwardRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Props for FormInput component
 */
interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Input field label */
  label: string;
  /** Unique identifier for the input */
  id: string;
  /** Input field name attribute */
  name: string;
  /** Error message to display */
  error?: string;
  /** Help text displayed below the input */
  helpText?: string;
  /** Whether the input field is required */
  isRequired?: boolean;
  /** Whether the input is currently being validated */
  isValidating?: boolean;
  /** Whether the field is disabled */
  isDisabled?: boolean;
  /** Whether the field is read-only */
  isReadOnly?: boolean;
  /** Size of the input field */
  inputSize?: 'xs' | 'sm' | 'md' | 'lg';
  /** Whether to allow password visibility toggle (only for password inputs) */
  allowPasswordToggle?: boolean;
}

/**
 * Accessible form input component with validation
 */
const FormInput = forwardRef<HTMLInputElement, FormInputProps>((props, ref) => {
  const {
    label,
    id,
    name,
    error,
    helpText,
    isRequired = false,
    isValidating = false,
    isDisabled = false,
    isReadOnly = false,
    inputSize = 'md',
    type = 'text',
    allowPasswordToggle = true,
    className,
    ...rest
  } = props;

  const [showPassword, setShowPassword] = useState(false);
  const handleTogglePassword = () => setShowPassword(!showPassword);

  const inputType = type === 'password' && showPassword ? 'text' : type;

  const sizeClasses = {
    xs: 'text-xs py-1 px-2',
    sm: 'text-sm py-1.5 px-2.5',
    md: 'text-base py-2 px-3',
    lg: 'text-lg py-2.5 px-4',
  };

  return (
    <div className="mb-4">
      <label 
        htmlFor={id}
        className={cn(
          "block font-medium mb-1",
          inputSize === 'lg' ? 'text-base' : 'text-sm'
        )}
      >
        {label}
        {isRequired && <span className="text-red-500 ml-1">*</span>}
      </label>

      <div className="relative">
        <input
          id={id}
          name={name}
          type={inputType}
          ref={ref}
          disabled={isDisabled}
          readOnly={isReadOnly}
          aria-invalid={!!error}
          aria-describedby={
            error ? `${id}-error` : helpText ? `${id}-helper-text` : undefined
          }
          className={cn(
            "w-full border rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500",
            sizeClasses[inputSize],
            error ? 'border-red-500' : 'border-gray-300',
            isDisabled && 'opacity-50 cursor-not-allowed',
            type === 'password' && allowPasswordToggle && 'pr-10',
            className
          )}
          {...rest}
        />

        {type === 'password' && allowPasswordToggle && (
          <button
            type="button"
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-gray-700"
            onClick={handleTogglePassword}
            tabIndex={-1}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>

      {error ? (
        <p id={`${id}-error`} className="text-red-500 text-sm mt-1">
          {error}
        </p>
      ) : helpText ? (
        <p id={`${id}-helper-text`} className="text-gray-500 text-xs mt-1">
          {helpText}
        </p>
      ) : null}
    </div>
  );
});

FormInput.displayName = 'FormInput';

export default FormInput;
