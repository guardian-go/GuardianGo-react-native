import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Student } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { Colors } from '@/constants/colors';
import { getInitials } from '@/utils/formatTime';

interface Props {
  student: Student;
  onPress: () => void;
}

export function ChildSummaryCard({ student, onPress }: Props) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.72}>
      {student.photoUrl ? (
        <Image source={{ uri: student.photoUrl }} style={styles.avatar} />
      ) : (
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.initials}>{getInitials(student.name)}</Text>
        </View>
      )}

      <View style={styles.info}>
        <Text style={styles.name}>{student.name}</Text>
        <Text style={styles.grade}>{student.standard}</Text>
      </View>

      <Badge status={student.status} size="sm" />
      <Ionicons name="chevron-forward" size={16} color={Colors.text.light} style={{ marginLeft: 6 }} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 10,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
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
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 3,
  },
  grade: {
    fontSize: 13,
    color: Colors.text.secondary,
  },
});
