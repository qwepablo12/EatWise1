import { supabase } from './supabase';

export interface WeightLogEntry {
  id: string;
  user_id: string;
  date: string;
  weight_kg: number;
  created_at: string;
}

export async function fetchWeightLogs(userId: string, days = 30): Promise<WeightLogEntry[]> {
  const since = new Date();
  since.setDate(since.getDate() - days);
  const sinceStr = since.toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('weight_logs')
    .select('*')
    .eq('user_id', userId)
    .gte('date', sinceStr)
    .order('date', { ascending: true });

  if (error) {
    console.log('Error fetching weight logs:', error.message);
    return [];
  }
  return data ?? [];
}

export async function logWeightForDate(userId: string, date: string, weightKg: number): Promise<void> {
  const { error } = await supabase
    .from('weight_logs')
    .upsert({ user_id: userId, date, weight_kg: weightKg }, { onConflict: 'user_id,date' });

  if (error) console.log('Error logging weight:', error.message);
}
