import React from 'react';
import { StyleSheet, Text, View, Platform } from 'react-native';
import { theme } from '../utils/theme';

interface CaloriesCardProps {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
}

export default function CaloriesCard({ calories, protein, fat, carbs }: CaloriesCardProps) {
  return (
    <View style={styles.brutalCard}>
      <Text style={styles.cardTag}>// TARGET_LIMITS</Text>
      
      <View style={styles.mainRow}>
        <Text style={styles.calValue}>{calories}</Text>
        <Text style={styles.calLabel}>kcal / day</Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.macroGrid}>
        <View style={[styles.macroItem, { borderColor: theme.colors.protein }]}>
          <Text style={styles.macroValue}>{protein}g</Text>
          <Text style={styles.macroLabel}>PROTEIN</Text>
        </View>

        <View style={[styles.macroItem, { borderColor: theme.colors.fat }]}>
          <Text style={styles.macroValue}>{fat}g</Text>
          <Text style={styles.macroLabel}>LIPIDS</Text>
        </View>

        <View style={[styles.macroItem, { borderColor: theme.colors.carbs }]}>
          <Text style={styles.macroValue}>{carbs}g</Text>
          <Text style={styles.macroLabel}>CARBS</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  brutalCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 3,
    borderColor: '#000000',
    padding: 16,
    marginBottom: 20,
    ...theme.brutalshading,
  },
  cardTag: {
    fontSize: 11,
    fontWeight: '900',
    color: '#000000',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginBottom: 10,
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  calValue: {
    fontSize: 42,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: -1,
  },
  calLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#555555',
    marginLeft: 8,
  },
  divider: {
    height: 2,
    backgroundColor: '#000000',
    marginBottom: 14,
  },
  macroGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  macroItem: {
    flex: 1,
    backgroundColor: '#F9F8F6',
    borderLeftWidth: 4, 
    borderWidth: 1,
    borderColor: '#000000',
    padding: 10,
  },
  macroValue: {
    fontSize: 16,
    fontWeight: '900',
    color: '#000000',
  },
  macroLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#777777',
    marginTop: 2,
  },
});
