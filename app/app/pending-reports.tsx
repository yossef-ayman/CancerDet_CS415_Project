import React, { useState, useEffect } from 'react';
import { StyleSheet, FlatList, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Image } from 'expo-image';
import { useAuth } from '@/context/auth';
import { subscribeToChats } from '@/services/chat';
import { Chat } from '@/types/chat';

// Helper to get other participant safely
const getOtherParticipant = (chat: Chat, currentUserId: string) => {
  if (chat.participantInfo && Array.isArray(chat.participantInfo)) {
    return chat.participantInfo.find(p => p.uid !== currentUserId) || chat.participantInfo[0];
  }
  return null;
};

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function PendingReportsScreen() {
  const { t } = useTranslation();
  const { userProfile, user } = useAuth();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = colorScheme ?? 'light';
  // @ts-ignore
  const colors = Colors[theme];

  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || userProfile?.role !== 'doctor') return;

    const unsubscribe = subscribeToChats(user.uid, (data) => {
      // Filter chats that have file messages (reports)
      const chatsWithFiles = data.filter(chat => 
        chat.lastMessage?.type === 'file' || 
        chat.lastMessage?.type === 'image' ||
        chat.lastMessage?.type === 'lab_result'
      );
      setChats(chatsWithFiles);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, userProfile]);


  const formatTime = (timestamp?: number) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.getDate() === now.getDate() && 
                    date.getMonth() === now.getMonth() && 
                    date.getFullYear() === now.getFullYear();
    
    if (isToday) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString();
  };

  const ReportCard = ({ chat }: { chat: Chat }) => {
    const otherParticipant = getOtherParticipant(chat, user?.uid || '');
    
    return (
      <TouchableOpacity 
        style={[styles.reportCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
        onPress={() => router.push({ pathname: '/chat/[id]', params: { id: chat.id } })}
      >
        <Image 
          source={{ uri: otherParticipant?.photoURL || 'https://i.pravatar.cc/150' }} 
          style={styles.avatar}
          contentFit="cover"
        />
        <View style={styles.reportContent}>
          <View style={styles.reportHeader}>
            <ThemedText type="defaultSemiBold" style={styles.patientName}>
              {otherParticipant?.displayName || 'Unknown Patient'}
            </ThemedText>
            <ThemedText style={[styles.time, { color: colors.secondary }]}>
              {formatTime(chat.lastMessage?.createdAt || chat.updatedAt)}
            </ThemedText>
          </View>
          <View style={styles.messageContainer}>
            <IconSymbol 
              name={chat.lastMessage?.type === 'file' ? 'doc.fill' : 'photo.fill'} 
              size={14} 
              color={colors.secondary} 
            />
            <ThemedText numberOfLines={1} style={[styles.message, { color: colors.secondary }]}>
              {chat.lastMessage?.file?.name || chat.lastMessage?.text || 'تقرير جديد'}
            </ThemedText>
          </View>
          {chat.unreadCount > 0 && (
            <View style={[styles.badge, { backgroundColor: colors.primary }]}>
              <ThemedText style={styles.badgeText}>{chat.unreadCount}</ThemedText>
            </View>
          )}
        </View>
        <IconSymbol name="chevron.right" size={20} color={colors.secondary} />
      </TouchableOpacity>
    );
  };

  if (userProfile?.role !== 'doctor') {
    return (
      <ThemedView style={styles.container}>
        <Stack.Screen options={{ title: 'التقارير المعلقة' }} />
        <View style={styles.emptyContainer}>
          <ThemedText style={[styles.emptyText, { color: colors.secondary }]}>
            هذه الصفحة متاحة للأطباء فقط
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: 'التقارير المعلقة' }} />
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : chats.length > 0 ? (
        <FlatList
          data={chats}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ReportCard chat={item} />}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <IconSymbol name="doc.text" size={48} color={colors.secondary} />
          <ThemedText style={[styles.emptyText, { color: colors.secondary }]}>
            لا توجد تقارير معلقة
          </ThemedText>
        </View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 20,
    gap: 12,
  },
  reportCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  reportContent: {
    flex: 1,
    justifyContent: 'center',
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  patientName: {
    fontSize: 16,
  },
  time: {
    fontSize: 12,
  },
  messageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  message: {
    flex: 1,
    fontSize: 14,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
  },
});

