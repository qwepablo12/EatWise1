import React, { useState, useEffect } from 'react';
import { StyleSheet, View, LogBox, ActivityIndicator, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';

import { Sex, ActivityLevel, Goal, ProfileData, calculateNutrition } from './utils/nutrition';
import { useTheme, ThemeProvider } from './utils/theme';
import { supabase } from './utils/supabase';
import { FoodLogEntry, NewFoodLog, fetchLogsForDate, addFoodLog, deleteFoodLog, deleteLogsForDate, setFavorite } from './utils/foodLogs';
import { DEFAULT_WATER_GOAL_ML, fetchWaterTotalForDate, addWater, resetWaterForDate } from './utils/waterLogs';
import TodayScreen from './components/TodayScreen';
import ProgressScreen from './components/ProgressScreen';
import ProfileScreen from './components/ProfileScreen';
import Onboarding from './components/Onboarding';
import TabBar, { MainTab } from './components/TabBar';
import AddFoodSheet from './components/AddFoodSheet';
import Auth from './components/Auth';

LogBox.ignoreLogs(['Unable to determine event arguments', 'SafeAreaView has been deprecated']);

const ONBOARDING_KEY = '@eatwise_onboarding_completed';

export default function App() {
  return (
    <ThemeProvider>
      <AppInner />
    </ThemeProvider>
  );
}

function AppInner() {
  const { colors, isDark } = useTheme();
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  const [currentTab, setCurrentTab] = useState<MainTab>('today');
  const [isAddSheetOpen, setIsAddSheetOpen] = useState<boolean>(false);
  const [isAppReady, setIsAppReady] = useState<boolean>(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean>(false);

  const [age, setAge] = useState<string>('16');
  const [sex, setSex] = useState<Sex>('male');
  const [height, setHeight] = useState<string>('171');
  const [weight, setWeight] = useState<string>('59');
  const [activity, setActivity] = useState<ActivityLevel>('moderate');
  const [goal, setGoal] = useState<Goal>('maintain');
  const [waterGoalMl, setWaterGoalMl] = useState<string>(String(DEFAULT_WATER_GOAL_ML));
  const [waterMl, setWaterMl] = useState<number>(0);
  const [logs, setLogs] = useState<FoodLogEntry[]>([]);

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
        if (cloudProfile.water_goal_ml) setWaterGoalMl(String(cloudProfile.water_goal_ml));
      }

      // Onboarding is considered done if the cloud/local flag says so, or if
      // this account already has a profile from before onboarding existed.
      const localOnboarding = await AsyncStorage.getItem(ONBOARDING_KEY);
      const completed = Boolean(cloudProfile?.onboarding_completed) || Boolean(cloudProfile) || localOnboarding === 'true';
      setOnboardingCompleted(completed);

      const todayStr = getTodayDateString();
      const todaysLogs = await fetchLogsForDate(currentUserId, todayStr);
      setLogs(todaysLogs);

      const todaysWater = await fetchWaterTotalForDate(currentUserId, todayStr);
      setWaterMl(todaysWater);
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
    if (!isAppReady || !userId || !onboardingCompleted) return;

    const saveProfile = async () => {
      const basePayload = { age: parseInt(age), sex, height: parseFloat(height), weight: parseFloat(weight), activity, goal };
      const localData: ProfileData = { age, sex, height, weight, activity, goal };

      try {
        await AsyncStorage.setItem('@eatwise_profile', JSON.stringify(localData));

        const { error } = await supabase.from('profiles').upsert({
          id: userId,
          updated_at: new Date().toISOString(),
          water_goal_ml: parseInt(waterGoalMl) || DEFAULT_WATER_GOAL_ML,
          ...basePayload,
        });

        if (error) {
          // water_goal_ml column may not exist yet if the migration hasn't
          // been run — fall back to saving the fields that do exist.
          await supabase.from('profiles').upsert({
            id: userId,
            updated_at: new Date().toISOString(),
            ...basePayload,
          });
        }
      } catch (e) {
        console.log('Error saving profile:', e);
      }
    };

    const timeoutId = setTimeout(() => saveProfile(), 500);
    return () => clearTimeout(timeoutId);
  }, [age, sex, height, weight, activity, goal, waterGoalMl, isAppReady, userId, onboardingCompleted]);

  const confirmWipeLogs = () => {
    Alert.alert(
      'Clear today’s log?',
      'This removes all of today’s logged calories and macros. This can’t be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear', style: 'destructive', onPress: handleReset },
      ]
    );
  };

  const handleAddFood = async (entry: NewFoodLog) => {
    if (!userId) return;
    const todayStr = getTodayDateString();
    const saved = await addFoodLog(userId, todayStr, entry);
    if (saved) setLogs(prev => [...prev, saved]);
  };

  const handleDeleteLog = async (id: string) => {
    setLogs(prev => prev.filter(l => l.id !== id));
    await deleteFoodLog(id);
  };

  const handleToggleFavorite = async (log: FoodLogEntry) => {
    const next = !log.is_favorite;
    setLogs(prev => prev.map(l => (l.id === log.id ? { ...l, is_favorite: next } : l)));
    await setFavorite(log.id, next);
  };

  const handleReset = async () => {
    if (!userId) return;
    const todayStr = getTodayDateString();
    setLogs([]);
    await deleteLogsForDate(userId, todayStr);
  };

  const handleAddWater = async (ml: number) => {
    if (!userId) return;
    setWaterMl(prev => prev + ml);
    await addWater(userId, getTodayDateString(), ml);
  };

  const handleResetWater = async () => {
    if (!userId) return;
    setWaterMl(0);
    await resetWaterForDate(userId, getTodayDateString());
  };

  const handleWeightLogged = (weightKg: number) => {
    setWeight(String(weightKg));
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const handleOnboardingComplete = async (profile: ProfileData) => {
    setAge(profile.age); setSex(profile.sex); setHeight(profile.height); setWeight(profile.weight);
    setActivity(profile.activity); setGoal(profile.goal);
    setOnboardingCompleted(true);

    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    await AsyncStorage.setItem('@eatwise_profile', JSON.stringify(profile));

    if (userId) {
      try {
        await supabase.from('profiles').upsert({
          id: userId,
          updated_at: new Date().toISOString(),
          age: parseInt(profile.age),
          sex: profile.sex,
          height: parseFloat(profile.height),
          weight: parseFloat(profile.weight),
          activity: profile.activity,
          goal: profile.goal,
          onboarding_completed: true,
        });
      } catch (e) {
        // onboarding_completed column may not exist yet if the Supabase
        // migration hasn't been run — the local flag above still works.
        console.log('Error saving onboarding profile:', e);
      }
    }
  };

  if (!fontsLoaded || !isAppReady) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  if (!userId) {
    return <Auth />;
  }

  if (!onboardingCompleted) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
        <StatusBar style={isDark ? 'light' : 'dark'} />

          <View style={styles.mainContent}>
            {currentTab === 'today' ? (
              <TodayScreen
                targetCalories={nutrition.calories} protein={nutrition.protein} fat={nutrition.fat} carbs={nutrition.carbs}
                logs={logs}
                onDeleteLog={handleDeleteLog}
                onToggleFavorite={handleToggleFavorite}
                waterMl={waterMl}
                waterGoalMl={parseInt(waterGoalMl) || DEFAULT_WATER_GOAL_ML}
                onAddWater={handleAddWater}
                onResetWater={handleResetWater}
              />
            ) : currentTab === 'progress' ? (
              <ProgressScreen userId={userId} onWeightLogged={handleWeightLogged} />
            ) : (
              <ProfileScreen
                targetCalories={nutrition.calories}
                age={age} sex={sex} height={height} weight={weight} activity={activity} goal={goal}
                onChangeAge={setAge} onChangeHeight={setHeight} onChangeWeight={setWeight}
                onChangeSex={setSex} onChangeActivity={setActivity} onChangeGoal={setGoal}
                waterGoalMl={waterGoalMl}
                onChangeWaterGoal={setWaterGoalMl}
                onWipeLogs={confirmWipeLogs}
                onSignOut={handleSignOut}
              />
            )}
          </View>

          <TabBar activeTab={currentTab} onTabChange={setCurrentTab} onAddPress={() => setIsAddSheetOpen(true)} />

        <AddFoodSheet
          visible={isAddSheetOpen}
          userId={userId}
          onClose={() => setIsAddSheetOpen(false)}
          onAdd={handleAddFood}
        />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  mainContent: { flex: 1 },
});
