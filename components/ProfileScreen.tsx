import React from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useTheme } from '../utils/theme';
import { Sex, ActivityLevel, Goal, activityFactors, activityLabels } from '../utils/nutrition';
import Card from './ui/Card';

interface ProfileScreenProps {
  targetCalories: number;
  age: string;
  sex: Sex;
  height: string;
  weight: string;
  activity: ActivityLevel;
  goal: Goal;
  onChangeAge: (v: string) => void;
  onChangeHeight: (v: string) => void;
  onChangeWeight: (v: string) => void;
  onChangeSex: (v: Sex) => void;
  onChangeActivity: (v: ActivityLevel) => void;
  onChangeGoal: (v: Goal) => void;
  waterGoalMl: string;
  onChangeWaterGoal: (v: string) => void;
  onWipeLogs: () => void;
  onSignOut: () => void;
}

const GOAL_LABELS: { key: Goal; label: string }[] = [
  { key: 'lose', label: 'Lose weight' },
  { key: 'maintain', label: 'Maintain weight' },
  { key: 'gain', label: 'Gain weight' },
];

export default function ProfileScreen({
  targetCalories,
  age,
  sex,
  height,
  weight,
  activity,
  goal,
  onChangeAge,
  onChangeHeight,
  onChangeWeight,
  onChangeSex,
  onChangeActivity,
  onChangeGoal,
  waterGoalMl,
  onChangeWaterGoal,
  onWipeLogs,
  onSignOut,
}: ProfileScreenProps) {
  const { colors, radius, spacing } = useTheme();

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={{ padding: spacing.lg, paddingBottom: 120 }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={[styles.header, { color: colors.primaryText }]}>Profile</Text>

      <Card style={styles.targetCard}>
        <Text style={[styles.targetValue, { color: colors.primaryText }]}>{targetCalories}</Text>
        <Text style={[styles.targetLabel, { color: colors.secondaryText }]}>kcal daily target</Text>
      </Card>

      <Card>
        <Text style={[styles.sectionTitle, { color: colors.primaryText }]}>About you</Text>

        <View style={styles.fieldRow}>
          <Field label="Age" value={age} onChangeText={onChangeAge} />
          <Field label="Height (cm)" value={height} onChangeText={onChangeHeight} />
          <Field label="Weight (kg)" value={weight} onChangeText={onChangeWeight} />
        </View>

        <View style={[styles.pillRow, { marginTop: spacing.md }]}>
          {(['male', 'female'] as Sex[]).map((s) => (
            <Pill key={s} label={s === 'male' ? 'Male' : 'Female'} active={sex === s} onPress={() => onChangeSex(s)} />
          ))}
        </View>
      </Card>

      <Card>
        <Text style={[styles.sectionTitle, { color: colors.primaryText }]}>Activity level</Text>
        {(Object.keys(activityFactors) as ActivityLevel[]).map((level) => (
          <Row
            key={level}
            label={activityLabels[level].label}
            active={activity === level}
            onPress={() => onChangeActivity(level)}
          />
        ))}
      </Card>

      <Card>
        <Text style={[styles.sectionTitle, { color: colors.primaryText }]}>Goal</Text>
        {GOAL_LABELS.map((g) => (
          <Row key={g.key} label={g.label} active={goal === g.key} onPress={() => onChangeGoal(g.key)} />
        ))}
      </Card>

      <Card>
        <Text style={[styles.sectionTitle, { color: colors.primaryText }]}>Water goal</Text>
        <View style={styles.fieldRow}>
          <Field label="Daily goal (ml)" value={waterGoalMl} onChangeText={onChangeWaterGoal} maxLength={5} />
        </View>
      </Card>

      <Card>
        <Text style={[styles.sectionTitle, { color: colors.primaryText }]}>Settings</Text>
        <TouchableOpacity style={styles.settingsRow} onPress={onWipeLogs}>
          <Text style={[styles.settingsRowText, { color: colors.danger }]}>Clear today's log</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.settingsRow} onPress={onSignOut}>
          <Text style={[styles.settingsRowText, { color: colors.secondaryText }]}>Sign out</Text>
        </TouchableOpacity>
      </Card>
    </ScrollView>
  );
}

function Field({
  label,
  value,
  onChangeText,
  maxLength = 3,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  maxLength?: number;
}) {
  const { colors, radius } = useTheme();
  return (
    <View style={{ flex: 1 }}>
      <Text style={[styles.fieldLabel, { color: colors.secondaryText }]}>{label}</Text>
      <TextInput
        style={[styles.fieldInput, { backgroundColor: colors.background, color: colors.primaryText, borderRadius: radius.sm }]}
        keyboardType="numeric"
        value={value}
        onChangeText={onChangeText}
        maxLength={maxLength}
      />
    </View>
  );
}

function Pill({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const { colors, radius } = useTheme();
  return (
    <TouchableOpacity
      style={[
        styles.pill,
        { backgroundColor: active ? colors.accent : colors.background, borderRadius: radius.sm },
      ]}
      onPress={onPress}
    >
      <Text style={[styles.pillText, { color: active ? '#FFFFFF' : colors.primaryText }]}>{label}</Text>
    </TouchableOpacity>
  );
}

function Row({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const { colors, radius } = useTheme();
  return (
    <TouchableOpacity
      style={[
        styles.row,
        { backgroundColor: active ? colors.accent : colors.background, borderRadius: radius.sm },
      ]}
      onPress={onPress}
    >
      <Text style={[styles.rowText, { color: active ? '#FFFFFF' : colors.primaryText }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  header: {
    fontSize: 28,
    fontFamily: 'Inter_700Bold',
    marginBottom: 16,
  },
  targetCard: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  targetValue: {
    fontSize: 28,
    fontFamily: 'Inter_700Bold',
  },
  targetLabel: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 12,
  },
  fieldRow: {
    flexDirection: 'row',
    gap: 10,
  },
  fieldLabel: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    marginBottom: 6,
  },
  fieldInput: {
    padding: 10,
    textAlign: 'center',
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
  },
  pillRow: {
    flexDirection: 'row',
    gap: 8,
  },
  pill: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
  },
  pillText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
  },
  row: {
    padding: 14,
    marginBottom: 8,
  },
  rowText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
  },
  settingsRow: {
    paddingVertical: 12,
  },
  settingsRowText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
  },
});
