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
import { PickupRecordCard } from '@/components/ui/PickupRecordCard';

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
          renderItem={({ item }) => <PickupRecordCard record={item} />}
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
