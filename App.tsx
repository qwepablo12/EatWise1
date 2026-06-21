import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, ScrollView, TouchableOpacity, LogBox, Platform, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context'; 

import { Sex, ActivityLevel, Goal, ProfileData, activityFactors, activityLabels, calculateNutrition } from './utils/nutrition';
import { theme } from './utils/theme';
import { supabase } from './utils/supabase';
import CaloriesCard from './components/CaloriesCard';
import Dashboard from './components/Dashboard';
import Auth from './components/Auth';

LogBox.ignoreLogs(['Unable to determine event arguments', 'SafeAreaView has been deprecated']);

type Tab = 'home' | 'profile';

export default function App() {
  const [currentTab, setCurrentTab] = useState<Tab>('home');
  const [isAppReady, setIsAppReady] = useState<boolean>(false);
  const [userId, setUserId] = useState<string | null>(null);

  const [age, setAge] = useState<string>('16');
  const [sex, setSex] = useState<Sex>('male');
  const [height, setHeight] = useState<string>('171');
  const [weight, setWeight] = useState<string>('59');
  const [activity, setActivity] = useState<ActivityLevel>('moderate');
  const [goal, setGoal] = useState<Goal>('maintain');
  const [consumedCalories, setConsumedCalories] = useState<number>(0);
  const [consumedProtein, setConsumedProtein] = useState<number>(0);
  const [consumedFat, setConsumedFat] = useState<number>(0);
  const [consumedCarbs, setConsumedCarbs] = useState<number>(0);

  const [nutrition, setNutrition] = useState({ calories: 0, protein: 0, fat: 0, carbs: 0 });

  const getTodayDateString = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUserId(session.user.id);
        loadUserData(session.user.id);
      } else {
        setIsAppReady(true);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setUserId(session.user.id);
        loadUserData(session.user.id);
      } else {
        setUserId(null);
        setIsAppReady(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserData = async (currentUserId: string) => {
    try {
      setIsAppReady(false);
      
      const localData = await AsyncStorage.getItem('@eatwise_profile');
      if (localData) {
        const p: ProfileData = JSON.parse(localData);
        setAge(p.age); setSex(p.sex); setHeight(p.height); setWeight(p.weight);
        setActivity(p.activity); setGoal(p.goal);
      }

      const { data: cloudProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUserId)
        .maybeSingle();

      if (cloudProfile) {
        setAge(String(cloudProfile.age)); setSex(cloudProfile.sex);
        setHeight(String(cloudProfile.height)); setWeight(String(cloudProfile.weight));
        setActivity(cloudProfile.activity); setGoal(cloudProfile.goal);
      }

      const todayStr = getTodayDateString();
      const { data: cloudLogs } = await supabase
        .from('daily_logs')
        .select('*')
        .eq('user_id', currentUserId)
        .eq('date', todayStr)
        .maybeSingle();

      if (cloudLogs) {
        setConsumedCalories(cloudLogs.calories); setConsumedProtein(cloudLogs.protein);
        setConsumedFat(cloudLogs.fat); setConsumedCarbs(cloudLogs.carbs);
      } else {
        setConsumedCalories(0); setConsumedProtein(0); setConsumedFat(0); setConsumedCarbs(0);
      }
    } catch (e) {
      console.log('Error loading user data:', e);
    } finally {
      setIsAppReady(true);
    }
  };

  useEffect(() => {
    const results = calculateNutrition({ age, sex, height, weight, activity, goal });
    setNutrition(results);
  }, [age, sex, height, weight, activity, goal]);

  useEffect(() => {
    if (isAppReady && userId) {
      const syncLogs = async () => {
        const todayStr = getTodayDateString();
        const logsPayload = { calories: consumedCalories, protein: consumedProtein, fat: consumedFat, carbs: consumedCarbs };
        
        await AsyncStorage.setItem('@eatwise_daily_logs', JSON.stringify(logsPayload));
        await supabase.from('daily_logs').upsert({
          user_id: userId,
          date: todayStr,
          ...logsPayload
        }, { onConflict: 'user_id,date' });
      };
      
      const timeoutId = setTimeout(() => syncLogs(), 500);
      return () => clearTimeout(timeoutId);
    }
  }, [consumedCalories, consumedProtein, consumedFat, consumedCarbs, isAppReady, userId]);

  const saveProfile = async () => {
    if (!userId) return;
    try {
      const profilePayload = { age: parseInt(age), sex, height: parseFloat(height), weight: parseFloat(weight), activity, goal };
      const localData: ProfileData = { age, sex, height, weight, activity, goal };
      
      await AsyncStorage.setItem('@eatwise_profile', JSON.stringify(localData));
      
      const { error } = await supabase.from('profiles').upsert({
        id: userId,
        updated_at: new Date().toISOString(),
        ...profilePayload
      });

      if (error) throw error;
      alert('Profile synced with Supabase Cloud! ☁️🌿');
    } catch (e: any) {
      alert(`Error saving profile: ${e.message}`);
    }
  };

  const handleQuickAdd = (type: 'breakfast' | 'lunch' | 'shake') => {
    if (type === 'breakfast') {
      setConsumedCalories(prev => prev + 450); setConsumedProtein(prev => prev + 25); setConsumedFat(prev => prev + 12); setConsumedCarbs(prev => prev + 60);
    } else if (type === 'lunch') {
      setConsumedCalories(prev => prev + 650); setConsumedProtein(prev => prev + 45); setConsumedFat(prev => prev + 18); setConsumedCarbs(prev => prev + 75);
    } else if (type === 'shake') {
      setConsumedCalories(prev => prev + 300); setConsumedProtein(prev => prev + 35); setConsumedFat(prev => prev + 5); setConsumedCarbs(prev => prev + 10);
    }
  };

  const handleReset = () => {
    setConsumedCalories(0); setConsumedProtein(0); setConsumedFat(0); setConsumedCarbs(0);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  if (!isAppReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!userId) {
    return <Auth />;
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['top']}>
        <StatusBar style="dark" />
        
        <View style={styles.mainContent}>
          {currentTab === 'home' ? (
            <Dashboard 
              targetCalories={nutrition.calories} protein={nutrition.protein} fat={nutrition.fat} carbs={nutrition.carbs}
              consumedCalories={consumedCalories} consumedProtein={consumedProtein} consumedFat={consumedFat} consumedCarbs={consumedCarbs}
              onQuickAdd={handleQuickAdd} 
              onCustomAdd={(cal, pro, fat, carb) => {
                setConsumedCalories(prev => prev + cal);
                setConsumedProtein(prev => prev + pro);
                setConsumedFat(prev => prev + fat);
                setConsumedCarbs(prev => prev + carb);
              }}
              onAiAdd={(cal, pro, fat, carb) => {
                setConsumedCalories(prev => prev + cal);
                setConsumedProtein(prev => prev + pro);
                setConsumedFat(prev => prev + fat);
                setConsumedCarbs(prev => prev + carb);
              }}
              onReset={handleReset}
            />
          ) : (

            <ScrollView 
              contentContainerStyle={styles.scrollContainer} 
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.header}>
                <Text style={styles.appName}>CORE_PROFILE</Text>
                <Text style={styles.profileLabel}>ID: TARGET_METRICS_LOG</Text>
              </View>

              <View style={styles.targetCard}>
                <Text style={styles.targetCaloriesText}>{nutrition.calories} kcal/day</Text>
                <Text style={styles.targetSubText}>SYSTEM COMPUTE MATRIX TARGET</Text>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>BIOLOGICAL INDEX</Text>
                
                <View style={styles.compactMetricsRow}>
                  <View style={styles.compactInputGroup}>
                    <Text style={styles.compactInputLabel}>AGE</Text>
                    <TextInput 
                      style={styles.compactInput} 
                      keyboardType="numeric" 
                      value={age} 
                      onChangeText={setAge} 
                      maxLength={3} 
                    />
                  </View>
                  <View style={styles.compactInputGroup}>
                    <Text style={styles.compactInputLabel}>HEIGHT (CM)</Text>
                    <TextInput 
                      style={styles.compactInput} 
                      keyboardType="numeric" 
                      value={height} 
                      onChangeText={setHeight} 
                      maxLength={3} 
                    />
                  </View>
                  <View style={styles.compactInputGroup}>
                    <Text style={styles.compactInputLabel}>WEIGHT (KG)</Text>
                    <TextInput 
                      style={styles.compactInput} 
                      keyboardType="numeric" 
                      value={weight} 
                      onChangeText={setWeight} 
                      maxLength={3} 
                    />
                  </View>
                </View>
                
                <View style={[styles.buttonGroup, { marginTop: 15 }]}>
                  {(['male', 'female'] as Sex[]).map((s) => (
                    <TouchableOpacity key={s} style={[styles.selectorButton, sex === s && styles.activeButton]} onPress={() => setSex(s)}>
                      <Text style={[styles.buttonText, sex === s && styles.activeButtonText]}>{s.toUpperCase()}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <Text style={styles.sectionHeader}>// LIFESTYLE_ADJUSTMENT</Text>
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>ACTIVITY ENGINES</Text>
                {(Object.keys(activityFactors) as ActivityLevel[]).map((level) => (
                  <TouchableOpacity key={level} style={[styles.listSelector, activity === level && styles.activeListSelector]} onPress={() => setActivity(level)}>
                    <Text style={[styles.listSelectorTitle, activity === level && styles.activeListSelectorTitle]}>{activityLabels[level].label}</Text>
                    {activity === level && <Text style={styles.checkmark}>[✓]</Text>}
                  </TouchableOpacity>
                ))}

                <Text style={[styles.sectionTitle, { marginTop: 15 }]}>CORE OBJECTIVE</Text>
                <View style={styles.goalGroup}>
                  {(['lose', 'maintain', 'gain'] as Goal[]).map((g) => (
                    <TouchableOpacity key={g} style={[styles.goalButton, goal === g && styles.activeGoalButton]} onPress={() => setGoal(g)}>
                      <Text style={[styles.goalButtonText, goal === g && styles.activeGoalButtonText]}>
                        {g === 'lose' ? 'DEFICIT (LOSE)' : g === 'maintain' ? 'MAINTAIN' : 'SURPLUS (GAIN)'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <TouchableOpacity style={styles.saveButton} onPress={saveProfile}>
                <Text style={styles.saveButtonText}>SYNC MATRIX TO CLOUD</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
                <Text style={styles.signOutButtonText}>DISCONNECT TERMINAL [X]</Text>
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>

        <View style={styles.tabBar}>
          <TouchableOpacity style={styles.tabItem} onPress={() => setCurrentTab('home')}>
            <Text style={[styles.tabIcon, currentTab === 'home' && styles.activeTabIcon]}>📊</Text>
            <Text style={[styles.tabText, currentTab === 'home' && styles.activeTabText]}>Dashboard</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tabItem} onPress={() => setCurrentTab('profile')}>
            <Text style={[styles.tabIcon, currentTab === 'profile' && styles.activeTabIcon]}>👤</Text>
            <Text style={[styles.tabText, currentTab === 'profile' && styles.activeTabText]}>Profile</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  compactMetricsRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, width: '100%' },
  compactInputGroup: { flex: 1 },
  compactInputLabel: { fontSize: 9, fontWeight: '900', color: '#555', marginBottom: 4, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  compactInput: { backgroundColor: '#F5F4EF', padding: 10, borderWidth: 2, borderColor: '#000000', fontSize: 16, fontWeight: '900', color: '#000000', textAlign: 'center' },
  targetCard: { backgroundColor: '#000', padding: 16, borderWidth: 3, borderColor: '#000', marginBottom: 20, alignItems: 'center' },
  targetCaloriesText: { fontSize: 24, fontWeight: '900', color: theme.colors.accent },
  targetSubText: { fontSize: 9, color: '#666', fontWeight: '800', marginTop: 4, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  compactMetricsInfo: { fontSize: 16, fontWeight: '800', color: '#000', letterSpacing: 0.5 },
  container: { flex: 1, backgroundColor: theme.colors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background },
  mainContent: { flex: 1 },
  scrollContainer: { padding: 18, paddingBottom: 50 },
  header: { marginBottom: 25, alignItems: 'center' },
  appName: { fontSize: 28, fontWeight: '900', color: '#000000', letterSpacing: -0.5 },
  profileLabel: { fontSize: 12, fontWeight: '800', color: '#555555', marginTop: 3, textTransform: 'uppercase', letterSpacing: 1 },
  sectionHeader: { fontSize: 13, fontWeight: '900', color: '#000000', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12, marginLeft: 5 },
  section: { backgroundColor: '#ffffff', padding: 20, borderRadius: 0, marginBottom: 20, borderWidth: 3, borderColor: '#000000', ...theme.brutalshading },
  sectionTitle: { fontSize: 15, fontWeight: '900', color: '#000000', marginBottom: 12 },
  buttonGroup: { flexDirection: 'row', backgroundColor: '#E0E0E0', borderRadius: 0, padding: 4, borderWidth: 2, borderColor: '#000000' },
  selectorButton: { flex: 1, padding: 12, alignItems: 'center', borderRadius: 0 },
  activeButton: { backgroundColor: '#000000' },
  buttonText: { fontSize: 14, fontWeight: '700', color: '#000000' },
  activeButtonText: { color: theme.colors.accent, fontWeight: '900' },
  metricsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  metricInputGroup: { alignItems: 'center' },
  metricLabel: { fontSize: 11, color: '#555555', marginBottom: 6, fontWeight: '800' },
  input: { backgroundColor: '#F5F4EF', width: 90, padding: 15, borderRadius: 0, textAlign: 'center', fontSize: 18, fontWeight: '900', color: '#000000', borderWidth: 2, borderColor: '#000000' },
  listSelector: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, backgroundColor: '#F9F8F6', borderRadius: 0, marginBottom: 10, borderWidth: 2, borderColor: '#000000' },
  activeListSelector: { backgroundColor: theme.colors.accent, borderColor: '#000000' },
  listSelectorTitle: { fontSize: 14, color: '#000000', fontWeight: '900' },
  activeListSelectorTitle: { color: '#000000' },
  listSelectorDesc: { fontSize: 12, color: '#555555', marginTop: 2, fontWeight: '700' },
  activeListSelectorDesc: { color: '#000000' },
  checkmark: { color: '#000000', fontWeight: '900', fontSize: 18, marginRight: 5 },
  goalGroup: { gap: 10 },
  goalButton: { padding: 15, backgroundColor: '#F9F8F6', borderRadius: 0, alignItems: 'center', borderWidth: 2, borderColor: '#000000' },
  activeGoalButton: { backgroundColor: '#000000', borderColor: '#000000' },
  goalButtonText: { fontSize: 14, color: '#555555', fontWeight: '700' },
  activeGoalButtonText: { color: theme.colors.accent, fontWeight: '900' },
  saveButton: { backgroundColor: '#000000', padding: 18, borderRadius: 0, alignItems: 'center', marginTop: 10, borderWidth: 2, borderColor: '#000000', ...theme.brutalshading },
  saveButtonText: { color: theme.colors.accent, fontSize: 17, fontWeight: '900', letterSpacing: 1 },
  signOutButton: { padding: 15, alignItems: 'center', marginTop: 20, borderWidth: 2, borderColor: '#E63946', borderRadius: 0, borderStyle: 'dashed' },
  signOutButtonText: { color: '#E63946', fontWeight: '900', fontSize: 13, letterSpacing: 1 },
  tabBar: { flexDirection: 'row', height: 65, backgroundColor: '#ffffff', borderTopWidth: 3, borderColor: '#000000', justifyContent: 'space-around', alignItems: 'center', paddingBottom: Platform.OS === 'ios' ? 10 : 0 },
  tabItem: { alignItems: 'center', justifyContent: 'center', flex: 1 },
  tabIcon: { fontSize: 20, opacity: 0.4 },
  activeTabIcon: { opacity: 1 },
  tabText: { fontSize: 11, color: '#555555', fontWeight: '700', marginTop: 2 },
  activeTabText: { color: '#000000', fontWeight: '900' }
});
