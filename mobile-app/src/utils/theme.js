import { Dimensions, PixelRatio } from 'react-native';
import { DefaultTheme } from 'react-native-paper';

const getWindow = () => Dimensions.get('window');

export const rs = (size) => {
  const { width } = getWindow();
  return Math.round((width / 390) * size);
};
export const vs = (size) => {
  const { height } = getWindow();
  return Math.round((height / 844) * size);
};
export const ms = (size, factor = 0.5) => Math.round(size + (rs(size) - size) * factor);
export const W = getWindow().width;
export const H = getWindow().height;

export const colors = {
  // Domino's Brand
  primary: '#E31837',
  primaryLight: '#FF4D6A',
  primaryDark: '#B01229',
  primarySurface: '#FFF0F2',

  // Domino's Dark Navy
  navy: '#1A1A2E',
  navyLight: '#16213E',

  // Accent — Domino's uses a dark blue accent
  accent: '#0F3460',
  accentLight: '#E8EEF7',

  // Neutrals
  background: '#F5F5F5',
  surface: '#FFFFFF',
  surfaceAlt: '#F9F9F9',
  card: '#FFFFFF',

  // Text
  text: '#1A1A1A',
  textSecondary: '#555555',
  placeholder: '#999999',

  // Semantic
  error: '#E31837',
  errorLight: '#FFEAED',
  success: '#2E7D32',
  successLight: '#E8F5E9',
  warning: '#F57C00',
  warningLight: '#FFF3E0',
  info: '#0277BD',
  infoLight: '#E1F5FE',

  // UI
  border: '#E0E0E0',
  divider: '#EEEEEE',
  shadow: '#000000',
  overlay: 'rgba(0,0,0,0.05)',

  // Gradient — Domino's red
  gradientStart: '#E31837',
  gradientMid: '#C8102E',
  gradientEnd: '#A50E26',

  // Food tags
  tagVeg: '#2E7D32',
  tagNonVeg: '#E31837',
};

export const spacing = {
  get xs() { return rs(4); },
  get sm() { return rs(8); },
  get md() { return rs(16); },
  get lg() { return rs(24); },
  get xl() { return rs(32); },
  get xxl() { return rs(48); },
};

export const fonts = {
  regular: 'Poppins_400Regular',
  medium: 'Poppins_500Medium',
  semiBold: 'Poppins_600SemiBold',
  bold: 'Poppins_700Bold',
  extraBold: 'Poppins_800ExtraBold',
  black: 'Poppins_900Black',
};

export const typography = {
  h1: { fontSize: ms(28), fontWeight: '900', lineHeight: ms(36), letterSpacing: -0.5 },
  h2: { fontSize: ms(22), fontWeight: '800', lineHeight: ms(30) },
  h3: { fontSize: ms(18), fontWeight: '700', lineHeight: ms(26) },
  body: { fontSize: ms(15), fontWeight: '400', lineHeight: ms(22) },
  bodySmall: { fontSize: ms(13), fontWeight: '400', lineHeight: ms(18) },
  caption: { fontSize: ms(11), fontWeight: '500', lineHeight: ms(15), letterSpacing: 0.3 },
  label: { fontSize: ms(12), fontWeight: '700', letterSpacing: 0.5 },
};

export const shadows = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 14,
    elevation: 8,
  },
};

export const borderRadius = {
  xs: rs(4),
  sm: rs(8),
  md: rs(12),
  lg: rs(16),
  xl: rs(24),
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
    regular: { fontFamily: 'Poppins_400Regular', fontWeight: '400' },
    medium: { fontFamily: 'Poppins_500Medium', fontWeight: '500' },
    bold: { fontFamily: 'Poppins_700Bold', fontWeight: '700' },
    heavy: { fontFamily: 'Poppins_800ExtraBold', fontWeight: '800' },
  },
};
