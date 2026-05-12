import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PickupStatus } from '@/types';
import { Colors } from '@/constants/colors';

const STATUS_LABELS: Record<PickupStatus, string> = {
  in_school: 'In School',
  parent_arrived: 'Arrived',
  released: 'Released',
  picked_up: 'Picked Up',
};

const STATUS_COLORS: Record<PickupStatus, { bg: string; text: string }> = {
  in_school: { bg: Colors.status.in_schoolBg, text: Colors.status.in_school },
  parent_arrived: { bg: Colors.status.parent_arrivedBg, text: Colors.status.parent_arrived },
  released: { bg: Colors.status.releasedBg, text: Colors.status.released },
  picked_up: { bg: Colors.status.picked_upBg, text: Colors.status.picked_up },
};

interface BadgeProps {
  status: PickupStatus;
  size?: 'sm' | 'md';
}

export function Badge({ status, size = 'md' }: BadgeProps) {
  const { bg, text } = STATUS_COLORS[status];

  return (
    <View style={[styles.badge, { backgroundColor: bg }, size === 'sm' && styles.small]}>
      <Text style={[styles.text, { color: text }, size === 'sm' && styles.smallText]}>
        {STATUS_LABELS[status]}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  small: {
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  text: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  smallText: {
    fontSize: 11,
  },
});
