import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Student } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { Colors } from '@/constants/colors';
import { formatRelativeTime } from '@/utils/formatTime';

interface StudentCardProps {
  student: Student;
  onRelease?: (student: Student) => void;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function StudentCard({ student, onRelease }: StudentCardProps) {
  const canRelease = student.status === 'parent_arrived';
  const isPickedUp = student.status === 'picked_up';

  return (
    <View style={styles.card}>
      <View style={styles.avatar}>
        <Text style={styles.initials}>{getInitials(student.name)}</Text>
      </View>

      <View style={styles.info}>
        <Text style={styles.name}>{student.name}</Text>
        <Text style={styles.standard}>{student.standard}</Text>
        <View style={styles.statusRow}>
          <Badge status={student.status} size="sm" />
          <Text style={styles.time}>
            {formatRelativeTime(
              student.statusUpdatedAt instanceof Date
                ? student.statusUpdatedAt
                : new Date()
            )}
          </Text>
        </View>
      </View>

      {canRelease && onRelease && (
        <TouchableOpacity
          style={styles.releaseBtn}
          onPress={() => onRelease(student)}
          activeOpacity={0.85}
        >
          <Ionicons name="checkmark-circle" size={18} color="#fff" />
          <Text style={styles.releaseBtnText}>Release</Text>
        </TouchableOpacity>
      )}

      {student.status === 'released' && (
        <View style={styles.waitingIcon}>
          <Ionicons name="time-outline" size={22} color={Colors.primary} />
        </View>
      )}

      {isPickedUp && (
        <Ionicons name="checkmark-circle" size={26} color={Colors.success} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  initials: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 2,
  },
  standard: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginBottom: 6,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  time: {
    fontSize: 11,
    color: Colors.text.light,
  },
  releaseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 5,
  },
  releaseBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  waitingIcon: {
    padding: 6,
  },
});
