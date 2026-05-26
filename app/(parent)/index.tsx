import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/auth.store';
import { useChildStudent } from '@/hooks/useStudent';
import { useGradeTeacher } from '@/hooks/useGradeTeacher';
import { useDismissalCycle } from '@/hooks/useDismissalCycle';
import { ArrivalButton } from '@/components/parent/ArrivalButton';
import { StatusTracker } from '@/components/ui/StatusTracker';
import { Card } from '@/components/ui/Card';
import { Colors } from '@/constants/colors';
import { PickupStatus } from '@/types';
import { formatTime } from '@/utils/formatTime';
import { updateStudentStatus } from '@/services/student.service';
import {
  createPickupRecord,
  confirmPickupRecord,
} from '@/services/record.service';

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function getInitials(name: string): string {
  return name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
}

const STATUS_MESSAGES: Record<PickupStatus, (childName: string) => { title: string; body: string }> = {
  in_school: () => ({
    title: 'Ready for pickup?',
    body: 'Tap the button below when you arrive at the school.',
  }),
  parent_arrived: () => ({
    title: "You've arrived!",
    body: 'Your teacher has been notified. Please wait for your child to be released.',
  }),
  released: (name) => ({
    title: 'Your child is ready!',
    body: `${name} has been released. Please confirm pickup when you have them.`,
  }),
  picked_up: (name) => ({
    title: 'Pickup complete!',
    body: `Have a wonderful afternoon with ${name}. See you tomorrow!`,
  }),
};

