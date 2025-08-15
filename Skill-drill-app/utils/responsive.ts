import { Dimensions, PixelRatio } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Device type detection
export const getDeviceType = () => {
  const ratio = SCREEN_HEIGHT / SCREEN_WIDTH;
  const pixelRatio = PixelRatio.get();
  
  if (SCREEN_WIDTH < 768) {
    return 'phone';
  } else if (SCREEN_WIDTH >= 768 && SCREEN_WIDTH < 1024) {
    return 'tablet';
  } else {
    return 'desktop';
  }
};

export const isTablet = () => getDeviceType() === 'tablet';
export const isPhone = () => getDeviceType() === 'phone';
export const isDesktop = () => getDeviceType() === 'desktop';

// Responsive dimensions
export const responsiveDimensions = {
  width: SCREEN_WIDTH,
  height: SCREEN_HEIGHT,
  isLandscape: SCREEN_WIDTH > SCREEN_HEIGHT,
  isPortrait: SCREEN_HEIGHT > SCREEN_WIDTH,
  pixelRatio: PixelRatio.get(),
  fontScale: PixelRatio.getFontScale(),
};

// Responsive font sizes
export const responsiveFontSize = (size: number): number => {
  const deviceType = getDeviceType();
  const fontScale = PixelRatio.getFontScale();
  
  let scaledSize = size;
  
  // Base scaling by device type
  switch (deviceType) {
    case 'phone':
      if (SCREEN_WIDTH < 375) { // Small phones (iPhone SE, etc.)
        scaledSize = size * 0.9;
      } else if (SCREEN_WIDTH > 414) { // Large phones (iPhone Plus, etc.)
        scaledSize = size * 1.05;
      }
      break;
    case 'tablet':
      scaledSize = size * 1.2;
      break;
    case 'desktop':
      scaledSize = size * 1.3;
      break;
  }
  
  // Apply font scale but limit extremes
  const finalSize = scaledSize * Math.min(Math.max(fontScale, 0.85), 1.3);
  
  return Math.round(finalSize);
};

// Responsive spacing
export const responsiveSpacing = (space: number): number => {
  const deviceType = getDeviceType();
  
  switch (deviceType) {
    case 'phone':
      if (SCREEN_WIDTH < 375) {
        return Math.round(space * 0.9);
      } else if (SCREEN_WIDTH > 414) {
        return Math.round(space * 1.1);
      }
      return space;
    case 'tablet':
      return Math.round(space * 1.3);
    case 'desktop':
      return Math.round(space * 1.5);
    default:
      return space;
  }
};

// Responsive widths (percentage based)
export const responsiveWidth = (percentage: number): number => {
  return Math.round((SCREEN_WIDTH * percentage) / 100);
};

export const responsiveHeight = (percentage: number): number => {
  return Math.round((SCREEN_HEIGHT * percentage) / 100);
};

// Responsive sizing for elements
export const responsiveSize = (size: number): number => {
  const deviceType = getDeviceType();
  
  switch (deviceType) {
    case 'phone':
      if (SCREEN_WIDTH < 375) {
        return Math.round(size * 0.9);
      } else if (SCREEN_WIDTH > 414) {
        return Math.round(size * 1.05);
      }
      return size;
    case 'tablet':
      return Math.round(size * 1.25);
    case 'desktop':
      return Math.round(size * 1.4);
    default:
      return size;
  }
};

// Responsive margins and paddings
export const responsivePadding = {
  xs: responsiveSpacing(4),
  sm: responsiveSpacing(8),
  md: responsiveSpacing(16),
  lg: responsiveSpacing(24),
  xl: responsiveSpacing(32),
  xxl: responsiveSpacing(48),
};

export const responsiveMargin = {
  xs: responsiveSpacing(4),
  sm: responsiveSpacing(8),
  md: responsiveSpacing(16),
  lg: responsiveSpacing(24),
  xl: responsiveSpacing(32),
  xxl: responsiveSpacing(48),
};

