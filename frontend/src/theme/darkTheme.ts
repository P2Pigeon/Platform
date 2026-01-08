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
 * @file darkTheme.ts
 * @description Elite Hacker Aesthetic Dark Theme with Sharp Styling
 * Following the P2Pigeon vision for secure, professional communications
 * Tailwind-compatible constants 
 */

// Elite Hacker Tool Theme - Dark, Sharp, Hollow Buttons
export const darkThemeConfig = {
  colorMode: 'dark',
  useSystemColorMode: false,
};

export const darkTheme = {
  colors: {
    // Ultra dark background palette
    gray: {
      50: '#f7fafc',
      100: '#edf2f7',
      200: '#e2e8f0',
      300: '#cbd5e0',
      400: '#a0aec0',
      500: '#718096',
      600: '#4a5568',
      700: '#2d3748',
      800: '#0f1419', // Darker
      900: '#0a0e14', // Much darker
      950: '#050810', // Ultra dark - almost black
    },
    // Sharp blue neon palette
    blue: {
      50: '#0a1929', // Dark blue instead of light
      100: '#0d2438', // Dark blue instead of light
      200: '#1a365d', // Dark blue
      300: '#0088ff', // Sharp electric blue
      400: '#00aaff', // Brighter neon blue
      500: '#00ccff', // Sharp electric blue
      600: '#00ddff', // Bright neon
      700: '#00eeff', // Very bright neon
      800: '#00ffff', // Pure cyan neon
      900: '#33ffff', // Light cyan neon
    },
    // Sharp cyan neon palette
    cyan: {
      50: '#0a1a1a', // Dark instead of light
      100: '#0d2626', // Dark instead of light
      200: '#1a3333', // Dark cyan
      300: '#00ccdd', // Bright neon cyan
      400: '#00ddee', // Brighter neon cyan
      500: '#00eeff', // Very bright neon cyan
      600: '#00ffff', // Pure cyan neon
      700: '#33ffff', // Light cyan neon
      800: '#66ffff', // Lighter cyan neon
      900: '#99ffff', // Lightest cyan neon
    },
    // Sharp green for success states
    green: {
      400: '#00ff41', // Matrix green
      500: '#00e639',
      600: '#00cc33',
    },
    // Sharp red for alerts
    red: {
      400: '#ff0040', // Electric red
      500: '#e6003a',
      600: '#cc0033',
    },
    // Brand colors - same as blue for consistency
    brand: {
      50: '#0a1929', // Dark blue
      100: '#0d2438', // Dark blue
      200: '#1a365d', // Dark blue
      300: '#0088ff', // Sharp electric blue
      400: '#00aaff', // Brighter neon blue
      500: '#00ccff', // Sharp electric blue - Primary brand color
      600: '#00ddff', // Bright neon - Same as Start Meeting button
      700: '#00eeff', // Very bright neon
      800: '#00ffff', // Pure cyan neon
      900: '#33ffff', // Light cyan neon
    },
  },
  styles: {
    global: {
      body: {
        bg: 'gray.950', // Ultra dark background
        color: 'cyan.300',
        fontFamily: 'Inter, system-ui, sans-serif',
      },
      '*': {
        borderColor: 'gray.700',
      },
      // Remove default focus styles and add custom ones
      '*:focus': {
        boxShadow: '0 0 0 2px rgba(0, 255, 255, 0.6) !important',
        borderColor: 'cyan.500 !important',
      },
      // Ensure no white backgrounds anywhere
      '.chakra-card, .chakra-modal__content, .chakra-popover__content, .chakra-menu__list, .chakra-tooltip, .chakra-select__menu, .chakra-drawer__content, .chakra-alert-dialog__content': {
        bg: 'gray.900 !important',
        borderColor: 'cyan.600 !important',
      },
      // Force all white/light backgrounds to dark
      '[data-theme="light"], .chakra-ui-light': {
        bg: 'gray.950 !important',
        color: 'cyan.300 !important',
      },
      // Override any remaining white backgrounds
      '*[style*="background-color: white"], *[style*="background-color: #fff"], *[style*="background-color: #ffffff"]': {
        backgroundColor: 'var(--chakra-colors-gray-900) !important',
      },
    },
  },
  components: {
    Button: {
      baseStyle: {
        fontWeight: 'bold',
        borderRadius: '2px', // Sharp corners
        textTransform: 'uppercase',
        letterSpacing: '1px',
        transition: 'all 0.2s ease',
        fontFamily: 'inherit',
        fontSize: '12px',
      },
      variants: {
        solid: {
          bg: 'transparent',
          color: 'cyan.300',
          border: '1px solid',
          borderColor: 'cyan.600',
          boxShadow: 'inset 0 0 0 1px rgba(0, 255, 255, 0.3)',
          _hover: {
            bg: 'rgba(0, 255, 255, 0.1)',
            borderColor: 'cyan.400',
            color: 'cyan.200',
            boxShadow: '0 0 20px rgba(0, 255, 255, 0.4), inset 0 0 0 1px rgba(0, 255, 255, 0.5)',
            transform: 'translateY(-1px)',
          },
          _active: {
            transform: 'translateY(0)',
            boxShadow: '0 0 15px rgba(0, 255, 255, 0.6), inset 0 0 0 2px rgba(0, 255, 255, 0.7)',
          },
        },
        outline: {
          bg: 'transparent',
          color: 'blue.400',
          border: '1px solid',
          borderColor: 'blue.600',
          _hover: {
            bg: 'rgba(0, 136, 255, 0.1)',
            borderColor: 'blue.400',
            color: 'blue.300',
            boxShadow: '0 0 15px rgba(0, 136, 255, 0.4)',
          },
        },
        ghost: {
          bg: 'transparent',
          color: 'gray.400',
          border: '1px solid transparent',
          _hover: {
            bg: 'gray.800',
            color: 'gray.200',
            borderColor: 'gray.600',
          },
        },
      },
      sizes: {
        sm: {
          fontSize: '10px',
          px: 3,
          py: 2,
        },
        md: {
          fontSize: '12px',
          px: 4,
          py: 2,
        },
        lg: {
          fontSize: '14px',
          px: 6,
          py: 3,
        },
      },
    },
    IconButton: {
      baseStyle: {
        borderRadius: '2px', // Sharp corners
        transition: 'all 0.2s ease',
      },
      variants: {
        solid: {
          bg: 'transparent',
          color: 'cyan.400',
          border: '1px solid',
          borderColor: 'cyan.600',
          _hover: {
            bg: 'rgba(0, 255, 255, 0.1)',
            borderColor: 'cyan.400',
            boxShadow: '0 0 15px rgba(0, 255, 255, 0.4)',
          },
        },
      },
    },
    Card: {
      baseStyle: {
        bg: 'gray.900',
        borderRadius: '2px', // Sharp corners
        border: '1px solid',
        borderColor: 'cyan.600',
        boxShadow: '0 0 20px rgba(0, 255, 255, 0.1), inset 0 0 0 1px rgba(0, 255, 255, 0.05)',
        _hover: {
          borderColor: 'cyan.500',
          boxShadow: '0 0 30px rgba(0, 255, 255, 0.3), inset 0 0 0 1px rgba(0, 255, 255, 0.1)',
          transform: 'translateY(-1px)',
        },
      },
    },
    Badge: {
      baseStyle: {
        textTransform: 'uppercase',
        letterSpacing: '1px',
        fontWeight: 'bold',
        fontSize: '10px',
        borderRadius: '2px',
        fontFamily: 'inherit',
      },
      variants: {
        solid: {
          bg: 'transparent',
          border: '1px solid',
          borderColor: 'cyan.600',
          color: 'cyan.300',
        },
      },
    },
    Heading: {
      baseStyle: {
        color: 'cyan.200',
        textShadow: '0 0 10px rgba(0, 255, 255, 0.5)',
        fontFamily: 'inherit',
        letterSpacing: '1px',
      },
    },
    Text: {
      baseStyle: {
        color: 'gray.300',
        fontFamily: 'inherit',
      },
    },
    Box: {
      baseStyle: {
        borderRadius: '2px', // Sharp corners by default
      },
    },
    Container: {
      baseStyle: {
        borderRadius: '2px',
      },
    },
    Modal: {
      baseStyle: {
        dialog: {
          bg: 'gray.900',
          borderRadius: '2px', // Sharp corners
          border: '1px solid',
          borderColor: 'cyan.600',
          boxShadow: '0 0 40px rgba(0, 255, 255, 0.2), inset 0 0 0 1px rgba(0, 255, 255, 0.1)',
        },
        overlay: {
          bg: 'blackAlpha.900',
        },
      },
    },
    Menu: {
      baseStyle: {
        list: {
          bg: 'gray.900',
          borderRadius: '2px', // Sharp corners
          border: '1px solid',
          borderColor: 'cyan.600',
          boxShadow: '0 0 25px rgba(0, 255, 255, 0.2), inset 0 0 0 1px rgba(0, 255, 255, 0.05)',
        },
        item: {
          bg: 'transparent',
          color: 'cyan.300',
          borderRadius: '2px',
          _hover: {
            bg: 'rgba(0, 255, 255, 0.1)',
            color: 'cyan.200',
            boxShadow: '0 0 10px rgba(0, 255, 255, 0.2)',
          },
          _focus: {
            bg: 'rgba(0, 255, 255, 0.1)',
            color: 'cyan.200',
            boxShadow: '0 0 10px rgba(0, 255, 255, 0.2)',
          },
        },
      },
    },
    Input: {
      baseStyle: {
        field: {
          bg: 'gray.900',
          borderRadius: '2px', // Sharp corners
          border: '1px solid',
          borderColor: 'cyan.600',
          color: 'cyan.300',
          boxShadow: 'inset 0 0 0 1px rgba(0, 255, 255, 0.1)',
          _placeholder: {
            color: 'gray.500',
          },
          _hover: {
            borderColor: 'cyan.500',
            boxShadow: '0 0 10px rgba(0, 255, 255, 0.2), inset 0 0 0 1px rgba(0, 255, 255, 0.1)',
          },
          _focus: {
            borderColor: 'cyan.400',
            boxShadow: '0 0 15px rgba(0, 255, 255, 0.3), inset 0 0 0 1px rgba(0, 255, 255, 0.2)',
          },
        },
      },
    },
    // Additional component overrides for white background elimination
    Popover: {
      baseStyle: {
        content: {
          bg: 'gray.900',
          borderRadius: '2px',
          border: '1px solid',
          borderColor: 'cyan.600',
          boxShadow: '0 0 20px rgba(0, 255, 255, 0.2)',
        },
      },
    },
    Tooltip: {
      baseStyle: {
        bg: 'gray.800',
        color: 'cyan.300',
        borderRadius: '2px',
        border: '1px solid',
        borderColor: 'cyan.600',
      },
    },
  },
};

export default darkTheme;
