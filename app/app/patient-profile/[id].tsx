import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Image as ExpoImage } from 'expo-image';
import { useAuth } from '@/context/auth';
import { getPatientById } from '@/services/user';
import { PatientProfile } from '@/types/user';
import { createOrGetChat } from '@/services/chat';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function PatientProfileScreen() {
  const { t } = useTranslation();
  const { userProfile } = useAuth();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme();
  const theme = colorScheme ?? 'light';
  // @ts-ignore
  const colors = Colors[theme];

  const [patient, setPatient] = useState<PatientProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [chatting, setChatting] = useState(false);

  useEffect(() => {
    loadPatient();
  }, [id]);

  const loadPatient = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      const data = await getPatientById(id);
      setPatient(data);
    } catch (error) {
      console.error('Error loading patient:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartChat = async () => {
    if (!patient || !userProfile || userProfile.role !== 'doctor') return;
    
    setChatting(true);
    try {
      const chatId = await createOrGetChat(patient, userProfile);
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
        <Stack.Screen options={{ title: 'ملف المريض' }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ThemedView>
    );
  }

  if (!patient) {
    return (
      <ThemedView style={styles.container}>
        <Stack.Screen options={{ title: 'ملف المريض' }} />
        <View style={styles.emptyContainer}>
          <IconSymbol name="exclamationmark.triangle" size={48} color={colors.secondary} />
          <ThemedText style={[styles.emptyText, { color: colors.secondary }]}>
            المريض غير موجود
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: patient.displayName }} />
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Profile Header */}
          <View style={[styles.profileHeader, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <ExpoImage
              source={{ uri: patient.photoURL || 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png' }}
              style={styles.profileImage}
              contentFit="cover"
            />
            <ThemedText type="title" style={styles.patientName}>
              {patient.displayName}
            </ThemedText>
            {patient.email && (
              <ThemedText style={[styles.email, { color: colors.secondary }]}>
                {patient.email}
              </ThemedText>
            )}
          </View>

          {/* Health Score */}
          {patient.healthScore !== undefined && (
            <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <IconSymbol name="heart.fill" size={20} color="#E11D48" />
              <View style={styles.infoContent}>
                <ThemedText style={[styles.infoLabel, { color: colors.secondary }]}>المؤشر الصحي</ThemedText>
                <ThemedText type="defaultSemiBold">{patient.healthScore}/100</ThemedText>
              </View>
            </View>
          )}

          {/* Personal Info */}
          {patient.dateOfBirth && (
            <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <IconSymbol name="calendar" size={20} color={colors.primary} />
              <View style={styles.infoContent}>
                <ThemedText style={[styles.infoLabel, { color: colors.secondary }]}>تاريخ الميلاد</ThemedText>
                <ThemedText type="defaultSemiBold">
                  {new Date(patient.dateOfBirth).toLocaleDateString('ar-EG', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </ThemedText>
              </View>
            </View>
          )}

          {patient.gender && (
            <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <IconSymbol name="person.fill" size={20} color={colors.primary} />
              <View style={styles.infoContent}>
                <ThemedText style={[styles.infoLabel, { color: colors.secondary }]}>الجنس</ThemedText>
                <ThemedText type="defaultSemiBold">
                  {patient.gender === 'male' ? 'ذكر' : patient.gender === 'female' ? 'أنثى' : patient.gender}
                </ThemedText>
              </View>
            </View>
          )}

          {patient.bloodType && (
            <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <IconSymbol name="drop.fill" size={20} color="#E11D48" />
              <View style={styles.infoContent}>
                <ThemedText style={[styles.infoLabel, { color: colors.secondary }]}>فصيلة الدم</ThemedText>
                <ThemedText type="defaultSemiBold">{patient.bloodType}</ThemedText>
              </View>
            </View>
          )}

          {/* Medical Info */}
          {patient.allergies && patient.allergies.length > 0 && (
            <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <IconSymbol name="exclamationmark.triangle.fill" size={20} color="#F59E0B" />
              <View style={styles.infoContent}>
                <ThemedText style={[styles.infoLabel, { color: colors.secondary }]}>الحساسيات</ThemedText>
                {patient.allergies.map((allergy, index) => (
                  <ThemedText key={index} type="defaultSemiBold">{allergy}</ThemedText>
                ))}
              </View>
            </View>
          )}

          {patient.chronicConditions && patient.chronicConditions.length > 0 && (
            <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <IconSymbol name="cross.case.fill" size={20} color={colors.primary} />
              <View style={styles.infoContent}>
                <ThemedText style={[styles.infoLabel, { color: colors.secondary }]}>الأمراض المزمنة</ThemedText>
                {patient.chronicConditions.map((condition, index) => (
                  <ThemedText key={index} type="defaultSemiBold">{condition}</ThemedText>
                ))}
              </View>
            </View>
          )}

          {/* Actions */}
          {userProfile?.role === 'doctor' && (
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
                onPress={() => router.push('/ai-analysis')}
              >
                <IconSymbol name="waveform.path.ecg" size={20} color={colors.primary} />
                <ThemedText style={[styles.actionButtonText, { color: colors.primary }]}>تحليل ذكي</ThemedText>
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
  patientName: {
    fontSize: 24,
    marginTop: 8,
  },
  email: {
    fontSize: 14,
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

