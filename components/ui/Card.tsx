import React from 'react';
import { View, ViewProps, StyleSheet } from 'react-native';
import { useTheme } from '../../utils/theme';

interface CardProps extends ViewProps {
  children: React.ReactNode;
}

export default function Card({ style, children, ...rest }: CardProps) {
  const { colors, radius, spacing } = useTheme();
  return (
    <View
      style={[
        styles.base,
        { backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.lg },
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    marginBottom: 16,
  },
});
