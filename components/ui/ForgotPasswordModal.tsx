import React, { useState } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { resetPassword } from '@/services/auth.service';
import { Button } from '@/components/ui/Button';
import { Colors } from '@/constants/colors';

interface ForgotPasswordModalProps {
  visible: boolean;
  onClose: () => void;
}

export function ForgotPasswordModal({ visible, onClose }: ForgotPasswordModalProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const reset = () => {
    setEmail('');
    setLoading(false);
    setError(null);
    setSent(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSend = async () => {
    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await resetPassword(email.trim());
    } catch (e: any) {
      const code = e?.code ?? '';
      // Don't reveal whether an account exists — only surface real input/network errors.
      if (code === 'auth/invalid-email') {
        setLoading(false);
        setError('Please enter a valid email address.');
        return;
      }
      if (code === 'auth/network-request-failed') {
        setLoading(false);
        setError('Network error. Check your internet connection.');
        return;
      }
      // auth/user-not-found and anything else: silently treat as sent.
    }
    setLoading(false);
    setSent(true);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1 justify-center items-center px-6"
        style={{ backgroundColor: 'rgba(15, 23, 42, 0.5)' }}
      >
        <View className="w-full bg-card rounded-3xl p-6" style={{ maxWidth: 380 }}>
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-[18px] font-bold text-text-primary">Reset password</Text>
            <TouchableOpacity onPress={handleClose} className="p-1">
              <Ionicons name="close" size={22} color={Colors.text.secondary} />
            </TouchableOpacity>
          </View>

          {sent ? (
            <View className="items-center py-2">
              <View className="w-14 h-14 rounded-full bg-success-light justify-center items-center mb-4">
                <Ionicons name="mail-outline" size={26} color={Colors.success} />
              </View>
              <Text className="text-[13px] text-text-secondary text-center mb-6">
                If an account exists for that email, a reset link is on its way.
              </Text>
              <Button title="Done" onPress={handleClose} style={{ width: '100%' }} />
            </View>
          ) : (
            <>
              <Text className="text-[13px] text-text-secondary mb-4">
                Enter your account email and we'll send you a reset link.
              </Text>

              {error && (
                <View className="flex-row items-center bg-danger-light rounded-xl p-3 mb-4 gap-2">
                  <Ionicons name="alert-circle-outline" size={16} color={Colors.danger} />
                  <Text className="flex-1 text-[13px] text-danger">{error}</Text>
                </View>
              )}

              <View className="flex-row items-center border-[1.5px] border-border rounded-xl bg-background mb-5">
                <Ionicons name="mail-outline" size={18} color={Colors.text.light} style={{ marginLeft: 14 }} />
                <TextInput
                  className="flex-1 py-[13px] px-[10px] text-[15px] text-text-primary"
                  value={email}
                  onChangeText={setEmail}
                  placeholder="you@school.ca"
                  placeholderTextColor={Colors.text.light}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoFocus
                />
              </View>

              <Button title="Send Reset Link" onPress={handleSend} loading={loading} />
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
