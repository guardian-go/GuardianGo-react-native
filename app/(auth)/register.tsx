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
import { registerUser } from '@/services/auth.service';
import { useAuthStore } from '@/store/auth.store';
import { Button } from '@/components/ui/Button';
import { Colors } from '@/constants/colors';
import { UserRole } from '@/types';

const ROLES: { value: UserRole; label: string; icon: React.ComponentProps<typeof Ionicons>['name'] }[] = [
  { value: 'teacher', label: 'Teacher', icon: 'school-outline' },
  { value: 'parent', label: 'Parent', icon: 'people-outline' },
];

const cardShadow = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.08,
  shadowRadius: 8,
  elevation: 3,
};

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('parent');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { setUser, setRole: storeSetRole } = useAuthStore();
  const router = useRouter();

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password) {
      setError('Please fill in all fields.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const user = await registerUser(email.trim(), password, name.trim(), role);
      setUser(user);
      storeSetRole(user.role);
    } catch (e: any) {
      const code = e?.code ?? '';
      const message =
        code === 'auth/email-already-in-use' ? 'That email is already registered.' :
        code === 'auth/invalid-email' ? 'Please enter a valid email address.' :
        code === 'auth/weak-password' ? 'Password is too weak (min 6 characters).' :
        code === 'auth/operation-not-allowed' ? 'Email/Password sign-in is not enabled in Firebase Console.' :
        code === 'auth/network-request-failed' ? 'Network error. Check your internet connection.' :
        code === 'permission-denied' ? 'Firestore rules denied the write. Check your security rules.' :
        e?.message || 'Registration failed. Please try again.';
      setError(`${message}${code ? ` (${code})` : ''}`);
      console.log('registration error', { code, message: e?.message, error: e });
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
          <TouchableOpacity className="mt-4 mb-2 self-start p-1" onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color={Colors.text.primary} />
          </TouchableOpacity>

          <View className="mb-7">
            <Text className="text-[28px] font-bold text-text-primary mb-1.5">Create account</Text>
            <Text className="text-[15px] text-text-secondary">Join your school on Guardian Go</Text>
          </View>

          <View className="bg-card rounded-[18px] p-6 mb-6" style={cardShadow}>
            {error && (
              <View className="flex-row items-center bg-danger-light rounded-[10px] p-3 mb-4 gap-2">
                <Ionicons name="alert-circle-outline" size={16} color={Colors.danger} />
                <Text className="flex-1 text-[13px] text-danger">{error}</Text>
              </View>
            )}

            <View className="mb-4">
              <Text className="text-[13px] font-semibold text-text-primary mb-2">Full name</Text>
              <TextInput
                className="border-[1.5px] border-border rounded-[10px] bg-background py-[13px] px-[14px] text-[15px] text-text-primary"
                value={name}
                onChangeText={setName}
                placeholder="Jane Smith"
                placeholderTextColor={Colors.text.light}
                autoCapitalize="words"
              />
            </View>

            <View className="mb-4">
              <Text className="text-[13px] font-semibold text-text-primary mb-2">Email address</Text>
              <TextInput
                className="border-[1.5px] border-border rounded-[10px] bg-background py-[13px] px-[14px] text-[15px] text-text-primary"
                value={email}
                onChangeText={setEmail}
                placeholder="you@school.ca"
                placeholderTextColor={Colors.text.light}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View className="mb-4">
              <Text className="text-[13px] font-semibold text-text-primary mb-2">Password</Text>
              <TextInput
                className="border-[1.5px] border-border rounded-[10px] bg-background py-[13px] px-[14px] text-[15px] text-text-primary"
                value={password}
                onChangeText={setPassword}
                placeholder="Min. 6 characters"
                placeholderTextColor={Colors.text.light}
                secureTextEntry
              />
            </View>

            <View className="mb-4">
              <Text className="text-[13px] font-semibold text-text-primary mb-2">I am a</Text>
              <View className="flex-row gap-3">
                {ROLES.map((r) => (
                  <TouchableOpacity
                    key={r.value}
                    className={`flex-1 flex-row items-center justify-center py-[14px] rounded-[10px] border-[1.5px] gap-2 ${
                      role === r.value
                        ? 'border-primary bg-primary-light'
                        : 'border-border bg-background'
                    }`}
                    onPress={() => setRole(r.value)}
                  >
                    <Ionicons
                      name={r.icon}
                      size={20}
                      color={role === r.value ? Colors.primary : Colors.text.secondary}
                    />
                    <Text
                      className={`text-sm ${
                        role === r.value
                          ? 'font-semibold text-primary'
                          : 'font-medium text-text-secondary'
                      }`}
                    >
                      {r.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <Button
              title="Create Account"
              onPress={handleRegister}
              loading={loading}
              style={{ marginTop: 8 }}
            />
          </View>

          <View className="flex-row justify-center items-center">
            <Text className="text-sm text-text-secondary">Already have an account? </Text>
            <TouchableOpacity onPress={() => router.back()}>
              <Text className="text-sm text-primary font-semibold">Sign In</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
