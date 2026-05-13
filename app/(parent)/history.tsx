import React from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/auth.store';
import { usePickupHistory } from '@/hooks/usePickupHistory';
import { Colors } from '@/constants/colors';
import { PickupRecord } from '@/types';
import { formatDate, formatTime, formatDuration } from '@/utils/formatTime';

const cardShadow = { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 };

function HistoryCard({ record }: { record: PickupRecord }) {
  const arrivedAt = record.arrivedAt;
  const releasedAt = record.releasedAt;
  const confirmedAt = record.confirmedAt;
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

      <Text className="text-[13px] font-semibold text-text-primary mb-2">{record.studentName}</Text>

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

export default function HistoryScreen() {
  const { user } = useAuthStore();
  const { records, isLoading } = usePickupHistory(user?.id);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-row items-center justify-center px-4 py-4">
        <Text className="text-xl font-bold text-text-primary">Pickup History</Text>
      </View>

      {isLoading ? (
        <View className="items-center pt-[60px]">
          <ActivityIndicator size="small" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={records}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <HistoryCard record={item} />}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View className="items-center pt-[60px] gap-3">
              <Ionicons name="time-outline" size={44} color={Colors.text.light} />
              <Text className="text-[15px] text-text-secondary">No pickup history yet</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
