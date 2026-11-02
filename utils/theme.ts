import React, { createContext, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';

export type ThemeColors = {
  background: string;
  card: string;
  primaryText: string;
  secondaryText: string;
  accent: string;
  protein: string;
  fat: string;
  carbs: string;
  border: string;
  danger: string;
};

export const radius = {
  sm: 12,
  md: 16,
  lg: 20,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

const lightColors: ThemeColors = {
  background: '#F4F4F7',
  card: '#FFFFFF',
  primaryText: '#1C1C1E',
  secondaryText: '#8A8A8E',
  accent: '#5B8DEF',
  protein: '#E07A8B',
  fat: '#E0B35B',
  carbs: '#6FB3A0',
  border: '#ECECEF',
  danger: '#E0616B',
};

const darkColors: ThemeColors = {
  background: '#0F0F12',
  card: '#1C1C1F',
  primaryText: '#F2F2F3',
  secondaryText: '#8E8E93',
  accent: '#6E9BF4',
  protein: '#E79AA7',
  fat: '#E5C077',
  carbs: '#7FC2AF',
  border: '#2A2A2D',
  danger: '#E67A82',
};

export type Theme = {
  colors: ThemeColors;
  radius: typeof radius;
  spacing: typeof spacing;
  isDark: boolean;
};

const lightTheme: Theme = { colors: lightColors, radius, spacing, isDark: false };
const darkTheme: Theme = { colors: darkColors, radius, spacing, isDark: true };

const ThemeContext = createContext<Theme>(lightTheme);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const scheme = useColorScheme();
  const value = useMemo(() => (scheme === 'dark' ? darkTheme : lightTheme), [scheme]);
  return React.createElement(ThemeContext.Provider, { value }, children);
}

export function useTheme(): Theme {
  return useContext(ThemeContext);
}
