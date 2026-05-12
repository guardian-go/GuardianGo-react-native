import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
} from 'react-native';
import { Colors } from '@/constants/colors';

type ButtonVariant = 'primary' | 'success' | 'danger' | 'outline' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

const VARIANTS: Record<ButtonVariant, { bg: string; text: string; border: string }> = {
  primary: { bg: Colors.primary, text: '#fff', border: Colors.primary },
  success: { bg: Colors.success, text: '#fff', border: Colors.success },
  danger: { bg: Colors.danger, text: '#fff', border: Colors.danger },
  outline: { bg: 'transparent', text: Colors.primary, border: Colors.primary },
  ghost: { bg: 'transparent', text: Colors.text.secondary, border: 'transparent' },
};

const SIZES: Record<ButtonSize, { pv: number; ph: number; fs: number; br: number }> = {
  sm: { pv: 8, ph: 16, fs: 13, br: 8 },
  md: { pv: 13, ph: 20, fs: 15, br: 10 },
  lg: { pv: 16, ph: 24, fs: 17, br: 12 },
};

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  style,
}: ButtonProps) {
  const v = VARIANTS[variant];
  const s = SIZES[size];
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      style={[
        styles.base,
        {
          backgroundColor: v.bg,
          borderColor: v.border,
          paddingVertical: s.pv,
          paddingHorizontal: s.ph,
          borderRadius: s.br,
          opacity: isDisabled ? 0.6 : 1,
        },
        style,
      ]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator size="small" color={v.text} />
      ) : (
        <Text style={[styles.text, { color: v.text, fontSize: s.fs }]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  text: {
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});
