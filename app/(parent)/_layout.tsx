import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth.store';
import {
  collection,
  query,
  where,
  onSnapshot,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/services/firebase';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

// Counts unread broadcast messages + unread alert notifications
function useUnreadCount(): number {
  const { user } = useAuthStore();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!user?.id || !user?.schoolId || !user?.standard) return;

    let msgUnread = 0;
    let notifUnread = 0;

    const msgQ = query(
      collection(db, 'broadcastMessages'),
      where('schoolId', '==', user.schoolId),
      where('standard', '==', user.standard)
    );
    const unsubMsg = onSnapshot(msgQ, (snap) => {
      msgUnread = snap.docs.filter(
        (d) => !(d.data().readBy ?? []).includes(user.id)
      ).length;
      setCount(msgUnread + notifUnread);
    });

    const notifQ = query(
      collection(db, 'notifications'),
      where('userId', '==', user.id),
      where('read', '==', false)
    );
    const unsubNotif = onSnapshot(notifQ, (snap) => {
      notifUnread = snap.size;
      setCount(msgUnread + notifUnread);
    });

    return () => {
      unsubMsg();
      unsubNotif();
    };
  }, [user?.id, user?.schoolId, user?.standard]);

  return count;
}

export default function ParentLayout() {
  const unread = useUnreadCount();

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
        name="messages"
        options={{
          title: 'Messages',
          tabBarBadge: unread > 0 ? unread : undefined,
          tabBarIcon: ({ color }: { color: string }) => (
            <Ionicons name={'chatbubble-outline' as IoniconName} size={23} color={color} />
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
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }: { color: string }) => (
            <Ionicons name={'person-circle-outline' as IoniconName} size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
