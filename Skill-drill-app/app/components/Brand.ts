// Non-route utility kept inside the `app/` tree.
// Add a default export React component placeholder to satisfy expo-router route checks.
import React from "react";

// ===== ASSETS =====
export const LOGO_SRC = require('../../assets/images/logo.png');

// ===== BRAND COLORS =====
export const BRAND = "#0A66C2";
export const BRAND_LIGHT = "#E6F2FF";
export const BRAND_DARK = "#0056B3";
export const BRAND_GRADIENT = "#1E40AF";
export const BRAND_ACCENT = "#3B82F6";

// ===== SEMANTIC COLORS =====
export const COLORS = {
  // Base Colors
  white: "#FFFFFF",
  black: "#000000",
  
  // Grays
  gray: {
    50: "#F9FAFB",
    100: "#F3F4F6",
    200: "#E5E7EB",
    300: "#D1D5DB",
    400: "#9CA3AF",
    500: "#6B7280",
    600: "#4B5563",
    700: "#374151",
    800: "#1F2937",
    900: "#111827"
  },
  
  // Status Colors
  success: "#22C55E",
  successDark: "#16A34A",
  successLight: "#10B981",
  warning: "#F59E0B",
  warningDark: "#D97706",
  error: "#EF4444",
  errorDark: "#DC2626",
  
  // Semantic Colors
  text: {
    primary: "#1F2937",
    secondary: "#374151",
    tertiary: "#6B7280",
    disabled: "#9CA3AF",
    inverse: "#FFFFFF"
  },
  
  // Background Colors
  background: {
    primary: "#FFFFFF",
    secondary: "#F8FAFC",
    tertiary: "#F3F4F6",
    card: "#FFFFFF",
    overlay: "rgba(0, 0, 0, 0.5)"
  },
  
  // Border Colors
  border: {
    light: "#E5E7EB",
    medium: "#D1D5DB",
    dark: "#9CA3AF",
    brand: "#E6F2FF"
  }
} as const;

// ===== GRADIENTS =====
export const GRADIENTS = {
  primary: [BRAND, BRAND_DARK],
  header: [BRAND, BRAND_GRADIENT, BRAND_ACCENT],
  card: [BRAND, BRAND_DARK],
  footer: [BRAND, '#0E75D1', '#1285E0'],
  welcome: [BRAND, '#0E75D1', '#1285E0'],
  onboarding: [BRAND, '#0E75D1', '#1285E0']
} as const;

// ===== TYPOGRAPHY =====
export const TYPOGRAPHY = {
  // Headers
  h1: { fontSize: 24, fontWeight: '700', color: '#000000', letterSpacing: 0.1 },
  h2: { fontSize: 20, fontWeight: '600', color: '#000000', letterSpacing: 0.1 },
  h3: { fontSize: 18, fontWeight: '600', color: '#000000', letterSpacing: 0.1 },
  h4: { fontSize: 16, fontWeight: '600', color: '#000000', letterSpacing: 0.1 },
  subtitle: { fontSize: 15, fontWeight: '500', color: '#374151' },
  
  // Body Text
  body: { fontSize: 14, color: '#4B5563', lineHeight: 20 },
  bodyLarge: { fontSize: 16, fontWeight: '500', color: COLORS.gray[700], lineHeight: 24 },
  bodyMedium: { fontSize: 14, fontWeight: '500', color: COLORS.gray[700], lineHeight: 20 },
  bodySmall: { fontSize: 12, fontWeight: '500', color: COLORS.gray[700], lineHeight: 18 },
  
  // Labels and Captions
  label: { fontSize: 12, fontWeight: '600', color: '#6B7280', letterSpacing: 0.05 },
  labelLarge: { fontSize: 14, fontWeight: '600', color: '#000000', letterSpacing: 0.1 },
  labelMedium: { fontSize: 12, fontWeight: '600', color: '#000000', letterSpacing: 0.1 },
  labelSmall: { fontSize: 10, fontWeight: '600', color: '#000000', letterSpacing: 0.1 },
  caption: { fontSize: 12, color: '#6B7280', lineHeight: 16 },
  
  // Secondary Text
  secondaryLarge: { fontSize: 14, fontWeight: '500', color: COLORS.gray[400], lineHeight: 20 },
  secondaryMedium: { fontSize: 12, fontWeight: '500', color: COLORS.gray[400], lineHeight: 18 },
  secondarySmall: { fontSize: 10, fontWeight: '500', color: COLORS.gray[400], lineHeight: 16 },
  
  // Button Text
  button: { fontSize: 16, fontWeight: '600', color: '#FFFFFF', letterSpacing: 0.3 },
  buttonLarge: { fontSize: 16, fontWeight: '600', letterSpacing: 0.1 },
  buttonMedium: { fontSize: 14, fontWeight: '600', letterSpacing: 0.1 },
  buttonSmall: { fontSize: 12, fontWeight: '600', letterSpacing: 0.1 },
  
  // Special Text
  brand: { fontSize: 18, fontWeight: '900', color: COLORS.white, letterSpacing: 0.5 },
  score: { fontSize: 20, fontWeight: '700', color: BRAND, letterSpacing: 0.2 },
  success: { fontSize: 12, fontWeight: '600', color: COLORS.success, letterSpacing: 0.1 },
  warning: { fontSize: 12, fontWeight: '600', color: COLORS.warning, letterSpacing: 0.1 },
  overline: { fontSize: 11, fontWeight: '700', color: BRAND, letterSpacing: 1.2 },
  pill: { fontSize: 12, fontWeight: '600', letterSpacing: 0.4 },
  
  // Utility
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 22,
  },
  fontWeight: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
};

