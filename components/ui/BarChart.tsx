import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import { useTheme } from '../../utils/theme';

export interface BarChartDatum {
  label: string;
  value: number;
}

interface BarChartProps {
  data: BarChartDatum[];
  height?: number;
  color?: string;
  maxValue?: number;
}

export default function BarChart({ data, height = 140, color, maxValue }: BarChartProps) {
  const { colors } = useTheme();
  const barColor = color ?? colors.accent;
  const max = maxValue ?? Math.max(1, ...data.map((d) => d.value));

  const barWidth = 22;
  const gap = 14;
  const chartWidth = data.length * (barWidth + gap);

  return (
    <View>
      <Svg width={chartWidth} height={height}>
        {data.map((d, i) => {
          const barHeight = max > 0 ? (d.value / max) * (height - 4) : 0;
          const x = i * (barWidth + gap);
          const y = height - barHeight;
          return (
            <Rect
              key={d.label}
              x={x}
              y={y}
              width={barWidth}
              height={Math.max(2, barHeight)}
              rx={6}
              fill={barColor}
              opacity={d.value > 0 ? 1 : 0.2}
            />
          );
        })}
      </Svg>
      <View style={[styles.labelRow, { width: chartWidth }]}>
        {data.map((d) => (
          <Text key={d.label} style={[styles.label, { color: colors.secondaryText, width: barWidth + gap }]}>
            {d.label}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  labelRow: {
    flexDirection: 'row',
    marginTop: 6,
  },
  label: {
    fontSize: 10,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
  },
});
