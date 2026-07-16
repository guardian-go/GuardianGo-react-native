import '../global.css';
import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, Text, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Stack, useRouter, useSegments } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { subscribeToAuthState, getUserProfile, resendVerificationEmail } from '@/services/auth.service';
import { useAuthStore } from '@/store/auth.store';
import { Colors } from '@/constants/colors';

export default function RootLayout() {
  const { setUser, setRole, setLoading, setEmailVerified, isLoading, isAuthenticated, emailVerified, role } = useAuthStore();
  const router = useRouter();
  const segments = useSegments();
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    // Failsafe: if Firebase never responds (no config), stop loading after 5s
    const timeout = setTimeout(() => setLoading(false), 5000);

    const unsubscribe = subscribeToAuthState(async (firebaseUser) => {
      clearTimeout(timeout);
      if (firebaseUser) {
        setEmailVerified(firebaseUser.emailVerified);
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

  const handleResendVerification = async () => {
    setResending(true);
    try {
      await resendVerificationEmail();
      Alert.alert('Verification email sent', 'Check your inbox for the verification link.');
    } catch {
      Alert.alert('Could not send email', 'Please try again in a moment.');
    } finally {
      setResending(false);
    }
  };

  const showVerifyBanner =
    !isLoading && isAuthenticated && !emailVerified && !bannerDismissed && segments[0] !== '(auth)';

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
      {showVerifyBanner && (
        <View
          className="absolute top-0 left-0 right-0 bg-warning-light flex-row items-center px-4 pb-3 gap-2"
          style={{ paddingTop: 52 }}
        >
          <Ionicons name="mail-unread-outline" size={16} color={Colors.warning} />
          <Text className="flex-1 text-xs font-medium" style={{ color: Colors.warning }}>
            Please verify your email address.
          </Text>
          <TouchableOpacity onPress={handleResendVerification} disabled={resending} className="py-1 px-2">
            <Text className="text-xs font-bold" style={{ color: Colors.warning }}>
              {resending ? 'Sending…' : 'Resend'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setBannerDismissed(true)} className="p-1">
            <Ionicons name="close" size={16} color={Colors.warning} />
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaProvider>
  );
}
