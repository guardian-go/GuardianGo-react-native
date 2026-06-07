

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/auth.store';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  updateDoc,
  doc,
  arrayUnion,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/services/firebase';
import { getStudent } from '@/services/student.service';
import { Colors } from '@/constants/colors';

// ── Types -
interface BroadcastMessage {
  id: string;
  schoolId: string;
  standard: string;
  teacherId: string;
  teacherName: string;
  title: string;
  body: string;
  createdAt: Date;
  readBy: string[];
}

interface InAppNotif {
  id: string;
  userId: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: Date;
}

// ── Helpers ─
function timeAgo(date: Date): string {
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return date.toLocaleDateString('en-CA', { month: 'short', day: 'numeric' });
}

const toDate = (v: any): Date =>
  v instanceof Timestamp ? v.toDate() : new Date(v);

// ── Alert notification banner ─────────────────────────────────────────────────
function AlertBanner({
  notif,
  onDismiss,
}: {
  notif: InAppNotif;
  onDismiss: () => void;
}) {
  return (
    <View
      className="bg-warning-light border border-warning rounded-[14px] p-4 mb-3 flex-row items-start gap-3"
      style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 }}
    >
      <Ionicons name="alert-circle" size={20} color={Colors.warning} style={{ marginTop: 1 }} />
      <View className="flex-1">
        <Text className="text-[14px] font-bold text-text-primary mb-0.5">{notif.title}</Text>
        <Text className="text-[13px] text-text-secondary leading-[19px]">{notif.body}</Text>
      </View>
      <TouchableOpacity onPress={onDismiss} className="p-1 -mt-1 -mr-1">
        <Ionicons name="close" size={16} color={Colors.text.secondary} />
      </TouchableOpacity>
    </View>
  );
}

// ── Broadcast message card ─
function MessageCard({
  msg,
  parentId,
}: {
  msg: BroadcastMessage;
  parentId: string;
}) {
  const isRead = msg.readBy.includes(parentId);

  // Auto-mark as read when rendered
  useEffect(() => {
    if (!isRead) {
      updateDoc(doc(db, 'broadcastMessages', msg.id), {
        readBy: arrayUnion(parentId),
      }).catch(console.error);
    }
  }, [msg.id, isRead, parentId]);

  return (
    <View
      className="bg-card rounded-[14px] p-4 mb-3"
      style={{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 2,
        borderLeftWidth: isRead ? 0 : 3,
        borderLeftColor: isRead ? 'transparent' : Colors.primary,
      }}
    >
      {/* Header row */}
      <View className="flex-row items-start justify-between mb-2">
        <View className="flex-row items-center gap-2 flex-1">
          <View className="w-8 h-8 rounded-full bg-primary-light justify-center items-center">
            <Ionicons name="megaphone-outline" size={15} color={Colors.primary} />
          </View>
          <View className="flex-1">
            <Text className="text-[13px] font-semibold text-text-primary">
              {msg.teacherName}
            </Text>
            <Text className="text-[11px] text-text-secondary">{msg.standard}</Text>
          </View>
        </View>
        <Text className="text-[11px] text-text-light">{timeAgo(msg.createdAt)}</Text>
      </View>

      {/* Content */}
      <Text className="text-[15px] font-bold text-text-primary mb-1">{msg.title}</Text>
      <Text className="text-[13px] text-text-secondary leading-[19px]">{msg.body}</Text>

      {/* Unread dot */}
      {!isRead && (
        <View className="flex-row items-center gap-1 mt-2">
          <View className="w-1.5 h-1.5 rounded-full bg-primary" />
          <Text className="text-[11px] text-primary font-semibold">New</Text>
        </View>
      )}
    </View>
  );
}
// ── Main screen ─
export default function ParentMessagesScreen() {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<BroadcastMessage[]>([]);
  const [notifications, setNotifications] = useState<InAppNotif[]>([]);
  const [loading, setLoading] = useState(true);
  const [standard, setStandard] = useState<string | undefined>(user?.standard);

  // Resolve standard — prefer user doc, fall back to first child doc for legacy accounts
  useEffect(() => {
    if (user?.standard) { setStandard(user.standard); return; }
    if (user?.childId) {
      getStudent(user.childId).then((child) => setStandard(child?.standard ?? undefined));
    }
  }, [user?.standard, user?.childId]);

  // Subscribe to broadcast messages
  useEffect(() => {
    console.log('[Messages] user schoolId:', user?.schoolId, 'standard:', standard);
    if (!user?.schoolId || !standard) {
      console.log('[Messages] missing profile — skipping query');
      setLoading(false);
      return;
    }
    const q = query(
      collection(db, 'broadcastMessages'),
      where('schoolId', '==', user.schoolId),
      where('standard', '==', standard),
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        console.log('[Messages] snapshot docs:', snap.docs.length);
        setMessages(
          snap.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              schoolId: data.schoolId,
              standard: data.standard,
              teacherId: data.teacherId,
              teacherName: data.teacherName,
              title: data.title,
              body: data.body,
              createdAt: toDate(data.createdAt),
              readBy: data.readBy ?? [],
            };
          })
        );
        setLoading(false);
      },
      (err) => {
        console.error('[Messages] query error:', err.code, err.message);
        setLoading(false);
      },
    );
    return unsub;
  }, [user?.schoolId, standard]);

  // Subscribe to unread in-app notifications (late alerts etc.)
  useEffect(() => {
    if (!user?.id) return;
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', user.id),
      where('read', '==', false)
    );
    const unsub = onSnapshot(q, (snap) => {
      setNotifications(
        snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            userId: data.userId,
            title: data.title,
            body: data.body,
            read: data.read,
            createdAt: toDate(data.createdAt),
          };
        })
      );
    });
    return unsub;
  }, [user?.id]);

  const dismissNotif = async (id: string) => {
    await updateDoc(doc(db, 'notifications', id), { read: true });
  };

  const unreadMessages = messages.filter(
    (m) => !m.readBy.includes(user?.id ?? '')
  ).length;

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 py-4">
        <Text className="text-xl font-bold text-text-primary">Messages</Text>
        {(unreadMessages + notifications.length) > 0 && (
          <View className="bg-primary px-2.5 py-0.5 rounded-full">
            <Text className="text-white text-[12px] font-bold">
              {unreadMessages + notifications.length}
            </Text>
          </View>
        )}
      </View>

      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
          // Alert banners go above messages
          ListHeaderComponent={
            notifications.length > 0 ? (
              <View className="mb-1">
                {notifications.map((n) => (
                  <AlertBanner
                    key={n.id}
                    notif={n}
                    onDismiss={() => dismissNotif(n.id)}
                  />
                ))}
              </View>
            ) : null
          }
          renderItem={({ item }) => (
            <MessageCard msg={item} parentId={user?.id ?? ''} />
          )}
          ListEmptyComponent={
            notifications.length === 0 ? (
              <View className="items-center pt-20 gap-3">
                <Ionicons
                  name="chatbubble-ellipses-outline"
                  size={48}
                  color={Colors.text.light}
                />
                <Text className="text-[16px] font-semibold text-text-secondary">
                  No messages yet
                </Text>
                <Text className="text-[13px] text-text-light text-center px-10 leading-5">
                  Your teacher's announcements will appear here.
                </Text>
              </View>
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}
