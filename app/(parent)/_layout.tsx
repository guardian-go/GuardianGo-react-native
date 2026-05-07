import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];


export default function ParentLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.tabBar.active,
        tabBarInactiveTintColor: Colors.tabBar.inactive,
        tabBarStyle: {
          backgroundColor: Colors.tabBar.background,
          borderTopColor: Colors.tabBar.border,
          borderTopWidth: 1,
          paddingBottom: 4,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }: { color: string }) => (
            <Ionicons name={'home-outline' as IoniconName} size={23} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ color }: { color: string }) => (
            <Ionicons name={'time-outline' as IoniconName} size={23} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
