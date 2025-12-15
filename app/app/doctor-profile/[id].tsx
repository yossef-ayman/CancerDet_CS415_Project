import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, View, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Image as ExpoImage } from 'expo-image';
import { useAuth } from '@/context/auth';
import { getDoctorById } from '@/services/user';
import { DoctorProfile } from '@/types/user';
import { createOrGetChat } from '@/services/chat';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function DoctorProfileScreen() {
  const { t } = useTranslation();
  const { userProfile } = useAuth();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme();
  const theme = colorScheme ?? 'light';
  // @ts-ignore
  const colors = Colors[theme];

  const [doctor, setDoctor] = useState<DoctorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [chatting, setChatting] = useState(false);

  useEffect(() => {
    loadDoctor();
  }, [id]);

  const loadDoctor = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      const data = await getDoctorById(id);
      setDoctor(data);
    } catch (error) {
      console.error('Error loading doctor:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartChat = async () => {
    if (!doctor || !userProfile || userProfile.role !== 'patient') return;
    
    setChatting(true);
    try {
      const chatId = await createOrGetChat(userProfile, doctor);
      router.push({ pathname: '/chat/[id]', params: { id: chatId } });
    } catch (error) {
      console.error('Error starting chat:', error);
    } finally {
      setChatting(false);
    }
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <Stack.Screen options={{ title: 'ملف الطبيب' }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ThemedView>
    );
  }

  if (!doctor) {
    return (
      <ThemedView style={styles.container}>
        <Stack.Screen options={{ title: 'ملف الطبيب' }} />
        <View style={styles.emptyContainer}>
          <IconSymbol name="exclamationmark.triangle" size={48} color={colors.secondary} />
          <ThemedText style={[styles.emptyText, { color: colors.secondary }]}>
            الطبيب غير موجود
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: doctor.displayName }} />
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Profile Header */}
          <View style={[styles.profileHeader, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <ExpoImage
              source={{ uri: doctor.photoURL || 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png' }}
              style={styles.profileImage}
              contentFit="cover"
            />
            <ThemedText type="title" style={styles.doctorName}>
              {doctor.displayName}
            </ThemedText>
            <ThemedText style={[styles.specialty, { color: colors.secondary }]}>
              {doctor.specialty}
            </ThemedText>
            {doctor.isVerified && (
              <View style={styles.verifiedBadge}>
                <IconSymbol name="checkmark.seal.fill" size={16} color="#10B981" />
                <ThemedText style={styles.verifiedText}>طبيب معتمد</ThemedText>
              </View>
            )}
          </View>

          {/* Info Cards */}
          {doctor.experienceYears && (
            <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <IconSymbol name="briefcase.fill" size={20} color={colors.primary} />
              <View style={styles.infoContent}>
                <ThemedText style={[styles.infoLabel, { color: colors.secondary }]}>سنوات الخبرة</ThemedText>
                <ThemedText type="defaultSemiBold">{doctor.experienceYears} سنة</ThemedText>
              </View>
            </View>
          )}

          {doctor.hospitalAffiliation && (
            <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <IconSymbol name="building.2.fill" size={20} color={colors.primary} />
              <View style={styles.infoContent}>
                <ThemedText style={[styles.infoLabel, { color: colors.secondary }]}>المستشفى</ThemedText>
                <ThemedText type="defaultSemiBold">{doctor.hospitalAffiliation}</ThemedText>
              </View>
            </View>
          )}

          {doctor.qualifications && doctor.qualifications.length > 0 && (
            <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <IconSymbol name="graduationcap.fill" size={20} color={colors.primary} />
              <View style={styles.infoContent}>
                <ThemedText style={[styles.infoLabel, { color: colors.secondary }]}>المؤهلات</ThemedText>
                {doctor.qualifications.map((qual, index) => (
                  <ThemedText key={index} type="defaultSemiBold">{qual}</ThemedText>
                ))}
              </View>
            </View>
          )}

          {/* Ratings */}
          {(doctor as any)?.rating && (
            <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <IconSymbol name="star.fill" size={20} color="#FFD700" />
              <View style={styles.infoContent}>
                <ThemedText style={[styles.infoLabel, { color: colors.secondary }]}>التقييم</ThemedText>
                <View style={styles.ratingContainer}>
                  <ThemedText type="defaultSemiBold">{(doctor as any).rating.toFixed(1)}</ThemedText>
                  <ThemedText style={[styles.ratingCount, { color: colors.secondary }]}>
                    ({(doctor as any).totalReviews || 0} تقييم)
                  </ThemedText>
                </View>
              </View>
            </View>
          )}

          {/* Actions */}
          {userProfile?.role === 'patient' && (
            <View style={styles.actionsContainer}>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.primary }]}
                onPress={handleStartChat}
                disabled={chatting}
              >
                {chatting ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <>
                    <IconSymbol name="message.fill" size={20} color="white" />
                    <ThemedText style={styles.actionButtonText}>بدء محادثة</ThemedText>
                  </>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }]}
                onPress={() => {
                  // Navigate to appointment booking with this doctor
                  router.push({
                    pathname: '/(tabs)',
                    params: { doctorId: doctor.uid }
                  });
                }}
              >
                <IconSymbol name="calendar.badge.plus" size={20} color={colors.primary} />
                <ThemedText style={[styles.actionButtonText, { color: colors.primary }]}>حجز موعد</ThemedText>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    gap: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  profileHeader: {
    alignItems: 'center',
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  doctorName: {
    fontSize: 24,
    marginTop: 8,
  },
  specialty: {
    fontSize: 16,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  verifiedText: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '600',
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  infoContent: {
    flex: 1,
    gap: 4,
  },
  infoLabel: {
    fontSize: 12,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ratingCount: {
    fontSize: 12,
  },
  actionsContainer: {
    gap: 12,
    marginTop: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 12,
  },
  actionButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

