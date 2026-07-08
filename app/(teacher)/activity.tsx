import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/auth.store';
import { useActivityFeed } from '@/hooks/useActivityFeed';
import { Colors } from '@/constants/colors';
import { PickupRecordCard } from '@/components/ui/PickupRecordCard';

const RANGE_OPTIONS: Array<{ label: string; days: number }> = [
  { label: 'Today', days: 1 },
  { label: '2 Days', days: 2 },
  { label: '3 Days', days: 3 },
  { label: '5 Days', days: 5 },
];

export default function ActivityScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [days, setDays] = useState(1);
  const { records, isLoading } = useActivityFeed(user?.schoolId, user?.standard, days);

  const profileIncomplete = !user?.schoolId || !user?.standard;
  const rangeLabel = RANGE_OPTIONS.find((r) => r.days === days)?.label ?? 'Today';

  if (profileIncomplete) {
    return (
      <SafeAreaView className="flex-1 bg-background justify-center items-center px-6">
        <Ionicons name="settings-outline" size={48} color={Colors.text.light} />
        <Text className="text-[16px] font-semibold text-text-primary mt-4 mb-1 text-center">
          Set up your class first
        </Text>
        <Text className="text-[13px] text-text-secondary text-center mb-5">
          Add your school code and grade in Profile to see today's activity.
        </Text>
        <TouchableOpacity
          className="bg-primary px-5 py-3 rounded-[10px]"
          onPress={() => router.push('/(teacher)/profile')}
        >
          <Text className="text-white font-semibold">Open profile</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-row items-center justify-between px-5 pt-5 pb-2">
        <Text className="text-[26px] font-bold text-text-primary">Activity Log</Text>
        <View className="flex-row items-center bg-primary-light px-[10px] py-[5px] rounded-full gap-[5px]">
          <Ionicons name="calendar-outline" size={13} color={Colors.primary} />
          <Text className="text-xs font-semibold text-primary">{rangeLabel}</Text>
        </View>
      </View>

      <View className="flex-row gap-2 px-5 pb-4">
        {RANGE_OPTIONS.map((opt) => {
          const isSelected = opt.days === days;
          return (
            <TouchableOpacity
              key={opt.label}
              onPress={() => setDays(opt.days)}
              className={`px-3 py-[7px] rounded-full border ${
                isSelected ? 'bg-primary border-primary' : 'bg-card border-border'
              }`}
            >
              <Text
                className={`text-xs font-semibold ${
                  isSelected ? 'text-white' : 'text-text-secondary'
                }`}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View className="px-5 pb-4">
        <Text className="text-[13px] text-text-secondary">{records.length} pickups in this range</Text>
      </View>

      {isLoading ? (
        <View className="items-center pt-[40px]">
          <ActivityIndicator size="small" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={records}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <PickupRecordCard record={item} showParentName />}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View className="items-center pt-[40px] gap-3">
              <Ionicons name="time-outline" size={44} color={Colors.text.light} />
              <Text className="text-[15px] text-text-secondary">No activity in this range</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
