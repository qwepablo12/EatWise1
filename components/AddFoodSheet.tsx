import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Alert,
  StyleSheet,
  FlatList,
} from 'react-native';
import { useTheme } from '../utils/theme';
import { parseFoodText } from '../utils/gemini';
import { searchProducts, FoodProduct } from '../utils/openFoodFacts';
import { fetchRecent, fetchFavorites, Meal, NewFoodLog, FoodLogEntry, suggestMealForNow } from '../utils/foodLogs';
import BarcodeScanner from './BarcodeScanner';

interface AddFoodSheetProps {
  visible: boolean;
  userId: string | null;
  onClose: () => void;
  onAdd: (entry: NewFoodLog) => void;
}

type Mode = 'options' | 'ai' | 'manual' | 'search' | 'recent' | 'favorites' | 'scan';

const MEAL_OPTIONS: { key: Meal; label: string }[] = [
  { key: 'breakfast', label: 'Breakfast' },
  { key: 'lunch', label: 'Lunch' },
  { key: 'dinner', label: 'Dinner' },
  { key: 'snack', label: 'Snack' },
];

export default function AddFoodSheet({ visible, userId, onClose, onAdd }: AddFoodSheetProps) {
  const { colors, radius, spacing } = useTheme();
  const [mode, setMode] = useState<Mode>('options');
  const [meal, setMeal] = useState<Meal>(suggestMealForNow());

  const [aiText, setAiText] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  const [cal, setCal] = useState('');
  const [pro, setPro] = useState('');
  const [fat, setFat] = useState('');
  const [carb, setCarb] = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<FoodProduct[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  const [recent, setRecent] = useState<FoodLogEntry[]>([]);
  const [favorites, setFavorites] = useState<FoodLogEntry[]>([]);
  const [listLoading, setListLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      setMode('options');
      setMeal(suggestMealForNow());
    }
  }, [visible]);

  useEffect(() => {
    if (mode === 'recent' && userId) {
      setListLoading(true);
      fetchRecent(userId).then((r) => { setRecent(r); setListLoading(false); });
    }
    if (mode === 'favorites' && userId) {
      setListLoading(true);
      fetchFavorites(userId).then((f) => { setFavorites(f); setListLoading(false); });
    }
  }, [mode, userId]);

  const resetAndClose = () => {
    setMode('options');
    setAiText('');
    setCal(''); setPro(''); setFat(''); setCarb('');
    setSearchQuery(''); setSearchResults([]);
    onClose();
  };

  const addEntry = (name: string, calories: number, protein: number, fat: number, carbs: number, source: NewFoodLog['source']) => {
    onAdd({ name, calories, protein, fat, carbs, meal, source });
    resetAndClose();
  };

  const handleAiParse = async () => {
    if (!aiText.trim()) return;
    setAiLoading(true);
    try {
      const result = await parseFoodText(aiText);
      addEntry(aiText.trim().slice(0, 60), result.calories, result.protein, result.fat, result.carbs, 'ai');
    } catch (e) {
      Alert.alert('Couldn’t read that', 'Try describing the food a bit differently.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleManualAdd = () => {
    const c = parseInt(cal) || 0;
    const p = parseInt(pro) || 0;
    const f = parseInt(fat) || 0;
    const cb = parseInt(carb) || 0;
    if (c === 0 && p === 0 && f === 0 && cb === 0) return;
    addEntry('Manual entry', c, p, f, cb, 'manual');
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearchLoading(true);
    try {
      const results = await searchProducts(searchQuery);
      setSearchResults(results);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleBarcodeFound = (product: FoodProduct) => {
    addEntry(product.name, product.calories, product.protein, product.fat, product.carbs, 'barcode');
  };

  return (
    <>
      <Modal visible={visible && mode !== 'scan'} transparent animationType="slide" onRequestClose={resetAndClose}>
        <View style={styles.overlay}>
          <View style={[styles.sheet, { backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.lg }]}>
            {mode !== 'options' && (
              <View style={styles.mealRow}>
                {MEAL_OPTIONS.map((m) => (
                  <TouchableOpacity
                    key={m.key}
                    style={[
                      styles.mealPill,
                      { backgroundColor: meal === m.key ? colors.accent : colors.background, borderRadius: radius.sm },
                    ]}
                    onPress={() => setMeal(m.key)}
                  >
                    <Text style={[styles.mealPillText, { color: meal === m.key ? '#FFFFFF' : colors.primaryText }]}>
                      {m.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {mode === 'options' && (
              <>
                <Text style={[styles.title, { color: colors.primaryText }]}>Add food</Text>
                <OptionRow label="Recent" onPress={() => setMode('recent')} />
                <OptionRow label="Favorites" onPress={() => setMode('favorites')} />
                <OptionRow label="Describe what you ate" onPress={() => setMode('ai')} />
                <OptionRow label="Enter manually" onPress={() => setMode('manual')} />
                <OptionRow label="Search for a product" onPress={() => setMode('search')} />
                <OptionRow label="Scan a barcode" onPress={() => setMode('scan')} />
                <TouchableOpacity style={styles.cancel} onPress={resetAndClose}>
                  <Text style={{ color: colors.secondaryText }}>Cancel</Text>
                </TouchableOpacity>
              </>
            )}

            {mode === 'ai' && (
              <>
                <Text style={[styles.title, { color: colors.primaryText }]}>What did you eat?</Text>
                <TextInput
                  style={[styles.textArea, { backgroundColor: colors.background, color: colors.primaryText, borderRadius: radius.md }]}
                  placeholder="e.g. 3 eggs and a slice of toast"
                  placeholderTextColor={colors.secondaryText}
                  multiline
                  value={aiText}
                  onChangeText={setAiText}
                />
                <PrimaryButton label="Add" loading={aiLoading} onPress={handleAiParse} />
                <BackButton onPress={() => setMode('options')} />
              </>
            )}

            {mode === 'manual' && (
              <>
                <Text style={[styles.title, { color: colors.primaryText }]}>Enter manually</Text>
                <View style={styles.manualRow}>
                  <ManualInput label="kcal" value={cal} onChangeText={setCal} />
                  <ManualInput label="protein" value={pro} onChangeText={setPro} />
                  <ManualInput label="fat" value={fat} onChangeText={setFat} />
                  <ManualInput label="carbs" value={carb} onChangeText={setCarb} />
                </View>
                <PrimaryButton label="Add" onPress={handleManualAdd} />
                <BackButton onPress={() => setMode('options')} />
              </>
            )}

            {mode === 'search' && (
              <>
                <Text style={[styles.title, { color: colors.primaryText }]}>Search products</Text>
                <View style={styles.searchRow}>
                  <TextInput
                    style={[styles.searchInput, { backgroundColor: colors.background, color: colors.primaryText, borderRadius: radius.md }]}
                    placeholder="e.g. greek yogurt"
                    placeholderTextColor={colors.secondaryText}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    onSubmitEditing={handleSearch}
                    returnKeyType="search"
                  />
                  <TouchableOpacity style={[styles.searchButton, { backgroundColor: colors.accent, borderRadius: radius.md }]} onPress={handleSearch}>
                    {searchLoading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.searchButtonText}>Go</Text>}
                  </TouchableOpacity>
                </View>
                <FlatList
                  data={searchResults}
                  keyExtractor={(item, idx) => `${item.name}-${idx}`}
                  style={{ maxHeight: 260 }}
                  renderItem={({ item }) => (
                    <ListRow
                      title={item.name}
                      subtitle={`${item.calories} kcal · ${item.protein}p / ${item.fat}f / ${item.carbs}c`}
                      onPress={() => addEntry(item.name, item.calories, item.protein, item.fat, item.carbs, 'search')}
                    />
                  )}
                  ListEmptyComponent={
                    !searchLoading ? (
                      <Text style={[styles.emptyText, { color: colors.secondaryText }]}>Search for a product to see results.</Text>
                    ) : null
                  }
                />
                <BackButton onPress={() => setMode('options')} />
              </>
            )}

            {(mode === 'recent' || mode === 'favorites') && (
              <>
                <Text style={[styles.title, { color: colors.primaryText }]}>{mode === 'recent' ? 'Recent' : 'Favorites'}</Text>
                {listLoading ? (
                  <ActivityIndicator color={colors.accent} />
                ) : (
                  <FlatList
                    data={mode === 'recent' ? recent : favorites}
                    keyExtractor={(item) => item.id}
                    style={{ maxHeight: 280 }}
                    renderItem={({ item }) => (
                      <ListRow
                        title={item.name}
                        subtitle={`${item.calories} kcal · ${item.protein}p / ${item.fat}f / ${item.carbs}c`}
                        onPress={() =>
                          addEntry(item.name, item.calories, item.protein, item.fat, item.carbs, mode === 'favorites' ? 'favorite' : 'manual')
                        }
                      />
                    )}
                    ListEmptyComponent={
                      <Text style={[styles.emptyText, { color: colors.secondaryText }]}>
                        {mode === 'recent' ? 'Nothing logged yet.' : 'Mark items as favorites to see them here.'}
                      </Text>
                    }
                  />
                )}
                <BackButton onPress={() => setMode('options')} />
              </>
            )}
          </View>
        </View>
      </Modal>

      <BarcodeScanner
        visible={visible && mode === 'scan'}
        onClose={() => setMode('options')}
        onFound={handleBarcodeFound}
      />
    </>
  );
}

function OptionRow({ label, onPress }: { label: string; onPress: () => void }) {
  const { colors, radius } = useTheme();
  return (
    <TouchableOpacity
      style={[styles.optionRow, { backgroundColor: colors.background, borderRadius: radius.md }]}
      onPress={onPress}
    >
      <Text style={[styles.optionText, { color: colors.primaryText }]}>{label}</Text>
    </TouchableOpacity>
  );
}

function ListRow({ title, subtitle, onPress }: { title: string; subtitle: string; onPress: () => void }) {
  const { colors, radius } = useTheme();
  return (
    <TouchableOpacity
      style={[styles.listRow, { backgroundColor: colors.background, borderRadius: radius.md }]}
      onPress={onPress}
    >
      <Text style={[styles.listRowTitle, { color: colors.primaryText }]}>{title}</Text>
      <Text style={[styles.listRowSubtitle, { color: colors.secondaryText }]}>{subtitle}</Text>
    </TouchableOpacity>
  );
}

function PrimaryButton({ label, onPress, loading }: { label: string; onPress: () => void; loading?: boolean }) {
  const { colors, radius } = useTheme();
  return (
    <TouchableOpacity
      style={[styles.primaryButton, { backgroundColor: colors.accent, borderRadius: radius.md }]}
      onPress={onPress}
      disabled={loading}
    >
      {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryButtonText}>{label}</Text>}
    </TouchableOpacity>
  );
}

function BackButton({ onPress }: { onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity style={styles.cancel} onPress={onPress}>
      <Text style={{ color: colors.secondaryText }}>Back</Text>
    </TouchableOpacity>
  );
}

function ManualInput({ label, value, onChangeText }: { label: string; value: string; onChangeText: (v: string) => void }) {
  const { colors, radius } = useTheme();
  return (
    <View style={{ flex: 1 }}>
      <Text style={[styles.manualLabel, { color: colors.secondaryText }]}>{label}</Text>
      <TextInput
        style={[styles.manualInput, { backgroundColor: colors.background, color: colors.primaryText, borderRadius: radius.sm }]}
        keyboardType="numeric"
        value={value}
        onChangeText={onChangeText}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  sheet: {
    width: '100%',
  },
  title: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 16,
  },
  mealRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 16,
  },
  mealPill: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
  },
  mealPillText: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
  },
  optionRow: {
    padding: 16,
    marginBottom: 10,
  },
  optionText: {
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
  },
  cancel: {
    alignItems: 'center',
    marginTop: 8,
    padding: 8,
  },
  textArea: {
    minHeight: 90,
    padding: 14,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    textAlignVertical: 'top',
  },
  primaryButton: {
    marginTop: 14,
    padding: 16,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
  },
  manualRow: {
    flexDirection: 'row',
    gap: 8,
  },
  manualLabel: {
    fontSize: 11,
    marginBottom: 6,
    fontFamily: 'Inter_400Regular',
  },
  manualInput: {
    padding: 10,
    textAlign: 'center',
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
  },
  searchRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    padding: 14,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
  searchButton: {
    paddingHorizontal: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchButtonText: {
    color: '#FFFFFF',
    fontFamily: 'Inter_600SemiBold',
  },
  listRow: {
    padding: 14,
    marginBottom: 8,
  },
  listRowTitle: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
  },
  listRowSubtitle: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
  },
  emptyText: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    paddingVertical: 20,
  },
});