export default function ParentDashboard() {
  const router = useRouter();
  const { user } = useAuthStore();

  const { student, isLoading: studentLoading } = useChildStudent(user?.childId);
  const { teacher } = useGradeTeacher(student?.schoolId, student?.standard);
  const { cycle, isActive: dismissalActive } = useDismissalCycle(
    student?.schoolId,
    student?.standard,
  );

  const [acting, setActing] = useState(false);

  const status: PickupStatus = student?.status ?? 'in_school';
  const firstName = user?.name?.split(' ')[0] ?? 'Parent';

  const arrivedAt = useMemo(
    () => (status !== 'in_school' && student?.statusUpdatedAt
      ? (student.statusUpdatedAt as any)?.toDate?.() ?? new Date(student.statusUpdatedAt as any)
      : null),
    [status, student?.statusUpdatedAt]
  );

  const profileIncomplete = !user?.childId || !student;

  const handleArrive = async () => {
    if (!user || !student) return;
    if (!dismissalActive) {
      Alert.alert(
        'Dismissal not started',
        "Your teacher hasn't opened today's dismissal yet. You'll be able to tap once it's active.",
      );
      return;
    }
    setActing(true);
    try {
      await createPickupRecord(student, user);
      await updateStudentStatus(student.id, 'parent_arrived');
    } catch (e: any) {
      Alert.alert('Could not record arrival', e?.message ?? 'Please try again.');
    } finally {
      setActing(false);
    }
  };

  const handleConfirm = async () => {
    if (!student) return;
    setActing(true);
    try {
      await confirmPickupRecord(student.id);
      await updateStudentStatus(student.id, 'picked_up');
    } catch (e: any) {
      Alert.alert('Could not confirm pickup', e?.message ?? 'Please try again.');
    } finally {
      setActing(false);
    }
  };

  if (studentLoading) {
    return (
      <SafeAreaView className="flex-1 bg-background justify-center items-center">
        <ActivityIndicator size="small" color={Colors.primary} />
      </SafeAreaView>
    );
  }

  if (profileIncomplete) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <ScrollView contentContainerStyle={{ padding: 20 }}>
          <Text className="text-sm text-text-secondary mb-1">{getGreeting()},</Text>
          <Text className="text-[26px] font-bold text-text-primary mb-6">{firstName}</Text>

          <Card style={{ padding: 20 }}>
            <View className="items-center mb-4">
              <View className="w-16 h-16 rounded-full bg-primary-light justify-center items-center mb-3">
                <Ionicons name="person-add" size={28} color={Colors.primary} />
              </View>
              <Text className="text-[17px] font-bold text-text-primary mb-1 text-center">
                Link your child
              </Text>
              <Text className="text-[13px] text-text-secondary text-center leading-5">
                We need your school code, grade, and child's name before we can show pickup status.
              </Text>
            </View>
            <TouchableOpacity
              className="bg-primary py-[13px] rounded-[10px]"
              onPress={() => router.push('/(parent)/profile')}
            >
              <Text className="text-white text-center font-semibold text-[15px]">
                Open profile
              </Text>
            </TouchableOpacity>
          </Card>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const msg = STATUS_MESSAGES[status](student.name);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <View className="flex-row justify-between items-start px-5 pt-5 pb-1">
          <View>
            <Text className="text-sm text-text-secondary mb-0.5">{getGreeting()},</Text>
            <Text className="text-[26px] font-bold text-text-primary">{firstName}</Text>
          </View>
          <TouchableOpacity
            className="p-2 mt-1"
            onPress={() => router.push('/(parent)/profile')}
          >
            <Ionicons name="person-circle-outline" size={26} color={Colors.text.secondary} />
          </TouchableOpacity>
        </View>

        <View className="px-5 pt-3 pb-5">
          <Text className="text-[19px] font-bold text-text-primary mb-1.5">{msg.title}</Text>
          <Text className="text-sm text-text-secondary leading-[21px]">{msg.body}</Text>
        </View>

        <Card style={{ marginHorizontal: 16, marginBottom: 16 }}>
          <View className="flex-row items-center gap-3">
            <View className="w-[52px] h-[52px] rounded-full bg-primary-light justify-center items-center overflow-hidden">
              {student.photoUrl ? (
                <Image source={{ uri: student.photoUrl }} style={{ width: 52, height: 52, borderRadius: 26 }} />
              ) : (
                <Text className="text-[18px] font-bold text-primary">{getInitials(student.name)}</Text>
              )}
            </View>
            <View className="flex-1">
              <Text className="text-base font-bold text-text-primary mb-0.5">{student.name}</Text>
              <Text className="text-[13px] text-text-secondary mb-[3px]">{student.standard}</Text>
              <View className="flex-row items-center gap-[3px]">
                <Ionicons name="business-outline" size={12} color={Colors.text.secondary} />
                <Text className="text-xs text-text-secondary">{student.schoolId}</Text>
              </View>
            </View>
          </View>

          {teacher && (
            <View className="mt-3 pt-3 border-t border-divider flex-row items-center gap-2">
              <View className="w-6 h-6 rounded-full bg-primary-light justify-center items-center overflow-hidden">
                {teacher.photoUrl ? (
                  <Image source={{ uri: teacher.photoUrl }} style={{ width: 24, height: 24, borderRadius: 12 }} />
                ) : (
                  <Ionicons name="school-outline" size={13} color={Colors.primary} />
                )}
              </View>
              <Text className="text-xs text-text-secondary">Grade teacher:</Text>
              <Text className="text-xs font-semibold text-text-primary flex-1">{teacher.name}</Text>
            </View>
          )}
        </Card>

        {status !== 'in_school' && (
          <Card style={{ marginHorizontal: 16, marginBottom: 12 }}>
            <Text className="text-sm font-semibold text-text-secondary mb-1">Pickup Progress</Text>
            <StatusTracker status={status} />
            {arrivedAt && (
              <View className="flex-row items-center justify-center pt-1 gap-2">
                <Text className="text-xs text-text-secondary">Updated</Text>
                <Text className="text-xs font-semibold text-text-primary">{formatTime(arrivedAt)}</Text>
              </View>
            )}
          </Card>
        )}

        <ArrivalButton
          status={status}
          onArrive={handleArrive}
          onConfirm={handleConfirm}
          loading={acting}
          dismissalActive={dismissalActive}
          dismissalTime={cycle?.dismissalTime ?? null}
        />

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
