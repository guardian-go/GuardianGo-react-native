import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/auth.store';
import { ArrivalButton } from '@/components/parent/ArrivalButton';
import { StatusTracker } from '@/components/ui/StatusTracker';
import { Card } from '@/components/ui/Card';
import { Colors } from '@/constants/colors';
import { PickupStatus, Student } from '@/types';
import { formatTime } from '@/utils/formatTime';

const MOCK_CHILD: Omit<Student, 'status' | 'statusUpdatedAt'> = {
  id: 'child-demo',
  name: 'Emma Johnson',
  standard: 'Grade 3',
  parentId: 'parent-demo',
  schoolId: 'school-demo',
};

const SCHOOL_NAME = 'Maple Ridge Elementary';
const DISMISSAL_TIME = '3:15 PM';

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function getInitials(name: string): string {
  return name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
}

const STATUS_MESSAGES: Record<PickupStatus, { title: string; body: string }> = {
  in_school: {
    title: 'Ready for pickup?',
    body: `Dismissal begins at ${DISMISSAL_TIME}. Tap the button when you arrive.`,
  },
  parent_arrived: {
    title: "You've arrived!",
    body: "Your teacher has been notified. Please wait for your child to be released.",
  },
  released: {
    title: 'Your child is ready!',
    body: 'Emma has been released. Please confirm pickup when you have them.',
  },
  picked_up: {
    title: 'Pickup complete!',
    body: 'Have a wonderful afternoon with Emma. See you tomorrow!',
  },
};

export default function ParentDashboard() {
  const [status, setStatus] = useState<PickupStatus>('in_school');
  const [arrivedAt, setArrivedAt] = useState<Date | null>(null);
  const [releasedAt, setReleasedAt] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);
  const { user, reset } = useAuthStore();
  const router = useRouter();

  const firstName = user?.name?.split(' ')[0] ?? 'Parent';
  const msg = STATUS_MESSAGES[status];


  const handleArrive = () => {
    setLoading(true);
    setTimeout(() => {
      setStatus('parent_arrived');
      setArrivedAt(new Date());
      setLoading(false);
    }, 800);
  };

  const handleConfirm = () => {
    setLoading(true);
    setTimeout(() => {
      setStatus('picked_up');
      setLoading(false);
    }, 600);
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Header */}
        <View className="flex-row justify-between items-start px-5 pt-5 pb-1">
          <View>
            <Text className="text-sm text-text-secondary mb-0.5">{getGreeting()},</Text>
            <Text className="text-[26px] font-bold text-text-primary">{firstName}</Text>
          </View>
          <View className="flex-row gap-1 mt-1">
            <TouchableOpacity className="p-2" onPress={reset}>
              <Ionicons name="log-out-outline" size={22} color={Colors.text.secondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Status message */}
        <View className="px-5 pt-3 pb-5">
          <Text className="text-[19px] font-bold text-text-primary mb-1.5">{msg.title}</Text>
          <Text className="text-sm text-text-secondary leading-[21px]">{msg.body}</Text>
        </View>

        {/* Child Card */}
        <Card style={{ marginHorizontal: 16, marginBottom: 16 }}>
          <View className="flex-row items-center gap-3">
            <View className="w-[52px] h-[52px] rounded-full bg-primary-light justify-center items-center">
              <Text className="text-[18px] font-bold text-primary">{getInitials(MOCK_CHILD.name)}</Text>
            </View>
            <View className="flex-1">
              <Text className="text-base font-bold text-text-primary mb-0.5">{MOCK_CHILD.name}</Text>
              <Text className="text-[13px] text-text-secondary mb-[3px]">{MOCK_CHILD.standard}</Text>
              <View className="flex-row items-center gap-[3px]">
                <Ionicons name="location-outline" size={12} color={Colors.text.secondary} />
                <Text className="text-xs text-text-secondary">{SCHOOL_NAME}</Text>
              </View>
            </View>
            <View className="flex-row items-center bg-primary-light px-2 py-[5px] rounded-lg gap-1">
              <Ionicons name="time-outline" size={12} color={Colors.primary} />
              <Text className="text-xs font-semibold text-primary">{DISMISSAL_TIME}</Text>
            </View>
          </View>
        </Card>

        {/* Status Tracker */}
        {status !== 'in_school' && (
          <Card style={{ marginHorizontal: 16, marginBottom: 12 }}>
            <Text className="text-sm font-semibold text-text-secondary mb-1">Pickup Progress</Text>
            <StatusTracker status={status} />
            {arrivedAt && (
              <View className="flex-row items-center justify-center pt-1 gap-2">
                <Text className="text-xs text-text-secondary">Arrived</Text>
                <Text className="text-xs font-semibold text-text-primary">{formatTime(arrivedAt)}</Text>
                {releasedAt && (
                  <>
                    <View className="w-[3px] h-[3px] rounded-full bg-border" />
                    <Text className="text-xs text-text-secondary">Released</Text>
                    <Text className="text-xs font-semibold text-text-primary">{formatTime(releasedAt)}</Text>
                  </>
                )}
              </View>
            )}
          </Card>
        )}

        {/* Demo waiting indicator */}
        {status === 'parent_arrived' && (
          <View className="flex-row items-center bg-primary-light mx-4 mb-4 px-3 py-[10px] rounded-[10px] gap-[6px]">
            <Ionicons name="information-circle-outline" size={14} color={Colors.primary} />
            <Text className="text-xs text-primary">Demo: Teacher will release in ~6 seconds</Text>
          </View>
        )}

        {/* Arrival Button */}
        <ArrivalButton
          status={status}
          onArrive={handleArrive}
          onConfirm={handleConfirm}
          loading={loading}
        />

        {/* Info footer */}
        <View className="flex-row items-start px-5 pt-6 gap-[6px]">
          <Ionicons name="shield-checkmark-outline" size={14} color={Colors.text.light} />
          <Text className="flex-1 text-[11px] text-text-light leading-4">
            All pickup records are stored securely in compliance with PIPEDA
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
