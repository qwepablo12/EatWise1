import React from 'react';
import { View } from 'react-native';
import { useTheme } from '../../utils/theme';

interface ProgressBarProps {
  value: number;
  max: number;
  color?: string;
  trackColor?: string;
  height?: number;
}

export default function ProgressBar({ value, max, color, trackColor, height = 6 }: ProgressBarProps) {
  const { colors, radius } = useTheme();
  const fillColor = color ?? colors.accent;
  const bgColor = trackColor ?? colors.border;
  const pct = max > 0 ? Math.min(1, Math.max(0, value / max)) : 0;

  return (
    <View
      style={{
        height,
        borderRadius: height / 2,
        backgroundColor: bgColor,
        overflow: 'hidden',
        width: '100%',
      }}
    >
      <View
        style={{
          height: '100%',
          width: `${pct * 100}%`,
          borderRadius: height / 2,
          backgroundColor: fillColor,
        }}
      />
    </View>
  );
}
