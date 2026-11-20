import { MD3LightTheme, configureFonts } from 'react-native-paper';
import { colors } from './colors';

const fontConfig = configureFonts({
  config: {
    fontFamily: 'System',
  },
});

export const paperTheme = {
  ...MD3LightTheme,
  fonts: fontConfig,
  roundness: 14,
  colors: {
    ...MD3LightTheme.colors,
    primary: colors.primary,
    secondary: colors.accent,
    tertiary: colors.accent,
    background: colors.background,
    surface: colors.surface,
    surfaceVariant: colors.surfaceAlt,
    onPrimary: colors.textInverse,
    onSecondary: colors.textInverse,
    onBackground: colors.text,
    onSurface: colors.text,
    onSurfaceVariant: colors.textSecondary,
    outline: colors.border,
    error: colors.danger,
    elevation: {
      ...MD3LightTheme.colors.elevation,
      level1: colors.surface,
      level2: colors.surface,
      level3: colors.surface,
    },
  },
};
