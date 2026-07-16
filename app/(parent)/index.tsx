import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/auth.store';
import { useChildrenStudents } from '@/hooks/useStudent';
import { useGradeTeacher } from '@/hooks/useGradeTeacher';
import { useDismissalCycle } from '@/hooks/useDismissalCycle';
import { ArrivalButton } from '@/components/parent/ArrivalButton';
import { StatusTracker } from '@/components/ui/StatusTracker';
import { Card } from '@/components/ui/Card';
import { Colors } from '@/constants/colors';
import { AlternatePickup, PickupStatus, Student, User } from '@/types';
import { formatTime, getInitials } from '@/utils/formatTime';
import { updateStudentStatus } from '@/services/student.service';
import {
  createPickupRecord,
  confirmPickupRecord,
} from '@/services/record.service';
import { getAlternatePickups } from '@/services/alternatePickup.service';
import { ChildSummaryCard } from '@/components/parent/ChildSummaryCard';

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
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

function PersonAvatar({ photoUrl, name, size }: { photoUrl: string | null; name: string; size: number }) {
  const r = size / 2;
  return photoUrl ? (
    <Image source={{ uri: photoUrl }} style={{ width: size, height: size, borderRadius: r }} className="bg-divider" />
  ) : (
    <View style={{ width: size, height: size, borderRadius: r }} className="bg-primary-light justify-center items-center">
      <Text style={{ fontSize: Math.round(size * 0.35) }} className="font-bold text-primary">{getInitials(name)}</Text>
    </View>
  );
}

