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
 * Accessibility Utilities
 * 
 * Helper functions to improve accessibility compliance (WCAG AA)/

/**
 * Keyboard event names and codes
 */
export enum KeyboardKey {
  ENTER = 'Enter',
  SPACE = ' ',
  ESCAPE = 'Escape',
  TAB = 'Tab',
  ARROW_UP = 'ArrowUp',
  ARROW_DOWN = 'ArrowDown',
  ARROW_LEFT = 'ArrowLeft',
  ARROW_RIGHT = 'ArrowRight',
  HOME = 'Home',
  END = 'End'
}

/**
 * Interface for accessible element attributes
 */
export interface AccessibleProps extends React.HTMLAttributes<HTMLElement> {
  role?: string;
  tabIndex?: number;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  'aria-hidden'?: boolean;
  'aria-expanded'?: boolean;
  'aria-haspopup'?: boolean | 'dialog' | 'menu' | 'listbox' | 'tree' | 'grid';
  'aria-controls'?: string;
  'aria-selected'?: boolean;
  'aria-current'?: boolean | 'page' | 'step' | 'location' | 'date' | 'time';
  'aria-live'?: 'off' | 'polite' | 'assertive';
  'aria-atomic'?: boolean;
  onKeyDown?: (event: React.KeyboardEvent) => void;
}

/**
 * Creates props for keyboard-navigable element (button-like behavior)
 * @param onClick Click handler function
 */
export const makeKeyboardNavigable = (onClick: () => void): AccessibleProps => {
  return {
    role: 'button',
    tabIndex: 0,
    onKeyDown: (event: React.KeyboardEvent): void => {
      if (event.key === KeyboardKey.ENTER || event.key === KeyboardKey.SPACE) {
        event.preventDefault();
        onClick();
      }
    }
  };
};

/**
 * Calculate color contrast ratio between two colors
 * @param color1 First color in hex format (e.g. #FFFFFF)
 * @param color2 Second color in hex format (e.g. #000000)
 * @returns Contrast ratio (WCAG requires minimum 4.5:1 for normal text, 3:1 for large text)
 */
export const getContrastRatio = (color1: string, color2: string): number => {
  // Convert hex to RGB
  const hexToRgb = (hex: string): [number, number, number] => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? [
          parseInt(result[1], 16),
          parseInt(result[2], 16),
          parseInt(result[3], 16)
        ]
      : [0, 0, 0];
  };

  // Calculate relative luminance
  const calculateLuminance = (r: number, g: number, b: number): number => {
    const a = [r, g, b].map((v) => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
  };

  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  
  const lum1 = calculateLuminance(rgb1[0], rgb1[1], rgb1[2]);
  const lum2 = calculateLuminance(rgb2[0], rgb2[1], rgb2[2]);
  
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  
  return (brightest + 0.05) / (darkest + 0.05);
};

/**
 * Check if contrast meets WCAG AA standards
 * @param ratio Contrast ratio
 * @param isLargeText Whether the text is large (18pt+ or 14pt+ bold)
 */
export const meetsWCAGAA = (ratio: number, isLargeText = false): boolean => {
  return isLargeText ? ratio >= 3 : ratio >= 4.5;
};

/**
 * Creates focus trap props for modals and dialogs
 * @param isOpen Whether the modal/dialog is open
 * @param onClose Close handler function
 */
export const createFocusTrap = (isOpen: boolean, onClose: () => void): AccessibleProps => {
  return {
    onKeyDown: (event: React.KeyboardEvent): void => {
      if (isOpen && event.key === KeyboardKey.ESCAPE) {
        event.preventDefault();
        onClose();
      }
    }
  };
};

export default {
  KeyboardKey,
  makeKeyboardNavigable,
  getContrastRatio,
  meetsWCAGAA,
  createFocusTrap
};
