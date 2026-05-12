import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Student, PickupStatus } from '@/types';
import { Colors } from '@/constants/colors';

interface StatsRowProps {
  students: Student[];
}

interface StatItem {
  label: string;
  filter: PickupStatus | 'total';
  color: string;
  bg: string;
}

const STATS: StatItem[] = [
  { label: 'Total', filter: 'total', color: Colors.text.primary, bg: Colors.divider },
  { label: 'Arrived', filter: 'parent_arrived', color: Colors.warning, bg: Colors.warningLight },
  { label: 'Released', filter: 'released', color: Colors.primary, bg: Colors.primaryLight },
  { label: 'Picked Up', filter: 'picked_up', color: Colors.success, bg: Colors.successLight },
];

export function StatsRow({ students }: StatsRowProps) {
  const count = (filter: PickupStatus | 'total'): number => {
    if (filter === 'total') return students.length;
    return students.filter((s) => s.status === filter).length;
  };

  return (
    <View style={styles.row}>
      {STATS.map((stat) => (
        <View key={stat.filter} style={[styles.card, { backgroundColor: stat.bg }]}>
          <Text style={[styles.count, { color: stat.color }]}>{count(stat.filter)}</Text>
          <Text style={[styles.label, { color: stat.color }]}>{stat.label}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  card: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  count: {
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 2,
  },
  label: {
    fontSize: 11,
    fontWeight: '500',
  },
});