export const CARD = {
  base: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#0F172A',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 3,
  },
  highlight: {
    backgroundColor: BRAND,
    borderRadius: 20,
    padding: 20,
    shadowColor: BRAND,
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: 4,
  },
};

// ===== SPACING =====
export const SPACING = {
  xs: 6,
  sm: 10,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 40,
  padding: {
    xs: 8,
    sm: 12,
    md: 16,
    lg: 20,
    xl: 24,
    '2xl': 28,
  },
  margin: {
    xs: 6,
    sm: 10,
    md: 16,
    lg: 20,
    xl: 24,
    '2xl': 32,
  },
  gap: {
    xs: 6,
    sm: 10,
    md: 14,
    lg: 18,
    xl: 24,
  }
} as const;

// ===== BORDER RADIUS =====
export const BORDER_RADIUS = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 20,
  '3xl': 24,
  full: 999
} as const;

// ===== SHADOWS =====
export const SHADOWS = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8
  }
} as const;

// ===== COMPONENT PATTERNS =====
export const COMPONENTS = {
  // Button Styles
  button: {
    primary: {
      backgroundColor: BRAND,
      paddingVertical: SPACING.padding.sm,
      paddingHorizontal: SPACING.padding.md,
      borderRadius: BORDER_RADIUS.md,
      alignItems: 'center' as const,
      justifyContent: 'center' as const
    },
    secondary: {
      backgroundColor: COLORS.background.secondary,
      paddingVertical: SPACING.padding.sm,
      paddingHorizontal: SPACING.padding.md,
      borderRadius: BORDER_RADIUS.md,
      borderWidth: 1,
      borderColor: COLORS.border.light,
      alignItems: 'center' as const,
      justifyContent: 'center' as const
    }
  },
  
  // Card Styles
  card: {
    base: {
      backgroundColor: COLORS.background.card,
      borderRadius: BORDER_RADIUS.lg,
      borderWidth: 1,
      borderColor: COLORS.border.light,
      overflow: 'hidden' as const
    }
  },
  
  // Input Styles
  input: {
    base: {
      backgroundColor: COLORS.background.primary,
      borderWidth: 1,
      borderColor: COLORS.border.light,
      borderRadius: BORDER_RADIUS.md,
      paddingHorizontal: SPACING.padding.md,
      paddingVertical: SPACING.padding.sm
    }
  }
} as const;

// ===== LEGACY SUPPORT =====
// Keep these for backward compatibility
export const PADDING = SPACING.padding;
export const WHITE = COLORS.white;
export const GRAY = COLORS.gray[400];
export const DARK_GRAY = COLORS.gray[700];
export const SUCCESS = COLORS.success;
export const WARNING = COLORS.warning;
export const ERROR = COLORS.error;

export default function BrandPlaceholder(): React.JSX.Element | null {
  return null;
}


