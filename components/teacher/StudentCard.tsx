import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AlternatePickup, Student } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { Colors } from '@/constants/colors';
import { formatRelativeTime } from '@/utils/formatTime';
import { getAlternatePickups } from '@/services/alternatePickup.service';

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
  const [expanded, setExpanded] = useState(false);
  const [alternates, setAlternates] = useState<AlternatePickup[]>([]);
  const [loadingAlternates, setLoadingAlternates] = useState(false);

  const handleExpand = async () => {
    if (expanded) { setExpanded(false); return; }
    setExpanded(true);
    if (alternates.length > 0) return;
    setLoadingAlternates(true);
    try {
      const all = await getAlternatePickups(student.parentId);
      setAlternates(all.filter((a) => a.studentId === student.id));
    } finally {
      setLoadingAlternates(false);
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.mainRow}>
        <View style={styles.avatar}>
          {student.photoUrl ? (
            <Image source={{ uri: student.photoUrl }} style={styles.avatarImage} />
          ) : (
            <Text style={styles.initials}>{getInitials(student.name)}</Text>
          )}
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

      <TouchableOpacity style={styles.expandTrigger} onPress={handleExpand}>
        <Ionicons name="people-outline" size={13} color={Colors.text.light} />
        <Text style={styles.expandLabel}>Who's picking</Text>
        <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={13} color={Colors.text.light} />
      </TouchableOpacity>

      {expanded && (
        <View style={styles.pickupSection}>
          {loadingAlternates ? (
            <ActivityIndicator size="small" color={Colors.primary} />
          ) : (
            <>
              <View style={styles.pickupRow}>
                <View style={[styles.personAvatar, { backgroundColor: Colors.primaryLight }]}>
                  <Text style={styles.personInitials}>{getInitials(student.parentName ?? '?')}</Text>
                </View>
                <Text style={styles.personName}>{student.parentName ?? '—'}</Text>
                <View style={[styles.personBadge, { backgroundColor: Colors.primaryLight }]}>
                  <Text style={[styles.personBadgeText, { color: Colors.primary }]}>Primary</Text>
                </View>
              </View>
              {alternates.map((a) => (
                <View key={a.id} style={styles.pickupRow}>
                  <Image source={{ uri: a.photoUrl }} style={styles.personAvatar} />
                  <Text style={styles.personName}>{a.fullName}</Text>
                  <View style={[styles.personBadge, { backgroundColor: Colors.border }]}>
                    <Text style={[styles.personBadgeText, { color: Colors.text.secondary }]}>Alternate</Text>
                  </View>
                </View>
              ))}
              {alternates.length === 0 && (
                <Text style={styles.noAlternates}>No alternate pickup persons added</Text>
              )}
            </>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
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
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  expandTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  expandLabel: {
    flex: 1,
    fontSize: 12,
    color: Colors.text.light,
  },
  pickupSection: {
    marginTop: 8,
    gap: 8,
  },
  pickupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  personAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  personInitials: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  personName: {
    flex: 1,
    fontSize: 13,
    color: Colors.text.primary,
  },
  personBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  personBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  noAlternates: {
    fontSize: 12,
    color: Colors.text.light,
    fontStyle: 'italic',
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  avatarImage: {
    width: 46,
    height: 46,
    borderRadius: 23,
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