// Responsive border radius
export const responsiveBorderRadius = (radius: number): number => {
  return responsiveSize(radius);
};

// Container max widths for different content types
export const maxContentWidth = {
  form: Math.min(responsiveWidth(90), 480),
  card: Math.min(responsiveWidth(95), 600),
  modal: Math.min(responsiveWidth(90), 520),
  full: responsiveWidth(100),
};

// Responsive layout helpers
export const getResponsiveLayout = () => {
  const deviceType = getDeviceType();
  const isLandscape = SCREEN_WIDTH > SCREEN_HEIGHT;
  
  return {
    deviceType,
    isLandscape,
    isPortrait: !isLandscape,
    columns: deviceType === 'phone' ? (isLandscape ? 2 : 1) : deviceType === 'tablet' ? (isLandscape ? 3 : 2) : 4,
    containerPadding: responsivePadding.md,
    itemSpacing: responsiveSpacing(12),
    headerHeight: responsiveSize(60),
    footerHeight: responsiveSize(80),
  };
};

// Typography scale
export const responsiveTypography = {
  // Headlines
  h1: responsiveFontSize(32),
  h2: responsiveFontSize(28),
  h3: responsiveFontSize(24),
  h4: responsiveFontSize(20),
  h5: responsiveFontSize(18),
  h6: responsiveFontSize(16),
  
  // Body text
  body1: responsiveFontSize(16),
  body2: responsiveFontSize(14),
  
  // UI elements
  button: responsiveFontSize(16),
  caption: responsiveFontSize(12),
  overline: responsiveFontSize(10),
  
  // App specific
  welcome: responsiveFontSize(28),
  subtitle: responsiveFontSize(15),
  input: responsiveFontSize(16),
};

// Component specific responsive helpers
export const responsiveButton = {
  height: responsiveSize(50),
  paddingHorizontal: responsivePadding.lg,
  paddingVertical: responsivePadding.sm,
  borderRadius: responsiveBorderRadius(25),
  fontSize: responsiveTypography.button,
};

export const responsiveInput = {
  height: responsiveSize(50),
  paddingHorizontal: responsivePadding.md,
  paddingVertical: responsivePadding.sm,
  borderRadius: responsiveBorderRadius(8),
  fontSize: responsiveTypography.input,
};

export const responsiveCard = {
  padding: responsivePadding.lg,
  borderRadius: responsiveBorderRadius(12),
  marginBottom: responsiveMargin.md,
};

// Hook for responsive values
export const useResponsive = () => {
  return {
    // Dimensions
    screenWidth: SCREEN_WIDTH,
    screenHeight: SCREEN_HEIGHT,
    
    // Device info
    deviceType: getDeviceType(),
    isPhone: isPhone(),
    isTablet: isTablet(),
    isDesktop: isDesktop(),
    isLandscape: responsiveDimensions.isLandscape,
    isPortrait: responsiveDimensions.isPortrait,
    
    // Responsive functions
    fontSize: responsiveFontSize,
    spacing: responsiveSpacing,
    size: responsiveSize,
    width: responsiveWidth,
    height: responsiveHeight,
    
    // Preset values
    typography: responsiveTypography,
    padding: responsivePadding,
    margin: responsiveMargin,
    button: responsiveButton,
    input: responsiveInput,
    card: responsiveCard,
    
    // Layout
    layout: getResponsiveLayout(),
    maxWidth: maxContentWidth,
  };
};

export default {
  dimensions: responsiveDimensions,
  fontSize: responsiveFontSize,
  spacing: responsiveSpacing,
  size: responsiveSize,
  width: responsiveWidth,
  height: responsiveHeight,
  typography: responsiveTypography,
  padding: responsivePadding,
  margin: responsiveMargin,
  button: responsiveButton,
  input: responsiveInput,
  card: responsiveCard,
  layout: getResponsiveLayout(),
  maxWidth: maxContentWidth,
  useResponsive,
};
