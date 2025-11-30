/**
 * Design Tokens - Hệ thống tokens thiết kế chuẩn hóa
 * Sử dụng cho toàn bộ ứng dụng để đảm bảo tính nhất quán
 */

// ─── COLOR SYSTEM ───────────────────────────────────────────────
export const colors = {
  // Primary Colors
  primary: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
    950: '#030712',
  },
  // Black & White
  black: '#000000',
  white: '#ffffff',
  // Gray Scale
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },
  // Semantic Colors
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
  },
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    500: '#f59e0b',
    600: '#d97706',
  },
  error: {
    50: '#fef2f2',
    100: '#fee2e2',
    500: '#ef4444',
    600: '#dc2626',
  },
  info: {
    50: '#eff6ff',
    100: '#dbeafe',
    500: '#3b82f6',
    600: '#2563eb',
  },
} as const;

// ─── SPACING SCALE ───────────────────────────────────────────────
// Base unit: 4px (0.25rem)
export const spacing = {
  0: '0',
  1: '0.25rem',   // 4px
  2: '0.5rem',    // 8px
  3: '0.75rem',   // 12px
  4: '1rem',      // 16px
  5: '1.25rem',   // 20px
  6: '1.5rem',    // 24px
  8: '2rem',      // 32px
  10: '2.5rem',   // 40px
  12: '3rem',     // 48px
  16: '4rem',     // 64px
  20: '5rem',     // 80px
  24: '6rem',     // 96px
} as const;

// ─── TYPOGRAPHY SCALE ────────────────────────────────────────────
export const typography = {
  fontFamily: {
    sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
    mono: ['Monaco', 'Consolas', 'monospace'],
  },
  fontSize: {
    xs: ['0.75rem', { lineHeight: '1rem' }],        // 12px
    sm: ['0.875rem', { lineHeight: '1.25rem' }],     // 14px
    base: ['1rem', { lineHeight: '1.5rem' }],        // 16px
    lg: ['1.125rem', { lineHeight: '1.75rem' }],     // 18px
    xl: ['1.25rem', { lineHeight: '1.75rem' }],      // 20px
    '2xl': ['1.5rem', { lineHeight: '2rem' }],       // 24px
    '3xl': ['1.875rem', { lineHeight: '2.25rem' }],  // 30px
    '4xl': ['2.25rem', { lineHeight: '2.5rem' }],    // 36px
    '5xl': ['3rem', { lineHeight: '1' }],            // 48px
    '6xl': ['3.75rem', { lineHeight: '1' }],        // 60px
  },
  fontWeight: {
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  },
} as const;

// ─── BORDER RADIUS ───────────────────────────────────────────────
export const radius = {
  none: '0',
  sm: '0.125rem',   // 2px
  md: '0.375rem',   // 6px
  lg: '0.5rem',     // 8px
  xl: '0.75rem',    // 12px
  '2xl': '1rem',    // 16px
  '3xl': '1.5rem',  // 24px
  full: '9999px',
} as const;

// ─── SHADOWS ─────────────────────────────────────────────────────
export const shadows = {
  none: 'none',
  xs: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  sm: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
} as const;

// ─── BREAKPOINTS ──────────────────────────────────────────────────
export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

// ─── Z-INDEX SCALE ───────────────────────────────────────────────
export const zIndex = {
  base: 0,
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modalBackdrop: 1040,
  modal: 1050,
  popover: 1060,
  tooltip: 1070,
} as const;

// ─── TRANSITIONS ─────────────────────────────────────────────────
export const transitions = {
  duration: {
    fast: '150ms',
    normal: '200ms',
    slow: '300ms',
    slower: '500ms',
  },
  easing: {
    default: 'cubic-bezier(0.4, 0, 0.2, 1)',
    in: 'cubic-bezier(0.4, 0, 1, 1)',
    out: 'cubic-bezier(0, 0, 0.2, 1)',
    inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
} as const;

// ─── COMPONENT SIZES ──────────────────────────────────────────────
export const componentSizes = {
  button: {
    sm: {
      height: '2rem',      // 32px
      paddingX: '0.75rem', // 12px
      fontSize: '0.875rem', // 14px
    },
    md: {
      height: '2.25rem',   // 36px
      paddingX: '1rem',     // 16px
      fontSize: '0.875rem', // 14px
    },
    lg: {
      height: '2.75rem',   // 44px
      paddingX: '1.25rem', // 20px
      fontSize: '1rem',    // 16px
    },
  },
  input: {
    sm: {
      height: '2rem',      // 32px
      paddingX: '0.75rem', // 12px
      fontSize: '0.875rem', // 14px
    },
    md: {
      height: '2.25rem',   // 36px
      paddingX: '0.75rem', // 12px
      fontSize: '0.875rem', // 14px
    },
    lg: {
      height: '3rem',      // 48px
      paddingX: '1rem',     // 16px
      fontSize: '1rem',    // 16px
    },
  },
} as const;

// ─── EXPORT TYPES ────────────────────────────────────────────────
export type ColorScale = typeof colors;
export type SpacingScale = typeof spacing;
export type TypographyScale = typeof typography;
export type RadiusScale = typeof radius;
export type ShadowScale = typeof shadows;

