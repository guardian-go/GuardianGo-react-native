import React, { useMemo } from 'react';
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
import { PickupRecord } from '@/types';
import { formatTime, formatDate } from '@/utils/formatTime';

type EventKind = 'arrived' | 'released' | 'confirmed';

interface FeedEvent {
  id: string;
  studentName: string;
  parentName: string;
  kind: EventKind;
  timestamp: Date;
}

const EVENT_CONFIG: Record<EventKind, { label: string; color: string; icon: React.ComponentProps<typeof Ionicons>['name'] }> = {
  arrived: { label: 'Parent arrived', color: Colors.warning, icon: 'car' },
  released: { label: 'Released by teacher', color: Colors.primary, icon: 'arrow-forward-circle' },
  confirmed: { label: 'Pickup confirmed', color: Colors.success, icon: 'checkmark-circle' },
};

const cardShadow = { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1 };

function recordToEvents(record: PickupRecord): FeedEvent[] {
  const events: FeedEvent[] = [
    { id: `${record.id}-arrived`, studentName: record.studentName, parentName: record.parentName, kind: 'arrived', timestamp: record.arrivedAt },
  ];
  if (record.releasedAt) {
    events.push({ id: `${record.id}-released`, studentName: record.studentName, parentName: record.parentName, kind: 'released', timestamp: record.releasedAt });
  }
  if (record.confirmedAt) {
    events.push({ id: `${record.id}-confirmed`, studentName: record.studentName, parentName: record.parentName, kind: 'confirmed', timestamp: record.confirmedAt });
  }
  return events;
}

function EventItem({ event, isLast }: { event: FeedEvent; isLast: boolean }) {
  const cfg = EVENT_CONFIG[event.kind];

  return (
    <View className="flex-row gap-3">
      <View className="items-center w-[14px]">
        <View className="w-3 h-3 rounded-full mt-4 shrink-0" style={{ backgroundColor: cfg.color }} />
        {!isLast && <View className="w-0.5 flex-1 bg-border mt-1" />}
      </View>
      <View
        className={`flex-1 bg-card rounded-xl p-[14px] ${isLast ? 'mb-0' : 'mb-[10px]'}`}
        style={cardShadow}
      >
        <View className="flex-row items-center mb-2 gap-[6px]">
          <View
            className="w-[26px] h-[26px] rounded-[13px] justify-center items-center"
            style={{ backgroundColor: cfg.color + '18' }}
          >
            <Ionicons name={cfg.icon} size={16} color={cfg.color} />
          </View>
          <Text className="flex-1 text-[13px] font-semibold" style={{ color: cfg.color }}>
            {cfg.label}
          </Text>
          <Text className="text-xs text-text-light">{formatTime(event.timestamp)}</Text>
        </View>
        <Text className="text-[15px] font-semibold text-text-primary mb-0.5">{event.studentName}</Text>
        <Text className="text-xs text-text-secondary">{event.parentName}</Text>
      </View>
    </View>
  );
}

export default function ActivityScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { records, isLoading } = useActivityFeed(user?.schoolId, user?.standard);

  const profileIncomplete = !user?.schoolId || !user?.standard;
  const today = formatDate(new Date());

  const events = useMemo(() => {
    return records
      .flatMap(recordToEvents)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [records]);

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
          <Text className="text-xs font-semibold text-primary">{today}</Text>
        </View>
      </View>

      <View className="px-5 pb-4">
        <Text className="text-[13px] text-text-secondary">{events.length} events today</Text>
      </View>

      {isLoading ? (
        <View className="items-center pt-[40px]">
          <ActivityIndicator size="small" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={events}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <EventItem event={item} isLast={index === events.length - 1} />
          )}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View className="items-center pt-[40px] gap-3">
              <Ionicons name="time-outline" size={44} color={Colors.text.light} />
              <Text className="text-[15px] text-text-secondary">No events yet today</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
