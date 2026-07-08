import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { signIn } from '@/services/auth.service';
import { useAuthStore } from '@/store/auth.store';
import { Button } from '@/components/ui/Button';
import { Colors } from '@/constants/colors';
import { UserRole } from '@/types';

const cardShadow = {
  shadowColor: '#0F172A',
  shadowOffset: { width: 0, height: 10 },
  shadowOpacity: 0.1,
  shadowRadius: 24,
  elevation: 6,
};

type Field = 'email' | 'password' | null;

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [focused, setFocused] = useState<Field>(null);

  const { setUser, setRole } = useAuthStore();
  const router = useRouter();

  const handleSignIn = async () => {
    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const user = await signIn(email.trim(), password);
      setUser(user);
      setRole(user.role as UserRole);
    } catch {
      setError('Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const fieldBorder = (field: Field) =>
    focused === field ? Colors.primary : Colors.border;

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 20, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Branding — white screen bg so the JPEG's white background blends in */}
          <View className="items-center pt-[40px] pb-8">
            <Image
              source={require('../../assets/logo.jpeg')}
              style={{ width: 180, height: 180, marginBottom: 4 }}
              resizeMode="contain"
            />
            <View className="flex-row items-center gap-[6px] bg-primary-light px-3 py-[6px] rounded-full">
              <Ionicons name="shield-checkmark" size={13} color={Colors.primary} />
              <Text className="text-[12px] font-semibold text-primary">
                School Pickup Management
              </Text>
            </View>
          </View>

          {/* Form Card */}
          <View className="bg-card rounded-3xl p-6 mb-6 border border-border" style={cardShadow}>
            <Text className="text-[23px] font-bold text-text-primary mb-1">Welcome back</Text>
            <Text className="text-sm text-text-secondary mb-6">Sign in to your account</Text>

            {error && (
              <View className="flex-row items-center bg-danger-light rounded-xl p-3 mb-4 gap-2">
                <Ionicons name="alert-circle-outline" size={16} color={Colors.danger} />
                <Text className="flex-1 text-[13px] text-danger">{error}</Text>
              </View>
            )}

            <View className="mb-4">
              <Text className="text-[13px] font-semibold text-text-primary mb-2">Email address</Text>
              <View
                className="flex-row items-center border-[1.5px] rounded-xl"
                style={{
                  borderColor: fieldBorder('email'),
                  backgroundColor: focused === 'email' ? '#fff' : Colors.background,
                }}
              >
                <Ionicons
                  name="mail-outline"
                  size={18}
                  color={focused === 'email' ? Colors.primary : Colors.text.light}
                  style={{ marginLeft: 14 }}
                />
                <TextInput
                  className="flex-1 py-[14px] px-[10px] text-[15px] text-text-primary"
                  value={email}
                  onChangeText={setEmail}
                  onFocus={() => setFocused('email')}
                  onBlur={() => setFocused(null)}
                  placeholder="you@school.ca"
                  placeholderTextColor={Colors.text.light}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            <View className="mb-4">
              <Text className="text-[13px] font-semibold text-text-primary mb-2">Password</Text>
              <View
                className="flex-row items-center border-[1.5px] rounded-xl"
                style={{
                  borderColor: fieldBorder('password'),
                  backgroundColor: focused === 'password' ? '#fff' : Colors.background,
                }}
              >
                <Ionicons
                  name="lock-closed-outline"
                  size={18}
                  color={focused === 'password' ? Colors.primary : Colors.text.light}
                  style={{ marginLeft: 14 }}
                />
                <TextInput
                  className="flex-1 py-[14px] px-[10px] pr-1 text-[15px] text-text-primary"
                  value={password}
                  onChangeText={setPassword}
                  onFocus={() => setFocused('password')}
                  onBlur={() => setFocused(null)}
                  placeholder="••••••••"
                  placeholderTextColor={Colors.text.light}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword((v) => !v)}
                  className="p-3"
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={18}
                    color={Colors.text.light}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <Button
              title="Sign In"
              onPress={handleSignIn}
              loading={loading}
              style={{ marginTop: 8, marginBottom: 12 }}
            />

            <TouchableOpacity className="items-center py-1">
              <Text className="text-[13px] text-primary font-medium">Forgot password?</Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View className="flex-row justify-center items-center mt-2">
            <Text className="text-sm text-text-secondary">Don't have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
              <Text className="text-sm text-primary font-semibold">Register</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
