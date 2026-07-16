import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/auth.store';
import { useStudents } from '@/hooks/useStudent';
import { useDismissalCycle } from '@/hooks/useDismissalCycle';
import { StatsRow } from '@/components/teacher/StatsRow';
import { DismissalControlModal } from '@/components/teacher/DismissalControlModal';
import { SendMessageModal } from '@/components/teacher/SendMessageModal';
import { Card } from '@/components/ui/Card';
import { Colors } from '@/constants/colors';
import { PickupStatus, Student } from '@/types';
import { formatTime, formatRelativeTime } from '@/utils/formatTime';
import { setDismissalCycle } from '@/services/dismissal.service';
import { sendBroadcastMessage } from '@/services/message.service';

const shadowMd = { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 };
const shadowSm = { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1 };

const STATUS_LABEL: Record<PickupStatus, string> = {
  in_school: 'In school',
  parent_arrived: 'Parent arrived',
  released: 'Released by teacher',
  picked_up: 'Picked up',
};

const STATUS_ICON: Record<PickupStatus, { icon: React.ComponentProps<typeof Ionicons>['name']; color: string }> = {
  in_school: { icon: 'school-outline', color: Colors.text.secondary },
  parent_arrived: { icon: 'car', color: Colors.warning },
  released: { icon: 'arrow-forward-circle', color: Colors.primary },
  picked_up: { icon: 'checkmark-circle', color: Colors.success },
};

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

const toDate = (v: any): Date =>
  v?.toDate?.() ?? (v instanceof Date ? v : new Date(v));

