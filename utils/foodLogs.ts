import { supabase } from './supabase';

export type Meal = 'breakfast' | 'lunch' | 'dinner' | 'snack';
export type FoodLogSource = 'manual' | 'ai' | 'barcode' | 'search' | 'favorite';

export interface FoodLogEntry {
  id: string;
  user_id: string;
  date: string;
  meal: Meal;
  name: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  source: FoodLogSource;
  is_favorite: boolean;
  created_at: string;
}

export interface NewFoodLog {
  name: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  meal: Meal;
  source: FoodLogSource;
}

export function suggestMealForNow(): Meal {
  const hour = new Date().getHours();
  if (hour < 11) return 'breakfast';
  if (hour < 16) return 'lunch';
  if (hour < 21) return 'dinner';
  return 'snack';
}

export async function fetchLogsForDate(userId: string, date: string): Promise<FoodLogEntry[]> {
  const { data, error } = await supabase
    .from('food_logs')
    .select('*')
    .eq('user_id', userId)
    .eq('date', date)
    .order('created_at', { ascending: true });

  if (error) {
    console.log('Error fetching food logs:', error.message);
    return [];
  }
  return data ?? [];
}

export async function fetchLogsInRange(userId: string, startDate: string, endDate: string): Promise<FoodLogEntry[]> {
  const { data, error } = await supabase
    .from('food_logs')
    .select('*')
    .eq('user_id', userId)
    .gte('date', startDate)
    .lte('date', endDate);

  if (error) {
    console.log('Error fetching food logs in range:', error.message);
    return [];
  }
  return data ?? [];
}

export async function addFoodLog(userId: string, date: string, entry: NewFoodLog): Promise<FoodLogEntry | null> {
  const { data, error } = await supabase
    .from('food_logs')
    .insert({
      user_id: userId,
      date,
      meal: entry.meal,
      name: entry.name,
      calories: entry.calories,
      protein: entry.protein,
      fat: entry.fat,
      carbs: entry.carbs,
      source: entry.source,
    })
    .select()
    .single();

  if (error) {
    console.log('Error adding food log:', error.message);
    return null;
  }
  return data;
}

export async function updateFoodLog(id: string, changes: Partial<NewFoodLog>): Promise<void> {
  const { error } = await supabase.from('food_logs').update(changes).eq('id', id);
  if (error) console.log('Error updating food log:', error.message);
}

export async function deleteFoodLog(id: string): Promise<void> {
  const { error } = await supabase.from('food_logs').delete().eq('id', id);
  if (error) console.log('Error deleting food log:', error.message);
}

export async function deleteLogsForDate(userId: string, date: string): Promise<void> {
  const { error } = await supabase.from('food_logs').delete().eq('user_id', userId).eq('date', date);
  if (error) console.log('Error clearing food logs:', error.message);
}

export async function setFavorite(id: string, isFavorite: boolean): Promise<void> {
  const { error } = await supabase.from('food_logs').update({ is_favorite: isFavorite }).eq('id', id);
  if (error) console.log('Error updating favorite:', error.message);
}

export async function fetchRecent(userId: string, limit = 8): Promise<FoodLogEntry[]> {
  const { data, error } = await supabase
    .from('food_logs')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(40);

  if (error) {
    console.log('Error fetching recent logs:', error.message);
    return [];
  }

  const seen = new Set<string>();
  const unique: FoodLogEntry[] = [];
  for (const entry of data ?? []) {
    const key = entry.name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(entry);
    if (unique.length >= limit) break;
  }
  return unique;
}

export async function fetchFavorites(userId: string, limit = 20): Promise<FoodLogEntry[]> {
  const { data, error } = await supabase
    .from('food_logs')
    .select('*')
    .eq('user_id', userId)
    .eq('is_favorite', true)
    .order('created_at', { ascending: false })
    .limit(60);

  if (error) {
    console.log('Error fetching favorites:', error.message);
    return [];
  }

  const seen = new Set<string>();
  const unique: FoodLogEntry[] = [];
  for (const entry of data ?? []) {
    const key = entry.name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(entry);
    if (unique.length >= limit) break;
  }
  return unique;
}
