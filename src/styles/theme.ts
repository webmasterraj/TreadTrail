// Theme constants for TreadTrail app
// Based on the color scheme found in the HTML mockups

export const COLORS = {
  // Pace colors - exactly matching the mockups for workout library
  recovery: '#F0FFF1', // Honeydew 
  base: '#B7EFC5',     // Celadon
  run: '#4AD66D',      // Malachite
  sprint: '#dd98fb',   // Pink
  accent: '#dd98fb',   // Pink
  
  // Muted/lighter versions for backgrounds
  recoveryMuted: 'rgba(240, 255, 241, 0.12)',
  baseMuted: 'rgba(183, 239, 197, 0.12)',
  runMuted: 'rgba(74, 214, 109, 0.12)',
  sprintMuted: 'rgba(221, 152, 251, 0.12)',

  // UI colors - exactly matching the mockups
  black: '#000000',    // Pure black for background
  darkGray: '#121212', // Slightly lighter black for cards
  mediumGray: '#222222', // For secondary backgrounds
  lightGray: 'rgba(255, 255, 255, 0.1)', // For subtle highlights
  white: '#FFFFFF',    // For text
  
  // Transparency overlays - for gradients matching mockups
  blackOverlayLight: 'rgba(0, 0, 0, 0.1)',
  blackOverlayMedium: 'rgba(0, 0, 0, 0.3)', 
  blackOverlayHeavy: 'rgba(0, 0, 0, 0.7)',
  blackOverlayVeryHeavy: 'rgba(0, 0, 0, 0.9)',
  whiteTransparent: 'rgba(255, 255, 255, 0.15)',
  whiteTransparentBorder: 'rgba(255, 255, 255, 0.3)',
  
  // Status colors
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#F44336',
  info: '#2196F3',
};

export const FONTS = {
  regular: 'Inter-Regular',
  medium: 'Inter-Medium',
  semiBold: 'Inter-SemiBold',
  bold: 'Inter-Bold',
  extraBold: 'Inter-ExtraBold',
};

export const FONT_SIZES = {
  xs: 12,
  small: 14,
  medium: 16,
  large: 18,
  xl: 20,
  xxl: 24,
  xxxl: 30,
  title: 36,
};

export const SPACING = {
  xs: 4,
  small: 8,
  medium: 16,
  large: 24,
  xl: 32,
  xxl: 48,
};

export const BORDER_RADIUS = {
  small: 5,
  medium: 10,
  card: 15,
  button: 30,
};

export const SHADOW = {
  small: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.23,
    shadowRadius: 2.62,
    elevation: 4,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
};

// Maps pace types to colors
export const PACE_COLORS = {
  recovery: COLORS.recovery,
  base: COLORS.base,
  run: COLORS.run,
  sprint: COLORS.sprint,
};

// Maps difficulty levels to visual indicators
export const DIFFICULTY_INDICATORS = {
  beginner: {
    color: COLORS.base,
    label: 'Beginner',
  },
  intermediate: {
    color: COLORS.run,
    label: 'Intermediate',
  },
  advanced: {
    color: COLORS.sprint,
    label: 'Advanced',
  },
};

// Maps focus types to visual indicators
export const FOCUS_INDICATORS = {
  endurance: {
    icon: 'timer',
    label: 'Endurance',
  },
  hiit: {
    icon: 'flash',
    label: 'HIIT',
  },
  fat_burn: {
    icon: 'fire',
    label: 'Fat Burn',
  },
};