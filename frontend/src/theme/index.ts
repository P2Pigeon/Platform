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
 * NSA-Grade Hacker Spy Aesthetic Theme
 * 
 * Tailwind-compatible theme constants for ultra-dark theme with neon cyan accents,
 * zero border radius, and consistent dark backgrounds throughout the application.
 */

// Theme configuration
export const themeConfig = {
  colorMode: 'dark',
  useSystemColorMode: false,
};

// NSA-Grade Color Palette
const colors = {
  // Primary neon cyan brand colors
  brand: {
    50: '#001a1a',   // Ultra dark cyan
    100: '#002626',  // Very dark cyan
    200: '#003333',  // Dark cyan
    300: '#004d4d',  // Medium dark cyan
    400: '#006666',  // Medium cyan
    500: '#00ccff',  // Primary neon cyan
    600: '#00ddff',  // Bright neon cyan
    700: '#00eeff',  // Very bright cyan
    800: '#00ffff',  // Pure cyan
    900: '#33ffff',  // Light cyan glow
  },
  // Ultra-dark grays for backgrounds
  gray: {
    50: '#000000',   // Pure black
    100: '#0a0a0a',  // Almost black
    200: '#111111',  // Very dark
    300: '#1a1a1a',  // Dark
    400: '#2d2d2d',  // Medium dark
    500: '#404040',  // Medium
    600: '#555555',  // Medium light
    700: '#666666',  // Light
    800: '#0a0a0a',  // Background dark
    900: '#000000',  // Ultra dark background
    950: '#000000',  // Pure black background
  },
  // Error states in red
  error: {
    50: '#1a0000',
    100: '#330000',
    200: '#660000',
    300: '#ff3333',  // Bright red
    400: '#ff1a1a',  // Very bright red
    500: '#ff0000',  // Pure red
    600: '#e60000',  // Dark red
    700: '#cc0000',  // Darker red
    800: '#b30000',  // Very dark red
    900: '#990000',  // Ultra dark red
  },
  // Success states in neon green
  success: {
    50: '#001a00',
    100: '#003300',
    200: '#006600',
    300: '#00ff00',  // Neon green
    400: '#33ff33',  // Bright green
    500: '#00cc00',  // Primary green
    600: '#00b300',  // Dark green
    700: '#009900',  // Darker green
    800: '#008000',  // Very dark green
    900: '#006600',  // Ultra dark green
  },
  // Warning states in neon orange
  warning: {
    50: '#1a0d00',
    100: '#331a00',
    200: '#663300',
    300: '#ff6600',  // Neon orange
    400: '#ff8000',  // Bright orange
    500: '#ff9900',  // Primary orange
    600: '#e68a00',  // Dark orange
    700: '#cc7a00',  // Darker orange
    800: '#b36b00',  // Very dark orange
    900: '#995c00',  // Ultra dark orange
  },
  // Info states use brand cyan
  info: {
    50: '#001a1a',
    100: '#002626',
    200: '#003333',
    300: '#00ccff',  // Neon cyan
    400: '#00ddff',  // Bright cyan
    500: '#00eeff',  // Primary cyan
    600: '#00d4e6',  // Dark cyan
    700: '#00bfcc',  // Darker cyan
    800: '#00aab3',  // Very dark cyan
    900: '#009499',  // Ultra dark cyan
  },
};

// Typography
const typography = {
  fonts: {
    heading: '"Inter", sans-serif',
    body: '"Inter", sans-serif',
    mono: '"Source Code Pro", monospace',
  },
  fontSizes: {
    xs: '0.75rem',
    sm: '0.875rem',
    md: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
    '4xl': '2.25rem',
    '5xl': '3rem',
    '6xl': '4rem',
  },
  fontWeights: {
    hairline: 100,
    thin: 200,
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
    black: 900,
  },
  lineHeights: {
    normal: 'normal',
    none: 1,
    shorter: 1.25,
    short: 1.375,
    base: 1.5,
    tall: 1.625,
    taller: 2,
  },
  letterSpacings: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  },
};

