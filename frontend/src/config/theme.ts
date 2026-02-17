import { useColorScheme } from 'react-native';

// Color Palette
export const COLORS = {
  // Primary - Deep Blue
  primary: '#1E3A5F',
  primaryLight: '#2D5185',
  primaryDark: '#0F1F35',

  // Secondary - Warm Orange
  secondary: '#F97316',
  secondaryLight: '#FB923C',
  secondaryDark: '#EA580C',

  // Status Colors
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',

  // Neutral - Light Mode
  lightBg: '#F9FAFB',
  lightCard: '#FFFFFF',
  lightText: '#374151',
  lightGray: '#E5E7EB',
  lightBorder: '#D1D5DB',

  // Neutral - Dark Mode
  darkBg: '#1F2937',
  darkCard: '#374151',
  darkText: '#F3F4F6',
  darkGray: '#6B7280',
  darkBorder: '#4B5563',

  // Semantic
  transparent: 'transparent',
  white: '#FFFFFF',
  black: '#000000',
};

// Typography Scale
export const TYPOGRAPHY = {
  display: {
    fontSize: 32,
    fontWeight: 700 as any,
    lineHeight: 40,
  },
  h1: {
    fontSize: 20,
    fontWeight: 600 as any,
    lineHeight: 28,
  },
  h2: {
    fontSize: 16,
    fontWeight: 600 as any,
    lineHeight: 24,
  },
  body: {
    fontSize: 14,
    fontWeight: 400 as any,
    lineHeight: 20,
  },
  bodySmall: {
    fontSize: 13,
    fontWeight: 400 as any,
    lineHeight: 18,
  },
  caption: {
    fontSize: 12,
    fontWeight: 400 as any,
    lineHeight: 16,
  },
  captionBold: {
    fontSize: 12,
    fontWeight: 600 as any,
    lineHeight: 16,
  },
};

// Spacing Scale
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

// Border Radius
export const BORDER_RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  full: 999,
};

// Shadows
export const SHADOWS = {
  light: {
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  medium: {
    shadowColor: '#000000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  elevated: {
    shadowColor: '#000000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
};

// Theme Object
export const lightTheme = {
  bg: COLORS.lightBg,
  card: COLORS.lightCard,
  text: COLORS.lightText,
  textSecondary: COLORS.lightGray,
  border: COLORS.lightBorder,
  primary: COLORS.primary,
  secondary: COLORS.secondary,
  success: COLORS.success,
  warning: COLORS.warning,
  error: COLORS.error,
  info: COLORS.info,
};

export const darkTheme = {
  bg: COLORS.darkBg,
  card: COLORS.darkCard,
  text: COLORS.darkText,
  textSecondary: COLORS.darkGray,
  border: COLORS.darkBorder,
  primary: COLORS.primary,
  secondary: COLORS.secondary,
  success: COLORS.success,
  warning: COLORS.warning,
  error: COLORS.error,
  info: COLORS.info,
};

export type Theme = typeof lightTheme;

// Hook to get current theme
export const useAppTheme = (forcedTheme?: 'light' | 'dark') => {
  const colorScheme = useColorScheme();
  const isDark = forcedTheme === 'dark' || (forcedTheme === null && colorScheme === 'dark');
  return isDark ? darkTheme : lightTheme;
};