function ChildDetail({
  student,
  user,
}: {
  student: Student;
  user: User;
}) {
  const { teacher } = useGradeTeacher(student.schoolId, student.standard);
  const { cycle, isLive: dismissalActive } = useDismissalCycle(
    student.schoolId,
    student.standard,
  );

  const [acting, setActing] = useState(false);
  const [pickupPersons, setPickupPersons] = useState<AlternatePickup[]>([]);
  const [selectedPickupId, setSelectedPickupId] = useState<string | 'self'>('self');
  const [showPicker, setShowPicker] = useState(false);
  const status: PickupStatus = student.status ?? 'in_school';

  useEffect(() => {
    getAlternatePickups(user.id)
      .then((all) => setPickupPersons(all.filter((p) => p.studentId === student.id)));
  }, [user.id, student.id]);

  const selectedPerson = useMemo(() => {
    if (selectedPickupId === 'self') return { name: user.name, photoUrl: user.photoUrl ?? null, badge: 'You' };
    const alt = pickupPersons.find((p) => p.id === selectedPickupId);
    return alt ? { name: alt.fullName, photoUrl: alt.photoUrl, badge: 'Alternate' } : { name: user.name, photoUrl: user.photoUrl ?? null, badge: 'You' };
  }, [selectedPickupId, pickupPersons, user.name, user.photoUrl]);

  const arrivedAt = useMemo(
    () =>
      status !== 'in_school' && student.statusUpdatedAt
        ? (student.statusUpdatedAt as any)?.toDate?.() ??
          new Date(student.statusUpdatedAt as any)
        : null,
    [status, student.statusUpdatedAt],
  );

  const handleArrive = async () => {
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

  const msg = STATUS_MESSAGES[status](student.name);

  return (
    <View>
      {/* Status message */}
      <View className="px-5 pt-4 pb-3">
        <Text className="text-[17px] font-bold text-text-primary mb-1">{msg.title}</Text>
        <Text className="text-sm text-text-secondary leading-[21px]">{msg.body}</Text>
      </View>

      {/* Teacher info row */}
      {teacher && (
        <View className="flex-row items-center gap-2 px-5 pb-3">
          <Ionicons name="school-outline" size={14} color={Colors.primary} />
          <Text className="text-[13px] text-text-secondary">Teacher:</Text>
          <Text className="text-[13px] font-semibold text-text-primary">{teacher.name}</Text>
        </View>
      )}

      {/* Who is picking today — tappable selector */}
      <TouchableOpacity onPress={() => setShowPicker(true)} activeOpacity={0.75}>
        <Card style={{ marginHorizontal: 16, marginBottom: 12 }}>
          <View className="flex-row items-center gap-2 mb-3">
            <Ionicons name="people-outline" size={14} color={Colors.text.secondary} />
            <Text className="text-sm font-semibold text-text-secondary flex-1">Who is picking today?</Text>
            <Ionicons name="chevron-down" size={14} color={Colors.text.light} />
          </View>
          <View className="flex-row items-center gap-3">
            <PersonAvatar photoUrl={selectedPerson.photoUrl} name={selectedPerson.name} size={36} />
            <Text className="flex-1 text-[14px] font-medium text-text-primary">{selectedPerson.name}</Text>
            <View className={`px-2 py-[3px] rounded-full ${selectedPickupId === 'self' ? 'bg-primary-light' : 'bg-divider'}`}>
              <Text className={`text-[11px] font-semibold ${selectedPickupId === 'self' ? 'text-primary' : 'text-text-secondary'}`}>
                {selectedPerson.badge}
              </Text>
            </View>
          </View>
        </Card>
      </TouchableOpacity>

      {/* Picker modal */}
      <Modal visible={showPicker} transparent animationType="slide" onRequestClose={() => setShowPicker(false)}>
        <Pressable className="flex-1 bg-black/40" onPress={() => setShowPicker(false)} />
        <View className="bg-card rounded-t-[24px] px-5 pt-5 pb-8">
          <View className="w-10 h-1 rounded-full bg-divider self-center mb-4" />
          <Text className="text-[17px] font-bold text-text-primary mb-4">Who is picking today?</Text>

          {/* Parent (self) option */}
          <TouchableOpacity
            className="flex-row items-center gap-3 py-3 border-b border-divider"
            onPress={() => { setSelectedPickupId('self'); setShowPicker(false); }}
          >
            <PersonAvatar photoUrl={user.photoUrl ?? null} name={user.name} size={40} />
            <View className="flex-1">
              <Text className="text-[15px] font-semibold text-text-primary">{user.name}</Text>
              <Text className="text-[12px] text-text-secondary">You · Primary</Text>
            </View>
            {selectedPickupId === 'self' && (
              <Ionicons name="checkmark-circle" size={22} color={Colors.primary} />
            )}
          </TouchableOpacity>

          {/* Alternate options */}
          {pickupPersons.map((p) => (
            <TouchableOpacity
              key={p.id}
              className="flex-row items-center gap-3 py-3 border-b border-divider"
              onPress={() => { setSelectedPickupId(p.id); setShowPicker(false); }}
            >
              <Image source={{ uri: p.photoUrl }} className="w-10 h-10 rounded-full bg-divider" />
              <View className="flex-1">
                <Text className="text-[15px] font-semibold text-text-primary">{p.fullName}</Text>
                <Text className="text-[12px] text-text-secondary">{p.email} · Alternate</Text>
              </View>
              {selectedPickupId === p.id && (
                <Ionicons name="checkmark-circle" size={22} color={Colors.primary} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </Modal>

      {/* Status tracker */}
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

      {/* Arrival button */}
      <ArrivalButton
        status={status}
        onArrive={handleArrive}
        onConfirm={handleConfirm}
        loading={acting}
        dismissalActive={dismissalActive}
        dismissalTime={cycle?.dismissalTime ?? null}
      />
      <View className="h-8" />
    </View>
  );
}

// ── Main dashboard ────────────────────────────────────────────────────────────
export default function ParentDashboard() {
  const router = useRouter();
  const { user } = useAuthStore();

  // Use childIds array; fall back to legacy childId for existing accounts
  const childIds = useMemo(() => {
    if (user?.childIds && user.childIds.length > 0) return user.childIds;
    if (user?.childId) return [user.childId];
    return [];
  }, [user?.childIds, user?.childId]);

  const { children, isLoading } = useChildrenStudents(childIds);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const selectedChild = children.find((c) => c.id === selectedChildId) ?? null;

  const firstName = user?.name?.split(' ')[0] ?? 'Parent';
  const profileIncomplete = childIds.length === 0;

  if (isLoading) {
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

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Header */}
        <View className="flex-row justify-between items-start px-5 pt-5 pb-3">
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

        {/* Section label */}
        <Text className="text-[13px] font-semibold text-text-secondary px-5 mb-3">
          {children.length === 1 ? 'Your child' : `Your children (${children.length})`}
        </Text>

        {/* Children summary cards */}
        {children.map((child) => (
          <ChildSummaryCard
            key={child.id}
            student={child}
            onPress={() => setSelectedChildId(child.id)}
          />
        ))}

        {/* PIPEDA footer */}
        <View className="flex-row items-start px-5 pt-4 gap-[6px]">
          <Ionicons name="shield-checkmark-outline" size={14} color={Colors.text.light} />
          <Text className="flex-1 text-[11px] text-text-light leading-4">
            All pickup records are stored securely in compliance with PIPEDA
          </Text>
        </View>
      </ScrollView>

      {/* Child detail modal */}
      <Modal
        visible={!!selectedChild}
        animationType="slide"
        onRequestClose={() => setSelectedChildId(null)}
      >
        <SafeAreaView className="flex-1 bg-background">
          {/* Header */}
          <View className="flex-row items-center px-5 py-4 border-b border-divider">
            <View className="flex-1">
              <Text className="text-[20px] font-bold text-text-primary">
                {selectedChild?.name}
              </Text>
              <View className="flex-row items-center gap-2 mt-0.5">
                <Text className="text-[13px] text-text-secondary">
                  {selectedChild?.standard}
                </Text>
                <Text className="text-text-light">·</Text>
                <Text className="text-[13px] text-text-secondary">
                  {selectedChild?.schoolId}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={() => setSelectedChildId(null)}
              className="p-2 rounded-full bg-divider"
            >
              <Ionicons name="close" size={20} color={Colors.text.secondary} />
            </TouchableOpacity>
          </View>

          {/* Scrollable detail content */}
          <ScrollView showsVerticalScrollIndicator={false}>
            {selectedChild && (
              <ChildDetail student={selectedChild} user={user!} />
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
