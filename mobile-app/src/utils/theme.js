import { Dimensions, PixelRatio } from 'react-native';
import { DefaultTheme } from 'react-native-paper';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

// Responsive scale helpers
export const rs = (size) => Math.round((SCREEN_W / 390) * size); // scale by width (base 390)
export const vs = (size) => Math.round((SCREEN_H / 844) * size); // scale by height (base 844)
export const ms = (size, factor = 0.5) => size + (rs(size) - size) * factor;
export const { width: W, height: H } = { width: SCREEN_W, height: SCREEN_H };

export const colors = {
  // Brand — saffron orange
  primary: '#F97316',
  primaryLight: '#FB923C',
  primaryDark: '#C2410C',
  primarySurface: '#FFF7ED',

  // Accent — emerald green
  accent: '#059669',
  accentLight: '#D1FAE5',

  // Neutrals — warm tinted
  background: '#FFFBF5',
  surface: '#FFFFFF',
  surfaceAlt: '#FEF3E2',
  card: '#FFFFFF',

  // Text
  text: '#1C1917',
  textSecondary: '#78716C',
  placeholder: '#A8A29E',

  // Semantic
  error: '#DC2626',
  errorLight: '#FEE2E2',
  success: '#059669',
  successLight: '#D1FAE5',
  warning: '#D97706',
  warningLight: '#FEF3C7',
  info: '#0284C7',
  infoLight: '#E0F2FE',

  // UI
  border: '#E7E5E4',
  divider: '#F5F5F4',
  shadow: '#431407',
  overlay: 'rgba(0,0,0,0.04)',

  // Gradient — saffron to amber
  gradientStart: '#EA580C',
  gradientMid: '#F97316',
  gradientEnd: '#FBBF24',

  // Food tags
  tagVeg: '#059669',
  tagNonVeg: '#DC2626',
};

export const spacing = {
  xs: rs(4),
  sm: rs(8),
  md: rs(16),
  lg: rs(24),
  xl: rs(32),
  xxl: rs(48),
};

export const typography = {
  h1: { fontSize: ms(28), fontWeight: '800', lineHeight: ms(36), letterSpacing: -0.5 },
  h2: { fontSize: ms(22), fontWeight: '700', lineHeight: ms(30) },
  h3: { fontSize: ms(18), fontWeight: '600', lineHeight: ms(26) },
  body: { fontSize: ms(15), fontWeight: '400', lineHeight: ms(22) },
  bodySmall: { fontSize: ms(13), fontWeight: '400', lineHeight: ms(18) },
  caption: { fontSize: ms(11), fontWeight: '500', lineHeight: ms(15), letterSpacing: 0.3 },
  label: { fontSize: ms(12), fontWeight: '600', letterSpacing: 0.5 },
};

export const shadows = {
  small: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  medium: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  large: {
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 8,
  },
};

export const borderRadius = {
  xs: rs(6),
  sm: rs(10),
  md: rs(14),
  lg: rs(20),
  xl: rs(28),
  full: 999,
};

export const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    ...colors,
  },
  fonts: {
    ...DefaultTheme.fonts,
    regular: { fontFamily: 'System', fontWeight: '400' },
    medium: { fontFamily: 'System', fontWeight: '500' },
    bold: { fontFamily: 'System', fontWeight: '700' },
  },
};
