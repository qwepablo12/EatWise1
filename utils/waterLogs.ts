import { supabase } from './supabase';

export const DEFAULT_WATER_GOAL_ML = 2000;

export async function fetchWaterTotalForDate(userId: string, date: string): Promise<number> {
  const { data, error } = await supabase
    .from('water_logs')
    .select('ml')
    .eq('user_id', userId)
    .eq('date', date);

  if (error) {
    console.log('Error fetching water logs:', error.message);
    return 0;
  }
  return (data ?? []).reduce((sum, row) => sum + row.ml, 0);
}

export async function addWater(userId: string, date: string, ml: number): Promise<void> {
  const { error } = await supabase.from('water_logs').insert({ user_id: userId, date, ml });
  if (error) console.log('Error adding water log:', error.message);
}

export async function resetWaterForDate(userId: string, date: string): Promise<void> {
  const { error } = await supabase.from('water_logs').delete().eq('user_id', userId).eq('date', date);
  if (error) console.log('Error resetting water log:', error.message);
}
