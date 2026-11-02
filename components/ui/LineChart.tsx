import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Polyline, Circle } from 'react-native-svg';
import { useTheme } from '../../utils/theme';

export interface LineChartDatum {
  label: string;
  value: number;
}

interface LineChartProps {
  data: LineChartDatum[];
  width?: number;
  height?: number;
  color?: string;
}

export default function LineChart({ data, width = 300, height = 140, color }: LineChartProps) {
  const { colors } = useTheme();
  const lineColor = color ?? colors.accent;

  if (data.length === 0) {
    return (
      <View style={{ height, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: colors.secondaryText, fontFamily: 'Inter_400Regular', fontSize: 13 }}>
          No weight logged yet.
        </Text>
      </View>
    );
  }

  const values = data.map((d) => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const padding = 10;

  const points = data.map((d, i) => {
    const x = data.length > 1 ? (i / (data.length - 1)) * (width - padding * 2) + padding : width / 2;
    const y = height - padding - ((d.value - min) / range) * (height - padding * 2);
    return { x, y };
  });

  const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(' ');

  return (
    <View>
      <Svg width={width} height={height}>
        <Polyline points={polylinePoints} fill="none" stroke={lineColor} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
        {points.map((p, i) => (
          <Circle key={i} cx={p.x} cy={p.y} r={4} fill={lineColor} />
        ))}
      </Svg>
      <View style={styles.labelRow}>
        <Text style={[styles.label, { color: colors.secondaryText }]}>{data[0].label}</Text>
        <Text style={[styles.label, { color: colors.secondaryText }]}>{data[data.length - 1].label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  label: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
  },
});
