import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/auth.store';
import { useStudents } from '@/hooks/useStudent';
import { StudentCard } from '@/components/teacher/StudentCard';
import { Colors } from '@/constants/colors';
import { Student, PickupStatus } from '@/types';
import { updateStudentStatus } from '@/services/student.service';
import { releasePickupRecord } from '@/services/record.service';

type FilterOption = PickupStatus | 'all';

const FILTERS: { key: FilterOption; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'parent_arrived', label: 'Arrived' },
  { key: 'released', label: 'Released' },
  { key: 'picked_up', label: 'Picked Up' },
];

export default function StudentsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { students, isLoading } = useStudents();
  const [filter, setFilter] = useState<FilterOption>('all');
  const [search, setSearch] = useState('');
  const [releasing, setReleasing] = useState<string | null>(null);

  const profileIncomplete = !user?.schoolId || !user?.standard;

  const filtered = students
    .filter((s) => filter === 'all' || s.status === filter)
    .filter((s) => s.name.toLowerCase().includes(search.toLowerCase()));

  const arrivedCount = students.filter((s) => s.status === 'parent_arrived').length;

  const handleRelease = async (student: Student) => {
    if (!user) return;
    setReleasing(student.id);
    try {
      await releasePickupRecord(student.id, user.id);
      await updateStudentStatus(student.id, 'released');
    } catch (e: any) {
      Alert.alert('Could not release', e?.message ?? 'Please try again.');
    } finally {
      setReleasing(null);
    }
  };

  if (profileIncomplete) {
    return (
      <SafeAreaView className="flex-1 bg-background justify-center items-center px-6">
        <Ionicons name="settings-outline" size={48} color={Colors.text.light} />
        <Text className="text-[16px] font-semibold text-text-primary mt-4 mb-1 text-center">
          Set up your class first
        </Text>
        <Text className="text-[13px] text-text-secondary text-center mb-5">
          Add your school code and grade in Profile to load students.
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
      <View className="flex-row items-center justify-between px-5 pt-5 pb-4">
        <View>
          <Text className="text-[26px] font-bold text-text-primary">Students</Text>
          <Text className="text-[13px] text-text-secondary mt-0.5">
            {students.length} students · {user?.standard}
          </Text>
        </View>
        {arrivedCount > 0 && (
          <View className="bg-warning-light px-3 py-1.5 rounded-full">
            <Text className="text-xs font-semibold text-warning">{arrivedCount} need release</Text>
          </View>
        )}
      </View>

      <View className="flex-row items-center bg-card mx-4 mb-3 rounded-xl border border-border">
        <Ionicons name="search-outline" size={18} color={Colors.text.light} style={{ marginLeft: 12 }} />
        <TextInput
          className="flex-1 py-3 px-[10px] text-[15px] text-text-primary"
          value={search}
          onChangeText={setSearch}
          placeholder="Search students..."
          placeholderTextColor={Colors.text.light}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')} className="p-2.5">
            <Ionicons name="close-circle" size={18} color={Colors.text.light} />
          </TouchableOpacity>
        )}
      </View>

      <View className="flex-row px-4 gap-2 mb-3">
        {FILTERS.map((f) => {
          const count = f.key === 'all'
            ? students.length
            : students.filter((s) => s.status === f.key).length;
          const isActive = filter === f.key;

          return (
            <TouchableOpacity
              key={f.key}
              className={`flex-row items-center py-[7px] px-3 rounded-full border gap-[5px] ${
                isActive ? 'bg-primary border-primary' : 'bg-card border-border'
              }`}
              onPress={() => setFilter(f.key)}
            >
              <Text className={`text-[13px] font-medium ${isActive ? 'text-white' : 'text-text-secondary'}`}>
                {f.label}
              </Text>
              <View
                className={`rounded-[10px] px-1.5 py-[1px] min-w-5 items-center ${
                  isActive ? '' : 'bg-background'
                }`}
                style={isActive ? { backgroundColor: 'rgba(255,255,255,0.25)' } : undefined}
              >
                <Text className={`text-[11px] font-bold ${isActive ? 'text-white' : 'text-text-secondary'}`}>
                  {count}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {isLoading ? (
        <View className="items-center pt-[40px]">
          <ActivityIndicator size="small" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <StudentCard
              student={item}
              onRelease={releasing === item.id ? undefined : handleRelease}
            />
          )}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
          ListEmptyComponent={
            <View className="items-center pt-[60px] gap-3">
              <Ionicons name="people-outline" size={44} color={Colors.text.light} />
              <Text className="text-[15px] text-text-secondary">
                {students.length === 0 ? 'No students in your class yet' : 'No students match'}
              </Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}
