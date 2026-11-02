import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useTheme } from '../utils/theme';
import { fetchLogsInRange } from '../utils/foodLogs';
import { fetchWeightLogs, logWeightForDate } from '../utils/weightLogs';
import Card from './ui/Card';
import BarChart, { BarChartDatum } from './ui/BarChart';
import LineChart, { LineChartDatum } from './ui/LineChart';

interface ProgressScreenProps {
  userId: string;
  onWeightLogged: (weightKg: number) => void;
}

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function dateString(d: Date) {
  return d.toISOString().split('T')[0];
}

export default function ProgressScreen({ userId, onWeightLogged }: ProgressScreenProps) {
  const { colors, radius, spacing } = useTheme();
  const [weeklyCalories, setWeeklyCalories] = useState<BarChartDatum[]>([]);
  const [weightTrend, setWeightTrend] = useState<LineChartDatum[]>([]);
  const [weightInput, setWeightInput] = useState('');
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const today = new Date();
      const start = new Date(today);
      start.setDate(start.getDate() - 6);

      const logs = await fetchLogsInRange(userId, dateString(start), dateString(today));
      const totalsByDate = new Map<string, number>();
      for (const log of logs) {
        totalsByDate.set(log.date, (totalsByDate.get(log.date) ?? 0) + log.calories);
      }

      const days: BarChartDatum[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const key = dateString(d);
        days.push({ label: DAY_LABELS[d.getDay()], value: totalsByDate.get(key) ?? 0 });
      }
      setWeeklyCalories(days);

      const weightLogs = await fetchWeightLogs(userId, 30);
      setWeightTrend(
        weightLogs.map((w) => ({
          label: w.date.slice(5),
          value: w.weight_kg,
        }))
      );
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleLogWeight = async () => {
    const value = parseFloat(weightInput);
    if (!value || value <= 0) return;
    const today = dateString(new Date());
    await logWeightForDate(userId, today, value);
    onWeightLogged(value);
    setWeightInput('');
    loadData();
  };

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={{ padding: spacing.lg, paddingBottom: 120 }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={[styles.header, { color: colors.primaryText }]}>Progress</Text>

      <Card>
        <Text style={[styles.sectionTitle, { color: colors.primaryText }]}>This week's calories</Text>
        {!loading && <BarChart data={weeklyCalories} />}
      </Card>

      <Card>
        <Text style={[styles.sectionTitle, { color: colors.primaryText }]}>Weight trend</Text>
        {!loading && <LineChart data={weightTrend} />}
      </Card>

      <Card>
        <Text style={[styles.sectionTitle, { color: colors.primaryText }]}>Log today's weight</Text>
        <View style={styles.weightRow}>
          <TextInput
            style={[styles.weightInput, { backgroundColor: colors.background, color: colors.primaryText, borderRadius: radius.sm }]}
            keyboardType="numeric"
            placeholder="kg"
            placeholderTextColor={colors.secondaryText}
            value={weightInput}
            onChangeText={setWeightInput}
          />
          <TouchableOpacity
            style={[styles.logButton, { backgroundColor: colors.accent, borderRadius: radius.sm }]}
            onPress={handleLogWeight}
          >
            <Text style={styles.logButtonText}>Log</Text>
          </TouchableOpacity>
        </View>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: {
    fontSize: 28,
    fontFamily: 'Inter_700Bold',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 12,
  },
  weightRow: {
    flexDirection: 'row',
    gap: 8,
  },
  weightInput: {
    flex: 1,
    padding: 12,
    textAlign: 'center',
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
  },
  logButton: {
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logButtonText: {
    color: '#FFFFFF',
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
  },
});
