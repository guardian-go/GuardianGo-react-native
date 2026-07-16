import React, { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { Button } from '@/components/ui/Button';

interface DismissalControlModalProps {
  visible: boolean;
  active: boolean;
  dismissalTime?: Date | null;
  hasActivatedToday?: boolean;
  onClose: () => void;
  onSubmit: (input: { active: boolean; dismissalTime: Date }) => Promise<void> | void;
}

const PRESETS: Array<{ label: string; hour: number; minute: number }> = [
  { label: '3:00 PM', hour: 15, minute: 0 },
  { label: '3:15 PM', hour: 15, minute: 15 }
];

const clamp = (n: number, min: number, max: number) =>
  Math.max(min, Math.min(max, n));

const pad = (n: number) => String(n).padStart(2, '0');

const buildDate = (hour24: number, minute: number) => {
  const d = new Date();
  d.setHours(hour24, minute, 0, 0);
  return d;
};

export function DismissalControlModal({
  visible,
  active,
  dismissalTime,
  hasActivatedToday = false,
  onClose,
  onSubmit,
}: DismissalControlModalProps) {
  const seed = dismissalTime ?? buildDate(15, 0);

  const [nextActive, setNextActive] = useState<boolean>(active);
  const [hour12, setHour12] = useState<number>(((seed.getHours() + 11) % 12) + 1);
  const [minute, setMinute] = useState<number>(seed.getMinutes());
  const [period, setPeriod] = useState<'AM' | 'PM'>(seed.getHours() >= 12 ? 'PM' : 'AM');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!visible) return;
    const seedDate = dismissalTime ?? buildDate(15, 0);
    setNextActive(active);
    setHour12(((seedDate.getHours() + 11) % 12) + 1);
    setMinute(seedDate.getMinutes());
    setPeriod(seedDate.getHours() >= 12 ? 'PM' : 'AM');
  }, [visible, active, dismissalTime]);

  const hour24 = useMemo(() => {
    const h = hour12 % 12;
    return period === 'PM' ? h + 12 : h;
  }, [hour12, period]);

  const canGoActive = !hasActivatedToday;
  const canSubmit = canGoActive || !nextActive;

  const handleHourChange = (text: string) => {
    const digits = text.replace(/\D/g, '').slice(0, 2);
    if (!digits) {
      setHour12(0);
      return;
    }
    setHour12(clamp(parseInt(digits, 10) || 0, 0, 12));
  };

  const handleMinuteChange = (text: string) => {
    const digits = text.replace(/\D/g, '').slice(0, 2);
    if (!digits) {
      setMinute(0);
      return;
    }
    setMinute(clamp(parseInt(digits, 10) || 0, 0, 59));
  };

  const applyPreset = (p: { hour: number; minute: number }) => {
    setHour12(((p.hour + 11) % 12) + 1);
    setMinute(p.minute);
    setPeriod(p.hour >= 12 ? 'PM' : 'AM');
  };

  const handleSubmit = async () => {
    const safeHour = hour12 < 1 || hour12 > 12 ? 3 : hour12;
    setSubmitting(true);
    try {
      await onSubmit({
        active: nextActive,
        dismissalTime: buildDate(
          (safeHour % 12) + (period === 'PM' ? 12 : 0),
          minute,
        ),
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.backdrop}
      >
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>Dismissal cycle</Text>
            <TouchableOpacity onPress={onClose} hitSlop={10}>
              <Ionicons name="close" size={22} color={Colors.text.secondary} />
            </TouchableOpacity>
          </View>

          <Text style={styles.caption}>
            {hasActivatedToday
              ? "Dismissal has already been started today, so it can only run once. You can still pause it, but it can't be reactivated until tomorrow."
              : "Tap a preset or enter the time you'd like dismissal to run today."}
          </Text>

          <View style={styles.toggleRow}>
            <TouchableOpacity
              disabled={!canGoActive}
              style={[
                styles.toggleChip,
                nextActive && styles.toggleChipActive,
                !canGoActive && styles.toggleChipDisabled,
              ]}
              onPress={() => {
                setNextActive(true);
                const now = new Date();
                setHour12(((now.getHours() + 11) % 12) + 1);
                setMinute(now.getMinutes());
                setPeriod(now.getHours() >= 12 ? 'PM' : 'AM');
              }}
            >
              <View
                style={[
                  styles.dot,
                  { backgroundColor: nextActive ? Colors.success : Colors.text.light },
                ]}
              />
              <Text
                style={[
                  styles.toggleText,
                  nextActive && { color: Colors.text.primary },
                ]}
              >
                Active
              </Text>
              {!canGoActive && (
                <Ionicons name="lock-closed" size={12} color={Colors.text.light} />
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleChip, !nextActive && styles.toggleChipActive]}
              onPress={() => setNextActive(false)}
            >
              <View
                style={[
                  styles.dot,
                  { backgroundColor: !nextActive ? Colors.danger : Colors.text.light },
                ]}
              />
              <Text
                style={[
                  styles.toggleText,
                  !nextActive && { color: Colors.text.primary },
                ]}
              >
                Paused
              </Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.timeRow, !canGoActive && styles.disabledSection]}>
            <View style={styles.timeBox}>
              <Text style={styles.timeLabel}>Hour</Text>
              <TextInput
                style={styles.timeInput}
                keyboardType="number-pad"
                maxLength={2}
                value={String(hour12 || '')}
                onChangeText={handleHourChange}
                placeholder="3"
                placeholderTextColor={Colors.text.light}
                editable={canGoActive}
              />
            </View>
            <Text style={styles.timeSep}>:</Text>
            <View style={styles.timeBox}>
              <Text style={styles.timeLabel}>Minute</Text>
              <TextInput
                style={styles.timeInput}
                keyboardType="number-pad"
                maxLength={2}
                value={String(minute || '')}
                onChangeText={handleMinuteChange}
                placeholder="00"
                placeholderTextColor={Colors.text.light}
                editable={canGoActive}
              />
            </View>
            <View style={styles.periodGroup}>
              {(['AM', 'PM'] as const).map((p) => (
                <TouchableOpacity
                  key={p}
                  disabled={!canGoActive}
                  style={[styles.periodChip, period === p && styles.periodChipActive]}
                  onPress={() => setPeriod(p)}
                >
                  <Text
                    style={[
                      styles.periodText,
                      period === p && { color: '#fff' },
                    ]}
                  >
                    {p}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={[styles.presetRow, !canGoActive && styles.disabledSection]}>
            {PRESETS.map((p) => {
              const isSelected = hour24 === p.hour && minute === p.minute;
              return (
                <TouchableOpacity
                  key={p.label}
                  disabled={!canGoActive}
                  style={[styles.preset, isSelected && styles.presetActive]}
                  onPress={() => applyPreset(p)}
                >
                  <Text
                    style={[
                      styles.presetText,
                      isSelected && { color: '#fff' },
                    ]}
                  >
                    {p.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Button
            title={nextActive ? 'Save & Activate' : 'Save Paused'}
            onPress={handleSubmit}
            loading={submitting}
            disabled={!canSubmit}
            variant={nextActive ? 'success' : 'primary'}
            style={{ marginTop: 18 }}
          />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 22,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  caption: {
    fontSize: 13,
    color: Colors.text.secondary,
    marginBottom: 16,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 18,
  },
  toggleChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingVertical: 12,
  },
  toggleChipActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '14',
  },
  toggleChipDisabled: {
    opacity: 0.5,
  },
  disabledSection: {
    opacity: 0.5,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.secondary,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    marginBottom: 14,
  },
  timeBox: {
    flex: 1,
  },
  timeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text.secondary,
    marginBottom: 6,
  },
  timeInput: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 12,
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    color: Colors.text.primary,
    backgroundColor: Colors.background,
  },
  timeSep: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text.primary,
    paddingBottom: 14,
  },
  periodGroup: {
    flexDirection: 'column',
    gap: 6,
    marginLeft: 4,
    paddingBottom: 2,
  },
  periodChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    minWidth: 48,
  },
  periodChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  periodText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text.secondary,
  },
  presetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  preset: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: '#fff',
  },
  presetActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  presetText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text.secondary,
  },
});
