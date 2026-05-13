import { Dimensions, Platform, PixelRatio } from 'react-native';

// Get device dimensions
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Device type detection
export const isTablet = (): boolean => {
  const aspectRatio = SCREEN_HEIGHT / SCREEN_WIDTH;

  // For Android, use physical size calculation
  if (Platform.OS === 'android') {
    const pixelDensity = PixelRatio.get();
    const adjustedWidth = SCREEN_WIDTH * pixelDensity;
    const adjustedHeight = SCREEN_HEIGHT * pixelDensity;

    // If smallest dimension is >= 600dp (Android tablet threshold)
    const smallestDimension = Math.min(adjustedWidth, adjustedHeight) / pixelDensity;
    return smallestDimension >= 600;
  }

  // For iOS (iPad detection)
  if (Platform.OS === 'ios') {
    // iPad typically has width >= 768 and aspect ratio closer to 4:3
    return (SCREEN_WIDTH >= 768 || SCREEN_HEIGHT >= 768) && aspectRatio < 1.6;
  }

  // Default for other platforms
  return SCREEN_WIDTH >= 768;
};

// Responsive sizing based on device type
export const getResponsiveSize = (phoneSize: number, tabletSize?: number): number => {
  return isTablet() ? (tabletSize ?? phoneSize * 1.1) : phoneSize;
};

// Responsive spacing
export const getResponsiveSpacing = (phoneSpacing: number, tabletSpacing?: number): number => {
  return isTablet() ? (tabletSpacing ?? phoneSpacing * 1.2) : phoneSpacing;
};

// Get responsive font size
export const getResponsiveFontSize = (phoneSize: number, tabletSize?: number): number => {
  return isTablet() ? (tabletSize ?? phoneSize * 1.05) : phoneSize;
};

// Get device info
export const getDeviceInfo = () => {
  return {
    isTablet: isTablet(),
    screenWidth: SCREEN_WIDTH,
    screenHeight: SCREEN_HEIGHT,
    platform: Platform.OS,
  };
};

// Responsive padding
export const responsivePadding = {
  small: getResponsiveSpacing(8, 10),
  medium: getResponsiveSpacing(16, 20),
  large: getResponsiveSpacing(24, 28),
  extraLarge: getResponsiveSpacing(32, 38),
};

// Responsive font sizes
export const responsiveFontSizes = {
  extraSmall: getResponsiveFontSize(10, 11),
  small: getResponsiveFontSize(12, 13),
  medium: getResponsiveFontSize(14, 15),
  regular: getResponsiveFontSize(16, 17),
  large: getResponsiveFontSize(18, 19),
  extraLarge: getResponsiveFontSize(22, 24),
  title: getResponsiveFontSize(28, 30),
};
