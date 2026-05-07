import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { formatDate, formatTime, formatDuration } from '@/utils/formatTime';

interface HistoryRecord {
  id: string;
  studentName: string;
  date: string;
  arrivedAt: Date;
  releasedAt: Date;
  confirmedAt: Date;
}

const MOCK_HISTORY: HistoryRecord[] = [
  {
    id: '1',
    studentName: 'Emma Johnson',
    date: '2026-05-03',
    arrivedAt: new Date('2026-05-03T15:06:00'),
    releasedAt: new Date('2026-05-03T15:13:00'),
    confirmedAt: new Date('2026-05-03T15:14:00'),
  },
];

const cardShadow = { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 };

function HistoryCard({ record }: { record: HistoryRecord }) {
  const waitTime = formatDuration(record.arrivedAt, record.releasedAt);

  return (
    <View className="bg-card rounded-[14px] p-4 mb-3" style={cardShadow}>
      <View className="flex-row items-center justify-between mb-[14px]">
        <View className="flex-row items-center gap-[6px]">
          <Ionicons name="calendar-outline" size={14} color={Colors.primary} />
          <Text className="text-sm font-semibold text-text-primary">{formatDate(new Date(record.date))}</Text>
        </View>
        <View className="bg-primary-light px-[10px] py-1 rounded-xl">
          <Text className="text-xs font-semibold text-primary">{waitTime} wait</Text>
        </View>
      </View>

      <View className="h-px bg-divider mb-[14px]" />

      <View>
        <View className="flex-row items-center gap-[10px] mb-0.5">
          <View className="w-2 h-2 rounded-full bg-warning" />
          <Text className="flex-1 text-[13px] text-text-secondary">Parent arrived</Text>
          <Text className="text-[13px] font-semibold text-text-primary">{formatTime(record.arrivedAt)}</Text>
        </View>
        <View className="w-0.5 h-[14px] ml-[3px] mb-0.5 bg-border" />
        <View className="flex-row items-center gap-[10px] mb-0.5">
          <View className="w-2 h-2 rounded-full bg-primary" />
          <Text className="flex-1 text-[13px] text-text-secondary">Child released</Text>
          <Text className="text-[13px] font-semibold text-text-primary">{formatTime(record.releasedAt)}</Text>
        </View>
        <View className="w-0.5 h-[14px] ml-[3px] mb-0.5 bg-success" />
        <View className="flex-row items-center gap-[10px] mb-0.5">
          <View className="w-2 h-2 rounded-full bg-success" />
          <Text className="flex-1 text-[13px] text-text-secondary">Pickup confirmed</Text>
          <Text className="text-[13px] font-semibold text-text-primary">{formatTime(record.confirmedAt)}</Text>
        </View>
      </View>
    </View>
  );
}

export default function HistoryScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-row items-center justify-between px-4 py-4">
        <TouchableOpacity onPress={() => router.back()} className="p-1">
          <Ionicons name="chevron-back" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <View>
          <Text className="text-xl font-bold text-text-primary text-center">Pickup History</Text>
          <Text className="text-[13px] text-text-secondary text-center mt-0.5">Emma Johnson · Grade 3</Text>
        </View>
        <View className="w-8" />
      </View>

      <FlatList
        data={MOCK_HISTORY}
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
    </SafeAreaView>
  );
}
