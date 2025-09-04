// Non-route utility kept inside the `app/` tree.
// Add a default export React component placeholder to satisfy expo-router route checks.
import React from "react";

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
  // Font Sizes
  fontSize: {
    xs: 10,
    sm: 12,
    base: 14,
    md: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 28,
    '4xl': 32,
    '5xl': 40
  },
  
  // Font Weights
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
    black: '900'
  },
  
  // Line Heights
  lineHeight: {
    tight: 1.2,
    normal: 1.4,
    relaxed: 1.6,
    loose: 1.8
  },
  
  // Letter Spacing
  letterSpacing: {
    tight: -0.5,
    normal: 0,
    wide: 0.5,
    wider: 1,
    widest: 2
  }
} as const;

// ===== SPACING =====
export const SPACING = {
  // Padding
  padding: {
    xs: 8,
    sm: 12,
    md: 16,
    lg: 20,
    xl: 24,
    '2xl': 32,
    '3xl': 40
  },
  
  // Margins
  margin: {
    xs: 8,
    sm: 12,
    md: 16,
    lg: 20,
    xl: 24,
    '2xl': 32,
    '3xl': 40
  },
  
  // Gaps
  gap: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    '2xl': 24
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


