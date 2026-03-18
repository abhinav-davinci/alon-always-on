export const Colors = {
  // Primary blue palette
  blue900: '#0A1A4A',
  blue800: '#102365',
  blue700: '#1A3A8F',
  blue600: '#2146B8',
  blue500: '#2952D8',
  blue400: '#4A72E8',
  blue300: '#7B9BF2',
  blue200: '#B3C8F9',
  blue100: '#E0EAFF',
  blue50: '#F0F5FF',

  // Neutrals
  white: '#FFFFFF',
  gray50: '#F8F9FC',
  gray100: '#F0F1F5',
  gray200: '#E2E4EB',
  gray300: '#C8CBD6',
  gray400: '#9CA1B3',
  gray500: '#6B7189',
  gray600: '#4A4F63',
  gray700: '#2D3142',
  gray800: '#1A1D2E',
  gray900: '#0D0F1A',
  black: '#000000',

  // Accent
  green500: '#22C55E',
  green100: '#DCFCE7',
  amber500: '#F59E0B',
  amber100: '#FEF3C7',
  red500: '#EF4444',

  // Semantic
  background: '#FFFFFF',
  surface: '#F8F9FC',
  textPrimary: '#1A1D2E',
  textSecondary: '#6B7189',
  textTertiary: '#9CA1B3',
  border: '#E2E4EB',

  // Voice screen
  voiceBg: '#0d1117',
};

export const Typography = {
  // DM Serif Display
  serifLarge: {
    fontFamily: 'DMSerifDisplay',
    fontSize: 32,
    lineHeight: 40,
  },
  serifMedium: {
    fontFamily: 'DMSerifDisplay',
    fontSize: 24,
    lineHeight: 32,
  },
  serifSmall: {
    fontFamily: 'DMSerifDisplay',
    fontSize: 20,
    lineHeight: 28,
  },

  // DM Sans
  heading1: {
    fontFamily: 'DMSans-Bold',
    fontSize: 28,
    lineHeight: 36,
  },
  heading2: {
    fontFamily: 'DMSans-Bold',
    fontSize: 22,
    lineHeight: 28,
  },
  heading3: {
    fontFamily: 'DMSans-SemiBold',
    fontSize: 18,
    lineHeight: 24,
  },
  body: {
    fontFamily: 'DMSans-Regular',
    fontSize: 16,
    lineHeight: 24,
  },
  bodyMedium: {
    fontFamily: 'DMSans-Medium',
    fontSize: 16,
    lineHeight: 24,
  },
  bodySemiBold: {
    fontFamily: 'DMSans-SemiBold',
    fontSize: 16,
    lineHeight: 24,
  },
  caption: {
    fontFamily: 'DMSans-Regular',
    fontSize: 14,
    lineHeight: 20,
  },
  captionMedium: {
    fontFamily: 'DMSans-Medium',
    fontSize: 14,
    lineHeight: 20,
  },
  small: {
    fontFamily: 'DMSans-Regular',
    fontSize: 12,
    lineHeight: 16,
  },
  smallMedium: {
    fontFamily: 'DMSans-Medium',
    fontSize: 12,
    lineHeight: 16,
  },
  button: {
    fontFamily: 'DMSans-SemiBold',
    fontSize: 16,
    lineHeight: 20,
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  xxxxl: 48,
};

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 9999,
};

export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 5,
  },
};