// NSA-Grade Component Overrides - Zero radius, dark backgrounds, neon accents
const components = {
  Button: {
    baseStyle: {
      fontWeight: 'bold',
      borderRadius: '0',
      border: '1px solid',
      fontFamily: 'mono',
      textTransform: 'uppercase',
      letterSpacing: 'wider',
    },
    variants: {
      solid: () => ({
        bg: 'gray.800',
        color: 'brand.500',
        borderColor: 'brand.500',
        boxShadow: '0 0 10px rgba(0, 204, 255, 0.3)',
        _hover: {
          bg: 'brand.500',
          color: 'gray.900',
          boxShadow: '0 0 20px rgba(0, 204, 255, 0.6)',
          transform: 'translateY(-1px)',
        },
        _active: {
          transform: 'translateY(0)',
        },
      }),
      outline: () => ({
        bg: 'transparent',
        color: 'brand.500',
        borderColor: 'brand.500',
        _hover: {
          bg: 'brand.500',
          color: 'gray.900',
          boxShadow: '0 0 15px rgba(0, 204, 255, 0.5)',
        },
      }),
      ghost: () => ({
        bg: 'transparent',
        color: 'brand.500',
        border: 'none',
        _hover: {
          bg: 'gray.800',
          color: 'brand.600',
        },
      }),
    },
    defaultProps: {
      variant: 'solid',
    },
  },
  Modal: {
    baseStyle: {
      overlay: {
        bg: 'rgba(0, 0, 0, 0.9)',
        backdropFilter: 'blur(8px)',
      },
      dialog: {
        bg: 'gray.900',
        color: 'brand.500',
        borderRadius: '0',
        border: '2px solid',
        borderColor: 'brand.500',
        boxShadow: '0 0 30px rgba(0, 204, 255, 0.4)',
      },
      header: {
        bg: 'gray.800',
        borderBottom: '1px solid',
        borderColor: 'brand.500',
      },
      body: {
        bg: 'gray.900',
      },
      footer: {
        bg: 'gray.800',
        borderTop: '1px solid',
        borderColor: 'brand.500',
      },
    },
  },
  Card: {
    baseStyle: {
      container: {
        bg: 'gray.800',
        color: 'brand.500',
        borderRadius: '0',
        border: '1px solid',
        borderColor: 'gray.700',
        boxShadow: '0 0 15px rgba(0, 0, 0, 0.5)',
        _hover: {
          borderColor: 'brand.500',
          boxShadow: '0 0 20px rgba(0, 204, 255, 0.2)',
        },
      },
    },
  },
  Input: {
    baseStyle: {
      field: {
        bg: 'gray.800',
        color: 'brand.500',
        borderRadius: '0',
        border: '1px solid',
        borderColor: 'gray.700',
        _focus: {
          borderColor: 'brand.500',
          boxShadow: '0 0 10px rgba(0, 204, 255, 0.3)',
        },
        _placeholder: {
          color: 'gray.500',
        },
      },
    },
  },
  Textarea: {
    baseStyle: {
      bg: 'gray.800',
      color: 'brand.500',
      borderRadius: '0',
      border: '1px solid',
      borderColor: 'gray.700',
      _focus: {
        borderColor: 'brand.500',
        boxShadow: '0 0 10px rgba(0, 204, 255, 0.3)',
      },
    },
  },
  Select: {
    baseStyle: {
      field: {
        bg: 'gray.800',
        color: 'brand.500',
        borderRadius: '0',
        border: '1px solid',
        borderColor: 'gray.700',
        _focus: {
          borderColor: 'brand.500',
          boxShadow: '0 0 10px rgba(0, 204, 255, 0.3)',
        },
      },
    },
  },
  Tabs: {
    baseStyle: {
      tab: {
        fontWeight: 'bold',
        fontFamily: 'mono',
        textTransform: 'uppercase',
        borderRadius: '0',
        color: 'gray.500',
        _selected: {
          color: 'brand.500',
          borderColor: 'brand.500',
          borderBottomColor: 'brand.500',
        },
        _hover: {
          color: 'brand.600',
        },
      },
      tabpanel: {
        bg: 'gray.900',
        color: 'brand.500',
      },
    },
  },
  Tooltip: {
    baseStyle: {
      bg: 'gray.800',
      color: 'brand.500',
      borderRadius: '0',
      border: '1px solid',
      borderColor: 'brand.500',
      px: '3',
      py: '2',
      fontSize: 'sm',
      fontWeight: 'bold',
      fontFamily: 'mono',
      boxShadow: '0 0 10px rgba(0, 204, 255, 0.3)',
    },
  },
  Menu: {
    baseStyle: {
      list: {
        bg: 'gray.800',
        borderRadius: '0',
        border: '1px solid',
        borderColor: 'brand.500',
        boxShadow: '0 0 20px rgba(0, 204, 255, 0.3)',
      },
      item: {
        bg: 'transparent',
        color: 'brand.500',
        _hover: {
          bg: 'gray.700',
          color: 'brand.600',
        },
        _focus: {
          bg: 'gray.700',
          color: 'brand.600',
        },
      },
    },
  },
  Drawer: {
    baseStyle: {
      overlay: {
        bg: 'rgba(0, 0, 0, 0.9)',
      },
      dialog: {
        bg: 'gray.900',
        color: 'brand.500',
        borderRadius: '0',
      },
      header: {
        bg: 'gray.800',
        borderBottom: '1px solid',
        borderColor: 'brand.500',
      },
      body: {
        bg: 'gray.900',
      },
    },
  },
};

