/**
 * Mobile-First Design System
 * Comprehensive design tokens and utilities for mobile-first responsive design
 */

// Breakpoints (mobile-first approach)
export const breakpoints = {
  xs: '320px',   // Small phones
  sm: '640px',   // Large phones
  md: '768px',   // Tablets
  lg: '1024px',  // Small laptops
  xl: '1280px',  // Large laptops
  '2xl': '1536px' // Desktops
} as const

// Spacing scale (optimized for mobile)
export const spacing = {
  xs: '0.25rem',   // 4px
  sm: '0.5rem',    // 8px
  md: '0.75rem',   // 12px
  lg: '1rem',      // 16px
  xl: '1.25rem',   // 20px
  '2xl': '1.5rem', // 24px
  '3xl': '2rem',   // 32px
  '4xl': '2.5rem', // 40px
  '5xl': '3rem',   // 48px
  '6xl': '4rem',   // 64px
} as const

// Typography scale (mobile-optimized)
export const typography = {
  // Font sizes
  xs: '0.75rem',    // 12px
  sm: '0.875rem',   // 14px
  base: '1rem',     // 16px
  lg: '1.125rem',   // 18px
  xl: '1.25rem',    // 20px
  '2xl': '1.5rem',  // 24px
  '3xl': '1.875rem', // 30px
  '4xl': '2.25rem', // 36px
  '5xl': '3rem',    // 48px
  
  // Line heights
  tight: '1.25',
  snug: '1.375',
  normal: '1.5',
  relaxed: '1.625',
  loose: '2',
  
  // Font weights
  light: '300',
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',
} as const

// Touch targets (minimum 44px for accessibility)
export const touchTargets = {
  sm: '2.5rem',   // 40px
  md: '2.75rem',  // 44px (minimum recommended)
  lg: '3rem',     // 48px
  xl: '3.5rem',   // 56px
  '2xl': '4rem',  // 64px
} as const

// Border radius
export const borderRadius = {
  none: '0',
  sm: '0.125rem',   // 2px
  md: '0.375rem',   // 6px
  lg: '0.5rem',     // 8px
  xl: '0.75rem',    // 12px
  '2xl': '1rem',    // 16px
  '3xl': '1.5rem',  // 24px
  full: '9999px',
} as const

// Shadows (mobile-optimized)
export const shadows = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
} as const

// Colors (consistent with existing theme)
export const colors = {
  primary: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
  },
  secondary: {
    50: '#faf5ff',
    100: '#f3e8ff',
    200: '#e9d5ff',
    300: '#d8b4fe',
    400: '#c084fc',
    500: '#a855f7',
    600: '#9333ea',
    700: '#7c3aed',
    800: '#6b21a8',
    900: '#581c87',
  },
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
  },
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
  },
  error: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
  },
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
} as const

// Mobile-first utility classes
export const mobileFirst = {
  // Container
  container: 'w-full mx-auto px-4 sm:px-6 lg:px-8',
  containerSm: 'w-full mx-auto px-4 sm:px-6',
  containerLg: 'w-full mx-auto px-4 sm:px-6 lg:px-8 xl:px-12',
  
  // Grid
  grid: 'grid grid-cols-1 gap-4 sm:gap-6',
  gridSm: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6',
  gridMd: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6',
  gridLg: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6',
  
  // Flex
  flexCol: 'flex flex-col',
  flexRow: 'flex flex-row',
  flexCenter: 'flex items-center justify-center',
  flexBetween: 'flex items-center justify-between',
  flexStart: 'flex items-center justify-start',
  flexEnd: 'flex items-center justify-end',
  
  // Spacing
  spaceY: 'space-y-4 sm:space-y-6',
  spaceYSm: 'space-y-2 sm:space-y-4',
  spaceYLg: 'space-y-6 sm:space-y-8',
  spaceX: 'space-x-4 sm:space-x-6',
  spaceXSm: 'space-x-2 sm:space-x-4',
  spaceXLg: 'space-x-6 sm:space-x-8',
  
  // Text
  textXs: 'text-xs sm:text-sm',
  textSm: 'text-sm sm:text-base',
  textBase: 'text-base sm:text-lg',
  textLg: 'text-lg sm:text-xl',
  textXl: 'text-xl sm:text-2xl',
  text2xl: 'text-2xl sm:text-3xl',
  text3xl: 'text-3xl sm:text-4xl',
  
  // Headings
  heading1: 'text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 leading-tight',
  heading2: 'text-xl sm:text-2xl lg:text-3xl font-semibold text-gray-900 leading-tight',
  heading3: 'text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900 leading-tight',
  heading4: 'text-base sm:text-lg lg:text-xl font-medium text-gray-900 leading-tight',
  
  // Buttons
  buttonSm: 'h-10 px-4 text-sm font-medium rounded-lg',
  buttonMd: 'h-11 sm:h-12 px-4 sm:px-6 text-sm sm:text-base font-medium rounded-lg',
  buttonLg: 'h-12 sm:h-14 px-6 sm:px-8 text-base sm:text-lg font-medium rounded-lg',
  
  // Cards
  card: 'bg-white rounded-xl shadow-sm border border-gray-200',
  cardPadding: 'p-4 sm:p-6',
  cardPaddingSm: 'p-3 sm:p-4',
  cardPaddingLg: 'p-6 sm:p-8',
  
  // Forms
  input: 'h-11 sm:h-12 px-4 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
  inputSm: 'h-10 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
  inputLg: 'h-12 sm:h-14 px-4 sm:px-6 text-base sm:text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
  
  // Navigation
  navItem: 'flex items-center space-x-2 sm:space-x-3 px-3 sm:px-4 py-2 sm:py-3 rounded-lg text-sm sm:text-base font-medium',
  navItemActive: 'bg-blue-50 text-blue-700 border border-blue-200',
  navItemInactive: 'text-gray-600 hover:text-gray-900 hover:bg-gray-50',
  
  // Bottom navigation
  bottomNav: 'fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 sm:hidden',
  bottomNavItem: 'flex flex-col items-center space-y-1 py-2 px-3 rounded-lg text-xs font-medium',
  bottomNavItemActive: 'text-blue-600 bg-blue-50',
  bottomNavItemInactive: 'text-gray-500 hover:text-gray-700',
} as const

// Animation utilities
export const animations = {
  fadeIn: 'animate-in fade-in duration-300',
  slideUp: 'animate-in slide-in-from-bottom-4 duration-300',
  slideDown: 'animate-in slide-in-from-top-4 duration-300',
  scaleIn: 'animate-in zoom-in-95 duration-200',
  bounce: 'animate-bounce',
  pulse: 'animate-pulse',
  spin: 'animate-spin',
} as const

// Z-index scale
export const zIndex = {
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
} as const

// Safe area utilities for mobile devices
export const safeArea = {
  top: 'pt-safe-area-inset-top',
  bottom: 'pb-safe-area-inset-bottom',
  left: 'pl-safe-area-inset-left',
  right: 'pr-safe-area-inset-right',
  all: 'pt-safe-area-inset-top pb-safe-area-inset-bottom pl-safe-area-inset-left pr-safe-area-inset-right',
} as const

// Export all utilities as a single object for easy importing
export const designSystem = {
  breakpoints,
  spacing,
  typography,
  touchTargets,
  borderRadius,
  shadows,
  colors,
  mobileFirst,
  animations,
  zIndex,
  safeArea,
} as const

export default designSystem
