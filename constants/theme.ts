export const Colors = {
  // Trust Architecture — Primary palette
  // Prussian navy: institutional trust, depth
  navy900: '#060F24',
  navy800: '#0D1F4A',
  navy700: '#142E5C',
  navy600: '#1B3D6E',
  navy500: '#244D82',

  // Blue — kept for interactive/selection states
  blue600: '#2146B8',
  blue500: '#2952D8',
  blue400: '#4A72E8',
  blue300: '#7B9BF2',
  blue200: '#B3C8F9',
  blue100: '#E0EAFF',
  blue50: '#F0F5FF',

  // Terracotta — brand accent, CTAs, identity
  terra600: '#B8451E',
  terra500: '#D95F2B',
  terra400: '#E8774A',
  terra300: '#F0A080',
  terra200: '#F8D0BC',
  terra100: '#FDF0EA',
  terra50: '#FEF7F3',

  // Ember — action highlight
  ember: '#FF8C42',

  // Warm neutrals
  white: '#FFFFFF',
  cream: '#F5F0E8',
  warm50: '#FAF8F4',
  warm100: '#F0EDE6',
  warm200: '#E0D8CC',
  warm300: '#C8BFB0',
  warm400: '#A89E8E',
  warm500: '#7A7264',
  warm600: '#5C554A',
  warm700: '#3D3832',
  warm800: '#2C2A27',

  // Cool grays — kept for functional UI (inputs, disabled states)
  gray50: '#F8F9FC',
  gray100: '#F0F1F5',
  gray200: '#E2E4EB',
  gray300: '#C8CBD6',
  gray400: '#9CA1B3',
  gray500: '#6B7189',

  black: '#000000',

  // Status colors
  green500: '#22C55E',
  green100: '#DCFCE7',
  amber500: '#F59E0B',
  amber100: '#FEF3C7',
  red500: '#EF4444',

  // Semantic
  background: '#FFFFFF',
  surface: '#F5F0E8',
  textPrimary: '#0D1F4A',
  textSecondary: '#5C554A',
  textTertiary: '#A89E8E',
  border: '#E0D8CC',

  // Voice screen
  voiceBg: '#0d1117',

  // Activation glow
  activationGlow: '#E8A84C',
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
    shadowColor: '#0D1F4A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#0D1F4A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  lg: {
    shadowColor: '#0D1F4A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 5,
  },
};
