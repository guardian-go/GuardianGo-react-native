import '../global.css';
import React, { useEffect } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Stack, useRouter, useSegments } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { subscribeToAuthState, getUserProfile } from '@/services/auth.service';
import { useAuthStore } from '@/store/auth.store';
import { Colors } from '@/constants/colors';

export default function RootLayout() {
  const { setUser, setRole, setLoading, isLoading, isAuthenticated, role } = useAuthStore();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    // Failsafe: if Firebase never responds (no config), stop loading after 5s
    const timeout = setTimeout(() => setLoading(false), 5000);

    const unsubscribe = subscribeToAuthState(async (firebaseUser) => {
      clearTimeout(timeout);
      if (firebaseUser) {
        try {
          const profile = await getUserProfile(firebaseUser.uid);
          if (profile) {
            setUser(profile);
            setRole(profile.role);
          } else {
            setUser(null);
            setRole(null);
          }
        } catch {
          setUser(null);
          setRole(null);
        }
      } else {
        setUser(null);
        setRole(null);
      }
      setLoading(false);
    });

    return () => {
      clearTimeout(timeout);
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (isLoading) return;

    const segment = segments[0];
    const inAuthGroup = segment === '(auth)';
    const inTeacherGroup = segment === '(teacher)';
    const inParentGroup = segment === '(parent)';
    const inPaywallGroup = segment === '(paywall)';

    if (!isAuthenticated) {
      if (!inAuthGroup) router.replace('/(auth)/login');
      return;
    }

    if (inPaywallGroup) return;

    if (role === 'teacher' || role === 'admin') {
      if (!inTeacherGroup) router.replace('/(teacher)');
    } else if (role === 'parent') {
      if (!inParentGroup) router.replace('/(parent)');
    }
  }, [isLoading, isAuthenticated, role, segments]);

  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }} />
      {isLoading && (
        <View className="absolute inset-0 bg-background justify-center items-center">
          <View className="w-22 h-22 rounded-full bg-primary-light justify-center items-center mb-4">
            <Ionicons name="shield-checkmark" size={44} color={Colors.primary} />
          </View>
          <Text className="text-[28px] font-extrabold text-text-primary tracking-tight mb-8">
            Guardian Go
          </Text>
          <ActivityIndicator size="small" color={Colors.primary} />
        </View>
      )}
    </SafeAreaProvider>
  );
}