// Spacing and sizing
const space = {
  px: '1px',
  0.5: '0.125rem',
  1: '0.25rem',
  1.5: '0.375rem',
  2: '0.5rem',
  2.5: '0.625rem',
  3: '0.75rem',
  3.5: '0.875rem',
  4: '1rem',
  5: '1.25rem',
  6: '1.5rem',
  7: '1.75rem',
  8: '2rem',
  9: '2.25rem',
  10: '2.5rem',
  12: '3rem',
  14: '3.5rem',
  16: '4rem',
  20: '5rem',
  24: '6rem',
  28: '7rem',
  32: '8rem',
  36: '9rem',
  40: '10rem',
  44: '11rem',
  48: '12rem',
  52: '13rem',
  56: '14rem',
  60: '15rem',
  64: '16rem',
  72: '18rem',
  80: '20rem',
  96: '24rem',
};

// NSA-Grade Global Styles - AGGRESSIVELY ELIMINATE ALL WHITE BACKGROUNDS
const styles = {
  global: () => ({
    // Force ultra-dark body background
    html: {
      bg: 'gray.900 !important',
      color: 'brand.500 !important',
    },
    body: {
      bg: 'gray.900 !important',
      color: 'brand.500 !important',
      fontFamily: 'mono',
    },
    // AGGRESSIVELY force all elements to be dark with neon text
    '*': {
      borderRadius: '0 !important',
      borderColor: 'gray.700 !important',
      // KILL ALL WHITE BACKGROUNDS
      '&[style*="background-color: white"]': {
        backgroundColor: 'gray.900 !important',
      },
      '&[style*="background: white"]': {
        backgroundColor: 'gray.900 !important',
      },
      '&[style*="bg-white"]': {
        backgroundColor: 'gray.900 !important',
      },
    },
    // Force all divs, sections, main elements to be dark
    'div, section, main, article, aside, nav, header, footer': {
      backgroundColor: 'gray.900 !important',
      color: 'brand.500 !important',
    },
    // Force all text elements to be neon
    'p, span, h1, h2, h3, h4, h5, h6, a, label, button': {
      color: 'brand.500 !important',
      fontFamily: 'mono !important',
      textTransform: 'uppercase !important',
      letterSpacing: 'wider !important',
    },
    // Force all inputs and form elements to be dark
    'input, textarea, select, option': {
      backgroundColor: 'gray.800 !important',
      color: 'brand.500 !important',
      borderColor: 'brand.500 !important',
      borderRadius: '0 !important',
    },
    // Force all cards and containers to be dark
    '[class*="card"], [class*="container"], [class*="box"]': {
      backgroundColor: 'gray.900 !important',
      color: 'brand.500 !important',
    },
    // Placeholder text styling
    '*::placeholder': {
      color: 'gray.500 !important',
    },
    // Selection styling
    '*::selection': {
      bg: 'brand.500 !important',
      color: 'gray.900 !important',
    },
    // Scrollbar styling for webkit browsers
    '*::-webkit-scrollbar': {
      width: '8px',
    },
    '*::-webkit-scrollbar-track': {
      bg: 'gray.800',
    },
    '*::-webkit-scrollbar-thumb': {
      bg: 'brand.500',
      borderRadius: '0',
    },
    '*::-webkit-scrollbar-thumb:hover': {
      bg: 'brand.600',
    },
  }),
};

// Animation
const transition = {
  property: {
    common: 'background-color, border-color, color, fill, stroke, opacity, box-shadow, transform',
    colors: 'background-color, border-color, color, fill, stroke',
    dimensions: 'width, height',
    position: 'left, right, top, bottom',
    background: 'background-color, background-image, background-position',
  },
  easing: {
    'ease-in': 'cubic-bezier(0.4, 0, 1, 1)',
    'ease-out': 'cubic-bezier(0, 0, 0.2, 1)',
    'ease-in-out': 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
  duration: {
    'ultra-fast': '50ms',
    faster: '100ms',
    fast: '150ms',
    normal: '200ms',
    slow: '300ms',
    slower: '400ms',
    'ultra-slow': '500ms',
  },
};

// NSA-Grade Border Radius - Zero radius for sharp edges
const radii = {
  none: '0',
  sm: '0',
  base: '0',
  md: '0',
  lg: '0',
  xl: '0',
  '2xl': '0',
  '3xl': '0',
  full: '0',  // Even "full" radius is zero for sharp aesthetic
};

// Z-index
const zIndices = {
  hide: -1,
  auto: 'auto',
  base: 0,
  docked: 10,
  dropdown: 1000,
  sticky: 1100,
  banner: 1200,
  overlay: 1300,
  modal: 1400,
  popover: 1500,
  skipLink: 1600,
  toast: 1700,
  tooltip: 1800,
};

// Shadows
const shadows = {
  xs: '0 0 0 1px rgba(0, 0, 0, 0.05)',
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  outline: '0 0 0 3px rgba(9, 103, 210, 0.6)',
  inner: 'inset 0 2px 4px 0 rgba(0,0,0,0.06)',
  none: 'none',
  'dark-lg': '0 0 0 1px rgba(0, 0, 0, 0.1), 0 4px 20px 0 rgba(0, 0, 0, 0.1)',
};

// Export theme constants for use with Tailwind
export const theme = {
  colors,
  ...typography,
  space,
  transition,
  radii,
  zIndices,
  shadows,
};

export default theme;
