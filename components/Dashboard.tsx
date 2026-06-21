import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, TextInput, Platform, Alert, ActivityIndicator, Modal } from 'react-native';
import { theme } from '../utils/theme';
import { parseFoodText } from '../utils/gemini';

interface DashboardProps {
  targetCalories: number;
  protein: number;
  fat: number;
  carbs: number;
  consumedCalories: number;
  consumedProtein: number;
  consumedFat: number;
  consumedCarbs: number;
  onQuickAdd: (type: 'breakfast' | 'lunch' | 'shake') => void;
  onCustomAdd: (cal: number, pro: number, fat: number, carb: number) => void;
  onAiAdd: (cal: number, pro: number, fat: number, carb: number) => void;
  onReset: () => void;
}

export default function Dashboard({ 
  targetCalories, protein, fat, carbs,
  consumedCalories, consumedProtein, consumedFat, consumedCarbs,
  onQuickAdd, onCustomAdd, onAiAdd, onReset 
}: DashboardProps) {

  const remainingCalories = targetCalories - consumedCalories;
  const fuelPercentage = Math.min(100, (consumedCalories / (targetCalories || 1)) * 100);

  // Состояния для FAB и модалок
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeConsole, setActiveConsole] = useState<'none' | 'ai' | 'manual'>('none');

  // Стейты ввода
  const [customCal, setCustomCal] = useState('');
  const [customPro, setCustomPro] = useState('');
  const [customFat, setCustomFat] = useState('');
  const [customCarb, setCustomCarb] = useState('');

  const [aiText, setAiText] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  // Рассчет миссий (наш таргет по белку — 100г)
  const isProteinMissionDone = consumedProtein >= 100;
  const isCalorieMissionDone = consumedCalories >= (targetCalories - 200) && consumedCalories <= (targetCalories + 200);

  const handleSubmittingCustom = () => {
    const cal = parseInt(customCal) || 0;
    const pro = parseInt(customPro) || 0;
    const f = parseInt(customFat) || 0;
    const carb = parseInt(customCarb) || 0;
    if (cal === 0 && pro === 0 && f === 0 && carb === 0) return;

    onCustomAdd(cal, pro, f, carb);
    setCustomCal(''); setCustomPro(''); setCustomFat(''); setCustomCarb('');
    setActiveConsole('none');
  };

  const handleAiParse = async () => {
    if (!aiText.trim()) return;
    setAiLoading(true);
    try {
      const result = await parseFoodText(aiText);
      onAiAdd(result.calories, result.protein, result.fat, result.carbs);
      Alert.alert('AI LOGGED', `+${result.calories} kcal added to terminal.`);
      setAiText('');
      setActiveConsole('none');
    } catch (e) {
      Alert.alert('AI_ERROR', 'Extraction failed.');
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        
        {/* ХЕДЕР — Сдержанный, убрали лишний статус */}
        <View style={styles.header}>
          <Text style={styles.title}>ENERGY CORE</Text>
          <Text style={styles.subtitle}>SYSTEM TIME: {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</Text>
        </View>

        {/* CALORIE HERO CARD — Теперь доминирует на экране */}
        <View style={styles.heroCard}>
          <Text style={styles.heroTag}>ENERGY TANK</Text>
          <View style={styles.heroRow}>
            <View>
              <Text style={styles.heroValue}>{consumedCalories}</Text>
              <Text style={styles.heroDivider}>/ {targetCalories} KCAL</Text>
            </View>
            <View style={styles.percentageCircle}>
              <Text style={styles.circleText}>{Math.round(fuelPercentage)}%</Text>
              <Text style={styles.circleSubtext}>LOADED</Text>
            </View>
          </View>
          <View style={styles.fuelGaugeContainer}>
            <View style={[styles.fuelGaugeFill, { width: `${fuelPercentage}%` }]} />
          </View>
          <Text style={styles.remainingText}>
            {remainingCalories < 0 ? `SURPLUS: ${Math.abs(remainingCalories)}` : `REMAINING: ${remainingCalories}`} KCAL
          </Text>
        </View>

        {/* DAILY MISSION SYSTEM — Мотивация и геймификация */}
        <Text style={styles.sectionHeader}>// DAILY_MISSIONS</Text>
        <View style={styles.missionCard}>
          <View style={styles.missionRow}>
            <Text style={[styles.missionCheck, isProteinMissionDone && styles.checkDone]}>
              {isProteinMissionDone ? '[✓]' : '[ ]'}
            </Text>
            <Text style={[styles.missionText, isProteinMissionDone && styles.textDone]}>PROTEIN TARGET &gt; 100G ({consumedProtein}g)</Text>
          </View>
          <View style={styles.missionRow}>
            <Text style={[styles.missionCheck, isCalorieMissionDone && styles.checkDone]}>
              {isCalorieMissionDone ? '[✓]' : '[ ]'}
            </Text>
            <Text style={[styles.missionText, isCalorieMissionDone && styles.textDone]}>STAY NEAR CALORIE CORE ({consumedCalories} kcal)</Text>
          </View>
        </View>

        {/* MACRO STATUS — Компактные бары */}
        <Text style={styles.sectionHeader}>// MACRO_STATUS</Text>
        <View style={styles.brutalSection}>
          <View style={styles.macroInfoRow}>
            <View style={styles.macroMiniBox}>
              <Text style={[styles.macroLabel, { color: theme.colors.protein }]}>PRO</Text>
              <Text style={styles.macroValue}>{consumedProtein}g / {protein}g</Text>
            </View>
            <View style={styles.macroMiniBox}>
              <Text style={[styles.macroLabel, { color: theme.colors.fat }]}>FAT</Text>
              <Text style={styles.macroValue}>{consumedFat}g / {fat}g</Text>
            </View>
            <View style={styles.macroMiniBox}>
              <Text style={[styles.macroLabel, { color: theme.colors.carbs }]}>CRB</Text>
              <Text style={styles.macroValue}>{consumedCarbs}g / {carbs}g</Text>
            </View>
          </View>
        </View>

        {/* QUICK FEED — Теперь в самом низу как вспомогательный лог */}
        <Text style={styles.sectionHeader}>// QUICK_FEED</Text>
        <View style={styles.actionGrid}>
          <TouchableOpacity style={styles.brutalButton} onPress={() => onQuickAdd('breakfast')}>
            <Text style={styles.buttonText}>+ BREAKFAST</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.brutalButton} onPress={() => onQuickAdd('lunch')}>
            <Text style={styles.buttonText}>+ ANIMAL LUNCH</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.brutalButton} onPress={() => onQuickAdd('shake')}>
            <Text style={styles.buttonText}>+ PRO SHAKE</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.clearButton} onPress={onReset}>
          <Text style={styles.clearButtonText}>WIPE DAILY LOGS [X]</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* FLOATING ACTION BUTTON (FAB) */}
      <TouchableOpacity style={styles.fab} onPress={() => setIsMenuOpen(true)}>
        <Text style={styles.fabText}>[+]</Text>
      </TouchableOpacity>

      {/* ОВЕРЛЕЙ УПРАВЛЕНИЯ (FAB MENU) */}
      <Modal visible={isMenuOpen} transparent animationType="fade" onRequestClose={() => setIsMenuOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.menuContainer}>
            {activeConsole === 'none' ? (
              <>
                <Text style={styles.menuTitle}>// INJECT_DATA_OPTIONS</Text>
                <TouchableOpacity style={styles.menuItem} onPress={() => setActiveConsole('ai')}>
                  <Text style={styles.menuItemText}>[1] AI COGNITIVE PARSER</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.menuItem} onPress={() => setActiveConsole('manual')}>
                  <Text style={styles.menuItemText}>[2] MANUAL INPUT CONSOLE</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.menuItem, { opacity: 0.5 }]}>
                  <Text style={styles.menuItemText}>[3] BARCODE SCANNER [OFFLINE]</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.closeMenuButton} onPress={() => setIsMenuOpen(false)}>
                  <Text style={styles.closeMenuText}>CLOSE TERMINAL [X]</Text>
                </TouchableOpacity>
              </>
            ) : activeConsole === 'ai' ? (
              <View style={{ width: '100%' }}>
                <Text style={styles.menuTitle}>// AI_COGNITIVE_ENGINE</Text>
                <TextInput
                  style={styles.aiInput}
                  placeholder="What did you eat? (e.g., '3 eggs and cottage cheese')"
                  placeholderTextColor="#555"
                  multiline
                  value={aiText}
                  onChangeText={setAiText}
                />
                <TouchableOpacity style={styles.executeBtn} onPress={handleAiParse} disabled={aiLoading}>
                  {aiLoading ? <ActivityIndicator color="#000" /> : <Text style={styles.executeBtnText}>EXECUTE_AI_PARSE [⚡]</Text>}
                </TouchableOpacity>
                <TouchableOpacity style={styles.backMenuBtn} onPress={() => setActiveConsole('none')}>
                  <Text style={styles.backMenuText}>&lt; BACK TO OPTIONS</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={{ width: '100%' }}>
                <Text style={styles.menuTitle}>// MANUAL_INPUT_MATRIX</Text>
                <View style={styles.manualRow}>
                  <TextInput style={styles.mInput} placeholder="KCAL" keyboardType="numeric" value={customCal} onChangeText={setCustomCal} />
                  <TextInput style={styles.mInput} placeholder="PRO" keyboardType="numeric" value={customPro} onChangeText={setCustomPro} />
                  <TextInput style={styles.mInput} placeholder="FAT" keyboardType="numeric" value={customFat} onChangeText={setCustomFat} />
                  <TextInput style={styles.mInput} placeholder="CARB" keyboardType="numeric" value={customCarb} onChangeText={setCustomCarb} />
                </View>
                <TouchableOpacity style={styles.executeBtn} onPress={handleSubmittingCustom}>
                  <Text style={styles.executeBtnText}>INJECT_MACROS [+=]</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.backMenuBtn} onPress={() => setActiveConsole('none')}>
                  <Text style={styles.backMenuText}>&lt; BACK TO OPTIONS</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 100, backgroundColor: theme.colors.background },
  header: { marginBottom: 20 },
  title: { fontSize: 26, fontWeight: '900', color: theme.colors.primary, letterSpacing: -0.5 },
  subtitle: { fontSize: 11, fontWeight: '700', color: theme.colors.textSecondary, marginTop: 2, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  
  // КАРТОЧКА ГЕРОЯ (Калории доминируют)
  heroCard: { backgroundColor: '#000000', padding: 20, borderWidth: 3, borderColor: '#000000', marginBottom: 20, ...theme.brutalshading },
  heroTag: { color: theme.colors.accent, fontSize: 10, fontWeight: '900', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', marginBottom: 8, letterSpacing: 1 },
  heroRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heroValue: { fontSize: 52, fontWeight: '900', color: '#FFFFFF', letterSpacing: -2 },
  heroDivider: { fontSize: 16, fontWeight: '800', color: '#666666', marginTop: -5, marginLeft: 2 },
  percentageCircle: { alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.accent, borderWidth: 2, borderColor: '#000', width: 75, height: 75, transform: [{ rotate: '-3deg' }] },
  circleText: { fontSize: 20, fontWeight: '900', color: '#000' },
  circleSubtext: { fontSize: 8, fontWeight: '900', color: '#000', marginTop: -2 },
  fuelGaugeContainer: { height: 8, backgroundColor: '#222222', marginTop: 15, borderWidth: 1, borderColor: '#444' },
  fuelGaugeFill: { height: '100%', backgroundColor: theme.colors.accent },
  remainingText: { color: '#888888', fontSize: 11, fontWeight: '800', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', marginTop: 10 },

  sectionHeader: { fontSize: 12, fontWeight: '900', color: '#000000', letterSpacing: 1, marginBottom: 8, marginTop: 10, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  
  // КАРТОЧКА МИССИЙ
  missionCard: { backgroundColor: '#FFFFFF', borderWidth: 3, borderColor: '#000000', padding: 16, marginBottom: 20, ...theme.brutalshading },
  missionRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  missionCheck: { fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: 14, fontWeight: '900', color: '#888', marginRight: 10 },
  checkDone: { color: '#000', fontWeight: '900' },
  missionText: { fontSize: 12, fontWeight: '700', color: '#444' },
  textDone: { textDecorationLine: 'line-through', color: '#888' },

  // МАКРОСЫ
  brutalSection: { backgroundColor: '#FFFFFF', borderWidth: 3, borderColor: '#000000', padding: 14, marginBottom: 20, ...theme.brutalshading },
  macroInfoRow: { flexDirection: 'row', justifyContent: 'space-between' },
  macroMiniBox: { flex: 1, alignItems: 'center' },
  macroLabel: { fontSize: 11, fontWeight: '900', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  macroValue: { fontSize: 13, fontWeight: '800', color: '#000', marginTop: 2 },

  actionGrid: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  brutalButton: { flex: 1, backgroundColor: '#FFFFFF', borderWidth: 2, borderColor: '#000000', padding: 12, alignItems: 'center' },
  buttonText: { fontSize: 10, fontWeight: '900', color: '#000000' },

  clearButton: { borderStyle: 'dashed', borderWidth: 2, borderColor: '#E63946', padding: 12, alignItems: 'center', marginTop: 10 },
  clearButtonText: { color: '#E63946', fontWeight: '900', fontSize: 12 },

  // FAB СТИЛИ
  fab: { position: 'absolute', bottom: 20, alignSelf: 'center', backgroundColor: '#000000', width: 64, height: 64, borderRadius: 0, borderWidth: 3, borderColor: theme.colors.accent, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 4, height: 4 }, shadowOpacity: 1, shadowRadius: 0, elevation: 5 },
  fabText: { color: theme.colors.accent, fontSize: 24, fontWeight: '900' },

  // МОДАЛЬНЫЙ ОВЕРЛЕЙ ТЕРМИНАЛА ВВОДА
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', padding: 20 },
  menuContainer: { backgroundColor: '#FFFFFF', borderWidth: 4, borderColor: '#000', padding: 20, alignItems: 'center' },
  menuTitle: { fontSize: 14, fontWeight: '900', color: '#000', marginBottom: 15, alignSelf: 'flex-start', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  menuItem: { width: '100%', backgroundColor: '#F5F5F5', borderWidth: 2, borderColor: '#000', padding: 15, marginBottom: 10 },
  menuItemText: { fontSize: 13, fontWeight: '800', color: '#000' },
  closeMenuButton: { marginTop: 10, padding: 10 },
  closeMenuText: { color: '#E63946', fontWeight: '900', fontSize: 12, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },

  // ЭЛЕМЕНТЫ ВНУТРИ МОДАЛКИ
  aiInput: { width: '100%', height: 100, backgroundColor: '#111', color: theme.colors.accent, padding: 12, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: 14, textAlignVertical: 'top', borderWidth: 2, borderColor: '#000' },
  executeBtn: { width: '100%', backgroundColor: theme.colors.accent, borderWidth: 2, borderColor: '#000', padding: 14, alignItems: 'center', marginTop: 12 },
  executeBtnText: { color: '#000', fontWeight: '900', fontSize: 13 },
  backMenuBtn: { marginTop: 15, alignSelf: 'center' },
  backMenuText: { fontSize: 11, fontWeight: '800', color: '#666' },

  manualRow: { flexDirection: 'row', gap: 6, width: '100%' },
  mInput: { flex: 1, backgroundColor: '#F5F5F5', borderWidth: 2, borderColor: '#000', padding: 10, textAlign: 'center', fontSize: 14, fontWeight: '800' }
});