export default function TeacherOverviewScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { students, isLoading } = useStudents();
  const { cycle, isActive: dismissalActive, hasActivatedToday } = useDismissalCycle(
    user?.schoolId,
    user?.standard,
  );

  const profileIncomplete = !user?.schoolId || !user?.standard;

  const arrivedCount = students.filter((s) => s.status === 'parent_arrived').length;
  const dismissalTimeLabel = cycle?.dismissalTime
    ? formatTime(cycle.dismissalTime)
    : null;
  const activatedAtLabel = cycle?.activatedAt
    ? formatTime(cycle.activatedAt)
    : null;

  const [controlOpen, setControlOpen] = useState(false);
  const [messageModalOpen, setMessageModalOpen] = useState(false);

  const handleSendMessage = async (title: string, body: string) => {
    try {
      await sendBroadcastMessage({
        schoolId: user!.schoolId!,
        standard: user!.standard!,
        teacherId: user!.id,
        teacherName: user!.name,
        title,
        body,
      });
      Alert.alert('Message sent', 'Your message has been sent to all parents in your class.');
    } catch (e: any) {
      Alert.alert('Could not send message', e?.message ?? 'Please try again.');
      throw e;
    }
  };

  const handleSaveCycle = async (input: { active: boolean; dismissalTime: Date }) => {
    if (!user?.schoolId || !user?.standard) return;
    try {
      await setDismissalCycle({
        schoolId: user.schoolId,
        standard: user.standard,
        active: input.active,
        dismissalTime: input.dismissalTime,
        teacherId: user.id,
      });
    } catch (e: any) {
      Alert.alert(
        'Could not update dismissal',
        e?.message ?? 'Please try again.',
      );
      throw e;
    }
  };

  const recent: Student[] = useMemo(() => {
    return [...students]
      .filter((s) => s.status !== 'in_school')
      .sort((a, b) => toDate(b.statusUpdatedAt).getTime() - toDate(a.statusUpdatedAt).getTime())
      .slice(0, 5);
  }, [students]);

  if (profileIncomplete) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <ScrollView contentContainerStyle={{ padding: 20 }}>
          <Text className="text-sm text-text-secondary mb-1">{getGreeting()},</Text>
          <Text className="text-[24px] font-bold text-text-primary mb-6">{user?.name ?? 'Teacher'}</Text>

          <Card style={{ padding: 20 }}>
            <View className="items-center mb-4">
              <View className="w-16 h-16 rounded-full bg-primary-light justify-center items-center mb-3">
                <Ionicons name="school" size={28} color={Colors.primary} />
              </View>
              <Text className="text-[17px] font-bold text-text-primary mb-1 text-center">
                Set up your class
              </Text>
              <Text className="text-[13px] text-text-secondary text-center leading-5">
                Add your school code and grade so we can load your class roster.
              </Text>
            </View>
            <TouchableOpacity
              className="bg-primary py-[13px] rounded-[10px]"
              onPress={() => router.push('/(teacher)/profile')}
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

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="flex-row justify-between items-start px-5 pt-5 pb-6">
          <View>
            <Text className="text-sm text-text-secondary mb-0.5">{getGreeting()},</Text>
            <Text className="text-2xl font-bold text-text-primary mb-1">{user?.name}</Text>
            <View className="flex-row items-center gap-1">
              <Ionicons name="business-outline" size={13} color={Colors.text.secondary} />
              <Text className="text-[13px] text-text-secondary">{user?.schoolId} · {user?.standard}</Text>
            </View>
          </View>
          <TouchableOpacity
            className="p-2 mt-1"
            onPress={() => router.push('/(teacher)/profile')}
          >
            <Ionicons name="person-circle-outline" size={26} color={Colors.text.secondary} />
          </TouchableOpacity>
        </View>

        <StatsRow students={students} />

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => setControlOpen(true)}
          className="flex-row items-center justify-between bg-card mx-4 mb-5 p-4 rounded-[14px]"
          style={shadowMd}
        >
          <View className="flex-row items-center gap-3 flex-1">
            <View
              className={`w-2.5 h-2.5 rounded-full ${
                dismissalActive ? 'bg-success' : 'bg-text-light'
              }`}
            />
            <View className="flex-1">
              <Text className="text-[15px] font-semibold text-text-primary">
                {dismissalActive ? 'Dismissal Active' : 'Dismissal Paused'}
              </Text>
              <Text className="text-xs text-text-secondary mt-0.5">
                {dismissalActive
                  ? dismissalTimeLabel
                    ? `Pickup at ${dismissalTimeLabel}`
                    : activatedAtLabel
                      ? `Started at ${activatedAtLabel}`
                      : 'Tap to set dismissal time'
                  : hasActivatedToday
                    ? 'Already run today — locked until tomorrow'
                    : 'Tap to start today\'s cycle'}
              </Text>
            </View>
          </View>
          <View className="flex-row items-center gap-2">
            {arrivedCount > 0 && (
              <View className="bg-warning-light px-3 py-[5px] rounded-full">
                <Text className="text-xs font-semibold text-warning">{arrivedCount} waiting</Text>
              </View>
            )}
            <Ionicons name="chevron-forward" size={16} color={Colors.text.light} />
          </View>
        </TouchableOpacity>

        <DismissalControlModal
          visible={controlOpen}
          active={dismissalActive}
          dismissalTime={cycle?.dismissalTime ?? null}
          hasActivatedToday={hasActivatedToday}
          onClose={() => setControlOpen(false)}
          onSubmit={handleSaveCycle}
        />

        <SendMessageModal
          visible={messageModalOpen}
          onClose={() => setMessageModalOpen(false)}
          onSend={handleSendMessage}
        />

        <View className="px-4 mb-5">
          <Text className="text-[17px] font-bold text-text-primary mb-3">Quick Actions</Text>
          <View className="flex-row gap-3 mb-3">
            <TouchableOpacity
              className="flex-1 bg-card rounded-[14px] p-[14px] items-center"
              style={shadowSm}
              onPress={() => router.push('/(teacher)/students')}
            >
              <View className="w-11 h-11 rounded-full justify-center items-center mb-2 bg-primary-light">
                <Ionicons name="people" size={22} color={Colors.primary} />
              </View>
              <Text className="text-xs font-medium text-text-primary text-center">View Students</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 bg-card rounded-[14px] p-[14px] items-center"
              style={shadowSm}
              onPress={() => router.push('/(teacher)/activity')}
            >
              <View className="w-11 h-11 rounded-full justify-center items-center mb-2 bg-warning-light">
                <Ionicons name="list" size={22} color={Colors.warning} />
              </View>
              <Text className="text-xs font-medium text-text-primary text-center">Activity Log</Text>
            </TouchableOpacity>
          </View>
          <View className="flex-row gap-3">
            <TouchableOpacity
              className="flex-1 bg-card rounded-[14px] p-[14px] items-center"
              style={shadowSm}
              onPress={() => router.push('/(teacher)/profile')}
            >
              <View className="w-11 h-11 rounded-full justify-center items-center mb-2 bg-success-light">
                <Ionicons name="settings-outline" size={22} color={Colors.success} />
              </View>
              <Text className="text-xs font-medium text-text-primary text-center">Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 bg-card rounded-[14px] p-[14px] items-center"
              style={shadowSm}
              onPress={() => setMessageModalOpen(true)}
            >
              <View className="w-11 h-11 rounded-full justify-center items-center mb-2 bg-primary-light">
                <Ionicons name="megaphone-outline" size={22} color={Colors.primary} />
              </View>
              <Text className="text-xs font-medium text-text-primary text-center">Send Message</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View className="px-4 mb-5">
          <Text className="text-[17px] font-bold text-text-primary mb-3">Recent Activity</Text>
          {isLoading ? (
            <View className="bg-card rounded-[14px] p-6 items-center" style={shadowMd}>
              <ActivityIndicator size="small" color={Colors.primary} />
            </View>
          ) : recent.length === 0 ? (
            <View className="bg-card rounded-[14px] p-6 items-center" style={shadowMd}>
              <Text className="text-[13px] text-text-secondary">No activity yet today</Text>
            </View>
          ) : (
            <View className="bg-card rounded-[14px] overflow-hidden" style={shadowMd}>
              {recent.map((s, index) => {
                const cfg = STATUS_ICON[s.status];
                return (
                  <View
                    key={s.id}
                    className={`flex-row items-center p-[14px] gap-3 ${index < recent.length - 1 ? 'border-b border-divider' : ''}`}
                  >
                    <View
                      className="w-[34px] h-[34px] rounded-full justify-center items-center"
                      style={{ backgroundColor: cfg.color + '22' }}
                    >
                      <Ionicons name={cfg.icon} size={16} color={cfg.color} />
                    </View>
                    <View className="flex-1">
                      <Text className="text-sm font-semibold text-text-primary">{s.name}</Text>
                      <Text className="text-xs text-text-secondary mt-[1px]">{STATUS_LABEL[s.status]}</Text>
                    </View>
                    <Text className="text-[11px] text-text-light">
                      {formatRelativeTime(toDate(s.statusUpdatedAt))}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        <View className="h-5" />
      </ScrollView>
    </SafeAreaView>
  );
}
