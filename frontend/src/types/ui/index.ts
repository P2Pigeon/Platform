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
 * @file UI component type definitions
 * @description Type definitions for UI components and theme. */

import React from 'react';

/**
 * Base component props with common accessibility attributes
 */
export interface BaseComponentProps {
  /** Unique identifier for the component */
  id?: string;
  /** ARIA label for accessibility */
  'aria-label'?: string;
  /** Whether the component is disabled */
  disabled?: boolean;
  /** Whether the component should receive focus when mounted */
  autoFocus?: boolean;
  /** Data attributes for testing */
  'data-testid'?: string;
}

/**
 * Props for layout components with responsive sizes
 */
export interface ResponsiveLayoutProps {
  /** Responsive boolean for different breakpoints */
  isFullWidth?: boolean | Record<string, boolean>;
  /** Maximum width at different breakpoints */
  maxContentWidth?: string | Record<string, string>;
  /** Padding configuration for different breakpoints */
  contentPadding?: string | Record<string, string>;
  /** React children */
  children?: React.ReactNode;
}

/**
 * Card component props with hover states
 */
export interface CardProps {
  /** Whether to show hover effects */
  isInteractive?: boolean;
  /** Whether to show a border */
  hasBorder?: boolean;
  /** Whether the card is selected */
  isSelected?: boolean;
  /** Whether to show shadow */
  hasShadow?: boolean;
  /** Card corner radius */
  borderRadius?: string;
  /** React children */
  children?: React.ReactNode;
}

/**
 * Button sizes with semantic naming
 */
export enum ButtonSize {
  XSMALL = 'xs',
  SMALL = 'sm',
  MEDIUM = 'md',
  LARGE = 'lg',
  XLARGE = 'xl'
}

/**
 * Button variants extending Chakra's variants
 */
export enum ButtonVariant {
  SOLID = 'solid',
  OUTLINE = 'outline',
  GHOST = 'ghost',
  LINK = 'link',
  /** Additional custom variants */
  BRAND = 'brand',
  DANGER = 'danger',
  SUCCESS = 'success'
}

/**
 * Enhanced button props with security indicators
 */
export interface EnhancedButtonProps extends BaseComponentProps {
  /** Shows a security icon for sensitive operations */
  isSecureAction?: boolean;
  /** Whether to show confirmation for destructive actions */
  requireConfirmation?: boolean;
  /** Confirmation message for sensitive actions */
  confirmationMessage?: string;
  /** Adds a loading indicator with accessible text */
  isLoading?: boolean;
  /** Loading text for screen readers */
  loadingText?: string;
  /** React children */
  children?: React.ReactNode;
  /** Click event handler */
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

/**
 * Navigation item type with permissions
 */
export interface NavigationItem {
  /** Unique identifier */
  id: string;
  /** Display label */
  label: string;
  /** Navigation path */
  path: string;
  /** Icon component name */
  icon?: string;
  /** Whether item is external link */
  isExternal?: boolean;
  /** Required permissions to see this item */
  requiredPermissions?: string[];
  /** Whether item is active */
  isActive?: boolean;
  /** Child navigation items */
  children?: NavigationItem[];
}

/**
 * Modal types with strict controls
 */
export interface ModalConfig {
  /** Modal title */
  title: string;
  /** Whether modal is currently open */
  isOpen: boolean;
  /** Close handler */
  onClose: () => void;
  /** Whether to show close button */
  hasCloseButton?: boolean;
  /** Whether modal can be closed by clicking overlay */
  closeOnOverlayClick?: boolean;
  /** Whether to trap focus inside modal */
  trapFocus?: boolean;
  /** Return focus to element that triggered modal */
  returnFocusOnClose?: boolean;
  /** Modal size */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

/**
 * Theme customization interface
 */
export interface ThemeCustomization {
  /** Whether dark mode is enabled */
  isDarkMode: boolean;
  /** Primary color */
  primaryColor: string;
  /** Secondary color */
  secondaryColor: string;
  /** Brand colors */
  brandColors: {
    [key: string]: string;
  };
  /** Font settings */
  font: {
    family: string;
    headingFamily?: string;
    baseSize: string;
    lineHeight: number;
  };
  /** Spacing scale */
  spacing: {
    [key: string]: string;
  };
  /** Border radius scale */
  borderRadius: {
    [key: string]: string;
  };
  /** Animation timing */
  animation: {
    duration: {
      fast: string;
      normal: string;
      slow: string;
    };
    easing: {
      easeIn: string;
      easeOut: string;
      easeInOut: string;
    };
  };
}
