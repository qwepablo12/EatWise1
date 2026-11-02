import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ActivityIndicator, Alert, Platform } from 'react-native';
import { supabase } from '../utils/supabase';
import { useTheme } from '../utils/theme';

export default function Auth() {
  const { colors, radius } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }

    setLoading(true);

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        Alert.alert('Registration Error', error.message);
      } else {
        Alert.alert('Success!', 'Check your email for the confirmation link! ✉️');
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) Alert.alert('Login Error', error.message);
    }

    setLoading(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.card,
            borderRadius: radius.lg,
            borderColor: colors.border,
          },
          Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 8 },
            android: { elevation: 3 },
          }),
        ]}
      >
        <Text style={[styles.logo, { color: colors.primaryText }]}>EatWise</Text>
        <Text style={[styles.subtitle, { color: colors.secondaryText }]}>
          {isSignUp ? 'Create your account' : 'Sign in to track your nutrition'}
        </Text>

        <TextInput
          style={[styles.input, { backgroundColor: colors.background, color: colors.primaryText, borderColor: colors.border, borderRadius: radius.md }]}
          placeholder="Email"
          placeholderTextColor={colors.secondaryText}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <TextInput
          style={[styles.input, { backgroundColor: colors.background, color: colors.primaryText, borderColor: colors.border, borderRadius: radius.md }]}
          placeholder="Password"
          placeholderTextColor={colors.secondaryText}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
        />

        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.accent, borderRadius: radius.md }]}
          onPress={handleAuth}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>{isSignUp ? 'Sign Up' : 'Sign In'}</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.switchButton} onPress={() => setIsSignUp(!isSignUp)}>
          <Text style={[styles.switchText, { color: colors.accent }]}>
            {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  card: { padding: 25, borderWidth: 1 },
  logo: { fontSize: 28, fontFamily: 'Inter_700Bold', textAlign: 'center', marginBottom: 5 },
  subtitle: { fontSize: 14, textAlign: 'center', marginBottom: 25, fontFamily: 'Inter_400Regular' },
  input: { padding: 16, fontSize: 15, marginBottom: 15, borderWidth: 1, fontFamily: 'Inter_400Regular' },
  button: { padding: 16, alignItems: 'center', marginTop: 10 },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  switchButton: { marginTop: 20, alignItems: 'center' },
  switchText: { fontSize: 13, fontFamily: 'Inter_500Medium' },
});
