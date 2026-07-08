import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { PickupRecord } from '@/types';
import { formatDate, formatTime, formatDuration } from '@/utils/formatTime';

const cardShadow = { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 };

interface PickupRecordCardProps {
  record: PickupRecord;
  showParentName?: boolean;
}

export function PickupRecordCard({ record, showParentName = false }: PickupRecordCardProps) {
  const { arrivedAt, releasedAt, confirmedAt } = record;
  const waitTime = releasedAt ? formatDuration(arrivedAt, releasedAt) : 'Pending';

  return (
    <View className="bg-card rounded-[14px] p-4 mb-3" style={cardShadow}>
      <View className="flex-row items-center justify-between mb-[14px]">
        <View className="flex-row items-center gap-[6px]">
          <Ionicons name="calendar-outline" size={14} color={Colors.primary} />
          <Text className="text-sm font-semibold text-text-primary">
            {formatDate(new Date(record.date))}
          </Text>
        </View>
        <View className="bg-primary-light px-[10px] py-1 rounded-xl">
          <Text className="text-xs font-semibold text-primary">{waitTime}{releasedAt ? ' wait' : ''}</Text>
        </View>
      </View>

      <View className="h-px bg-divider mb-[14px]" />

      <Text className="text-[13px] font-semibold text-text-primary mb-0.5">{record.studentName}</Text>
      {showParentName && (
        <Text className="text-xs text-text-secondary mb-2">{record.parentName}</Text>
      )}
      {!showParentName && <View className="mb-2" />}

      <View>
        <View className="flex-row items-center gap-[10px] mb-0.5">
          <View className="w-2 h-2 rounded-full bg-warning" />
          <Text className="flex-1 text-[13px] text-text-secondary">Parent arrived</Text>
          <Text className="text-[13px] font-semibold text-text-primary">{formatTime(arrivedAt)}</Text>
        </View>
        {releasedAt && (
          <>
            <View className="w-0.5 h-[14px] ml-[3px] mb-0.5 bg-border" />
            <View className="flex-row items-center gap-[10px] mb-0.5">
              <View className="w-2 h-2 rounded-full bg-primary" />
              <Text className="flex-1 text-[13px] text-text-secondary">Child released</Text>
              <Text className="text-[13px] font-semibold text-text-primary">{formatTime(releasedAt)}</Text>
            </View>
          </>
        )}
        {confirmedAt && (
          <>
            <View className="w-0.5 h-[14px] ml-[3px] mb-0.5 bg-success" />
            <View className="flex-row items-center gap-[10px] mb-0.5">
              <View className="w-2 h-2 rounded-full bg-success" />
              <Text className="flex-1 text-[13px] text-text-secondary">Pickup confirmed</Text>
              <Text className="text-[13px] font-semibold text-text-primary">{formatTime(confirmedAt)}</Text>
            </View>
          </>
        )}
      </View>
    </View>
  );
}
