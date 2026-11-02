import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../utils/theme';
import { FoodLogEntry, Meal } from '../utils/foodLogs';
import Card from './ui/Card';
import ProgressRing from './ui/ProgressRing';
import ProgressBar from './ui/ProgressBar';

interface TodayScreenProps {
  targetCalories: number;
  protein: number;
  fat: number;
  carbs: number;
  logs: FoodLogEntry[];
  onDeleteLog: (id: string) => void;
  onToggleFavorite: (log: FoodLogEntry) => void;
  waterMl: number;
  waterGoalMl: number;
  onAddWater: (ml: number) => void;
  onResetWater: () => void;
}

const MEAL_ORDER: { key: Meal; label: string }[] = [
  { key: 'breakfast', label: 'Breakfast' },
  { key: 'lunch', label: 'Lunch' },
  { key: 'dinner', label: 'Dinner' },
  { key: 'snack', label: 'Snack' },
];

export default function TodayScreen({
  targetCalories,
  protein,
  fat,
  carbs,
  logs,
  onDeleteLog,
  onToggleFavorite,
  waterMl,
  waterGoalMl,
  onAddWater,
  onResetWater,
}: TodayScreenProps) {
  const { colors, spacing } = useTheme();

  const consumedCalories = logs.reduce((sum, l) => sum + l.calories, 0);
  const consumedProtein = logs.reduce((sum, l) => sum + l.protein, 0);
  const consumedFat = logs.reduce((sum, l) => sum + l.fat, 0);
  const consumedCarbs = logs.reduce((sum, l) => sum + l.carbs, 0);
  const remaining = targetCalories - consumedCalories;

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={{ padding: spacing.lg, paddingBottom: 120 }}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.header, { color: colors.primaryText }]}>Today</Text>

      <Card style={styles.ringCard}>
        <ProgressRing value={consumedCalories} max={targetCalories}>
          <Text style={[styles.ringValue, { color: colors.primaryText }]}>{Math.max(0, remaining)}</Text>
          <Text style={[styles.ringLabel, { color: colors.secondaryText }]}>
            {remaining < 0 ? 'kcal over' : 'kcal left'}
          </Text>
        </ProgressRing>
        <Text style={[styles.consumedText, { color: colors.secondaryText }]}>
          {consumedCalories} of {targetCalories} kcal
        </Text>
      </Card>

      <Card>
        <MacroRow label="Protein" value={consumedProtein} max={protein} color={colors.protein} />
        <MacroRow label="Fat" value={consumedFat} max={fat} color={colors.fat} />
        <MacroRow label="Carbs" value={consumedCarbs} max={carbs} color={colors.carbs} last />
      </Card>

      <Card>
        <View style={styles.waterHeader}>
          <Text style={[styles.sectionTitle, { color: colors.primaryText, marginBottom: 0 }]}>Water</Text>
          <TouchableOpacity onPress={onResetWater}>
            <Text style={[styles.waterReset, { color: colors.secondaryText }]}>Reset</Text>
          </TouchableOpacity>
        </View>
        <Text style={[styles.waterAmount, { color: colors.secondaryText }]}>
          {waterMl} / {waterGoalMl} ml
        </Text>
        <ProgressBar value={waterMl} max={waterGoalMl} color={colors.carbs} />
        <View style={styles.waterButtonRow}>
          {[250, 500].map((amount) => (
            <TouchableOpacity
              key={amount}
              style={[styles.waterButton, { backgroundColor: colors.background }]}
              onPress={() => onAddWater(amount)}
            >
              <Text style={[styles.waterButtonText, { color: colors.primaryText }]}>+{amount}ml</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Card>

      <Card>
        <Text style={[styles.sectionTitle, { color: colors.primaryText }]}>Logged today</Text>
        {logs.length === 0 ? (
          <Text style={[styles.emptyText, { color: colors.secondaryText }]}>
            Nothing logged yet — tap the + button to add food.
          </Text>
        ) : (
          MEAL_ORDER.map(({ key, label }) => {
            const mealLogs = logs.filter((l) => l.meal === key);
            if (mealLogs.length === 0) return null;
            return (
              <View key={key} style={styles.mealGroup}>
                <Text style={[styles.mealLabel, { color: colors.secondaryText }]}>{label}</Text>
                {mealLogs.map((log) => (
                  <View key={log.id} style={[styles.logRow, { borderColor: colors.border }]}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.logName, { color: colors.primaryText }]}>{log.name}</Text>
                      <Text style={[styles.logMacros, { color: colors.secondaryText }]}>
                        {log.calories} kcal · {log.protein}p / {log.fat}f / {log.carbs}c
                      </Text>
                    </View>
                    <TouchableOpacity onPress={() => onToggleFavorite(log)} style={styles.iconButton}>
                      <Text style={{ color: log.is_favorite ? colors.accent : colors.secondaryText, fontSize: 16 }}>
                        {log.is_favorite ? '★' : '☆'}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => onDeleteLog(log.id)} style={styles.iconButton}>
                      <Text style={{ color: colors.danger, fontSize: 16 }}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            );
          })
        )}
      </Card>
    </ScrollView>
  );
}

function MacroRow({
  label,
  value,
  max,
  color,
  last,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
  last?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <View style={{ marginBottom: last ? 0 : 16 }}>
      <View style={styles.macroHeader}>
        <Text style={[styles.macroLabel, { color: colors.primaryText }]}>{label}</Text>
        <Text style={[styles.macroValue, { color: colors.secondaryText }]}>
          {value}g / {max}g
        </Text>
      </View>
      <ProgressBar value={value} max={max} color={color} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    fontSize: 28,
    fontFamily: 'Inter_700Bold',
    marginBottom: 16,
  },
  ringCard: {
    alignItems: 'center',
    paddingVertical: 28,
  },
  ringValue: {
    fontSize: 32,
    fontFamily: 'Inter_700Bold',
  },
  ringLabel: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
  },
  consumedText: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
  macroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  macroLabel: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
  },
  macroValue: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
  },
  waterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  waterReset: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
  waterAmount: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    marginBottom: 8,
  },
  waterButtonRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  waterButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  waterButtonText: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
  },
  mealGroup: {
    marginBottom: 14,
  },
  mealLabel: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  logRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  logName: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
  },
  logMacros: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
  },
  iconButton: {
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
});
