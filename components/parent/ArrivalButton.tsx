import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PickupStatus } from '@/types';
import { Colors } from '@/constants/colors';

interface ArrivalButtonProps {
  status: PickupStatus;
  onArrive: () => void;
  onConfirm: () => void;
  loading?: boolean;
  dismissalActive?: boolean;
  dismissalTime?: Date | null;
}

type IconName = React.ComponentProps<typeof Ionicons>['name'];

interface ButtonConfig {
  label: string;
  sublabel: string;
  icon: IconName;
  color: string;
  disabled: boolean;
  action: 'arrive' | 'wait' | 'confirm' | 'done';
}

const CONFIG: Record<PickupStatus, ButtonConfig> = {
  in_school: {
    label: "I've Arrived",
    sublabel: "Tap when you're at the school",
    icon: 'car',
    color: Colors.primary,
    disabled: false,
    action: 'arrive',
  },
  parent_arrived: {
    label: 'Waiting for Release',
    sublabel: 'Your teacher will release your child shortly',
    icon: 'time',
    color: Colors.warning,
    disabled: true,
    action: 'wait',
  },
  released: {
    label: 'Confirm Pickup',
    sublabel: 'Your child has been released — tap to confirm',
    icon: 'checkmark-circle',
    color: Colors.success,
    disabled: false,
    action: 'confirm',
  },
  picked_up: {
    label: 'Pickup Complete',
    sublabel: 'See you tomorrow!',
    icon: 'shield-checkmark',
    color: Colors.success,
    disabled: true,
    action: 'done',
  },
};

const formatClock = (d: Date) =>
  d.toLocaleTimeString('en-CA', { hour: '2-digit', minute: '2-digit', hour12: true });

export function ArrivalButton({
  status,
  onArrive,
  onConfirm,
  loading = false,
  dismissalActive = true,
  dismissalTime,
}: ArrivalButtonProps) {
  const baseCfg = CONFIG[status];
  const gateForDismissal = status === 'in_school' && !dismissalActive;
  const cfg: ButtonConfig = gateForDismissal
    ? {
        label: 'Dismissal Not Started',
        sublabel: dismissalTime
          ? `Pickup opens around ${formatClock(dismissalTime)}`
          : 'Your teacher will start dismissal shortly',
        icon: 'lock-closed',
        color: Colors.text.secondary,
        disabled: true,
        action: 'wait',
      }
    : baseCfg;

  const handlePress = () => {
    if (cfg.action === 'arrive') onArrive();
    else if (cfg.action === 'confirm') onConfirm();
  };

  return (
    <TouchableOpacity
      style={[styles.button, { backgroundColor: cfg.color }, cfg.disabled && styles.muted]}
      onPress={handlePress}
      disabled={cfg.disabled || loading}
      activeOpacity={0.88}
    >
      {loading ? (
        <ActivityIndicator size="large" color="#fff" />
      ) : (
        <>
          <View style={styles.iconWrap}>
            <Ionicons name={cfg.icon} size={44} color="#fff" />
          </View>
          <Text style={styles.label}>{cfg.label}</Text>
          <Text style={styles.sublabel}>{cfg.sublabel}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 22,
    padding: 36,
    marginHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 190,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 6,
  },
  muted: {
    opacity: 0.85,
  },
  iconWrap: {
    marginBottom: 14,
  },
  label: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  sublabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.82)',
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 240,
  },
});
