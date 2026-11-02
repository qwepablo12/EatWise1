import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useTheme } from '../utils/theme';
import { Sex, ActivityLevel, Goal, ProfileData, activityFactors, activityLabels } from '../utils/nutrition';

interface OnboardingProps {
  onComplete: (profile: ProfileData) => void;
}

type Step = 'sex' | 'age' | 'height' | 'weight' | 'activity' | 'goal';

const STEPS: Step[] = ['sex', 'age', 'height', 'weight', 'activity', 'goal'];

export default function Onboarding({ onComplete }: OnboardingProps) {
  const { colors, radius, spacing } = useTheme();
  const [stepIndex, setStepIndex] = useState(0);

  const [sex, setSex] = useState<Sex>('male');
  const [age, setAge] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [activity, setActivity] = useState<ActivityLevel>('moderate');
  const [goal, setGoal] = useState<Goal>('maintain');

  const step = STEPS[stepIndex];
  const isLastStep = stepIndex === STEPS.length - 1;

  const canAdvance = () => {
    if (step === 'age') return age.trim().length > 0 && Number(age) > 0;
    if (step === 'height') return height.trim().length > 0 && Number(height) > 0;
    if (step === 'weight') return weight.trim().length > 0 && Number(weight) > 0;
    return true;
  };

  const goNext = () => {
    if (!canAdvance()) return;
    if (isLastStep) {
      onComplete({ age, sex, height, weight, activity, goal });
    } else {
      setStepIndex((i) => i + 1);
    }
  };

  const goBack = () => {
    if (stepIndex > 0) setStepIndex((i) => i - 1);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.container, { padding: spacing.lg }]}>
        <View style={styles.progressRow}>
          {STEPS.map((s, i) => (
            <View
              key={s}
              style={[
                styles.progressDot,
                { backgroundColor: i <= stepIndex ? colors.accent : colors.border, borderRadius: radius.sm },
              ]}
            />
          ))}
        </View>

        <View style={styles.content}>
          {step === 'sex' && (
            <StepShell title="What's your sex?" subtitle="Used to estimate your energy needs.">
              <View style={styles.optionRow}>
                {(['male', 'female'] as Sex[]).map((s) => (
                  <OptionCard key={s} label={s === 'male' ? 'Male' : 'Female'} active={sex === s} onPress={() => setSex(s)} />
                ))}
              </View>
            </StepShell>
          )}

          {step === 'age' && (
            <StepShell title="How old are you?" subtitle="">
              <NumberField value={age} onChangeText={setAge} suffix="years" />
            </StepShell>
          )}

          {step === 'height' && (
            <StepShell title="What's your height?" subtitle="">
              <NumberField value={height} onChangeText={setHeight} suffix="cm" />
            </StepShell>
          )}

          {step === 'weight' && (
            <StepShell title="What's your weight?" subtitle="">
              <NumberField value={weight} onChangeText={setWeight} suffix="kg" />
            </StepShell>
          )}

          {step === 'activity' && (
            <StepShell title="How active are you?" subtitle="">
              <View style={{ width: '100%' }}>
                {(Object.keys(activityFactors) as ActivityLevel[]).map((level) => (
                  <OptionCard
                    key={level}
                    label={activityLabels[level].label}
                    description={activityLabels[level].desc}
                    active={activity === level}
                    onPress={() => setActivity(level)}
                    fullWidth
                  />
                ))}
              </View>
            </StepShell>
          )}

          {step === 'goal' && (
            <StepShell title="What's your goal?" subtitle="">
              <View style={{ width: '100%' }}>
                {([
                  { key: 'lose', label: 'Lose weight' },
                  { key: 'maintain', label: 'Maintain weight' },
                  { key: 'gain', label: 'Gain weight' },
                ] as { key: Goal; label: string }[]).map((g) => (
                  <OptionCard key={g.key} label={g.label} active={goal === g.key} onPress={() => setGoal(g.key)} fullWidth />
                ))}
              </View>
            </StepShell>
          )}
        </View>

        <View style={styles.footer}>
          {stepIndex > 0 && (
            <TouchableOpacity style={styles.backButton} onPress={goBack}>
              <Text style={{ color: colors.secondaryText }}>Back</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[
              styles.nextButton,
              { backgroundColor: canAdvance() ? colors.accent : colors.border, borderRadius: radius.md },
            ]}
            onPress={goNext}
            disabled={!canAdvance()}
          >
            <Text style={styles.nextButtonText}>{isLastStep ? 'Get started' : 'Continue'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

function StepShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={{ width: '100%' }}>
      <Text style={[styles.title, { color: colors.primaryText }]}>{title}</Text>
      {!!subtitle && <Text style={[styles.subtitle, { color: colors.secondaryText }]}>{subtitle}</Text>}
      {children}
    </View>
  );
}

function OptionCard({
  label,
  description,
  active,
  onPress,
  fullWidth,
}: {
  label: string;
  description?: string;
  active: boolean;
  onPress: () => void;
  fullWidth?: boolean;
}) {
  const { colors, radius } = useTheme();
  return (
    <TouchableOpacity
      style={[
        styles.optionCard,
        fullWidth && styles.optionCardFull,
        {
          backgroundColor: active ? colors.accent : colors.card,
          borderRadius: radius.md,
          borderColor: colors.border,
        },
      ]}
      onPress={onPress}
    >
      <Text style={[styles.optionLabel, { color: active ? '#FFFFFF' : colors.primaryText }]}>{label}</Text>
      {!!description && (
        <Text style={[styles.optionDescription, { color: active ? '#FFFFFF' : colors.secondaryText }]}>
          {description}
        </Text>
      )}
    </TouchableOpacity>
  );
}

function NumberField({ value, onChangeText, suffix }: { value: string; onChangeText: (v: string) => void; suffix: string }) {
  const { colors, radius } = useTheme();
  return (
    <View style={styles.numberFieldRow}>
      <TextInput
        style={[styles.numberInput, { color: colors.primaryText, borderColor: colors.border, borderRadius: radius.md }]}
        keyboardType="numeric"
        value={value}
        onChangeText={onChangeText}
        autoFocus
        maxLength={3}
      />
      <Text style={[styles.numberSuffix, { color: colors.secondaryText }]}>{suffix}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
  progressRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 8,
  },
  progressDot: {
    flex: 1,
    height: 4,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontFamily: 'Inter_700Bold',
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    marginBottom: 24,
  },
  optionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
    width: '100%',
  },
  optionCard: {
    flex: 1,
    padding: 18,
    alignItems: 'center',
    borderWidth: 1,
  },
  optionCardFull: {
    flex: 0,
    width: '100%',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  optionLabel: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
  },
  optionDescription: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
  },
  numberFieldRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 16,
    gap: 8,
  },
  numberInput: {
    fontSize: 48,
    fontFamily: 'Inter_700Bold',
    borderBottomWidth: 2,
    minWidth: 100,
    textAlign: 'center',
    paddingVertical: 4,
  },
  numberSuffix: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
  },
  footer: {
    gap: 10,
  },
  backButton: {
    alignItems: 'center',
    padding: 10,
  },
  nextButton: {
    padding: 16,
    alignItems: 'center',
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
  },
});
