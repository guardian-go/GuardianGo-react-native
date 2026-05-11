import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
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
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.08,
  shadowRadius: 8,
  elevation: 3,
};

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 20, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Branding */}
          <View className="items-center pt-[52px] pb-8">
            <View className="w-20 h-20 rounded-full bg-primary-light justify-center items-center mb-4">
              <Ionicons name="shield-checkmark" size={40} color={Colors.primary} />
            </View>
            <Text className="text-[30px] font-extrabold text-text-primary tracking-tight mb-1.5">
              Guardian Go
            </Text>
            <Text className="text-[15px] text-text-secondary">School Pickup Management</Text>
          </View>

          {/* Form Card */}
          <View className="bg-card rounded-[18px] p-6 mb-6" style={cardShadow}>
            <Text className="text-[22px] font-bold text-text-primary mb-1">Welcome back</Text>
            <Text className="text-sm text-text-secondary mb-5">Sign in to your account</Text>

            {error && (
              <View className="flex-row items-center bg-danger-light rounded-[10px] p-3 mb-4 gap-2">
                <Ionicons name="alert-circle-outline" size={16} color={Colors.danger} />
                <Text className="flex-1 text-[13px] text-danger">{error}</Text>
              </View>
            )}

            <View className="mb-4">
              <Text className="text-[13px] font-semibold text-text-primary mb-2">Email address</Text>
              <View className="flex-row items-center border-[1.5px] border-border rounded-[10px] bg-background">
                <Ionicons name="mail-outline" size={18} color={Colors.text.light} style={{ marginLeft: 12 }} />
                <TextInput
                  className="flex-1 py-[13px] px-[10px] text-[15px] text-text-primary"
                  value={email}
                  onChangeText={setEmail}
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
              <View className="flex-row items-center border-[1.5px] border-border rounded-[10px] bg-background">
                <Ionicons name="lock-closed-outline" size={18} color={Colors.text.light} style={{ marginLeft: 12 }} />
                <TextInput
                  className="flex-1 py-[13px] px-[10px] pr-1 text-[15px] text-text-primary"
                  value={password}
                  onChangeText={setPassword}
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
