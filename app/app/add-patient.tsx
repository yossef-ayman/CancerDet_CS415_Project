import React, { useState } from 'react';
import { StyleSheet, ScrollView, View, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/auth';
import { getUserByDoctorCode, linkPatientToDoctor } from '@/services/user';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function AddPatientScreen() {
  const { t } = useTranslation();
  const { userProfile } = useAuth();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = colorScheme ?? 'light';
  // @ts-ignore
  const colors = Colors[theme];

  const [patientCode, setPatientCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAddPatient = async () => {
    if (!patientCode.trim()) {
      Alert.alert('خطأ', 'الرجاء إدخال كود المريض');
      return;
    }

    if (!userProfile || userProfile.role !== 'doctor') {
      Alert.alert('خطأ', 'هذه الصفحة متاحة للأطباء فقط');
      return;
    }

    setLoading(true);
    try {
      // Note: This assumes patients have a code. You may need to adjust this logic
      // based on your actual implementation
      const patient = await getUserByDoctorCode(patientCode.trim().toUpperCase());
      
      if (!patient) {
        Alert.alert('غير موجود', 'لم يتم العثور على مريض بهذا الكود');
        setLoading(false);
        return;
      }

      if (patient.role !== 'patient') {
        Alert.alert('خطأ', 'الكود المدخل ليس لمريض');
        setLoading(false);
        return;
      }

      // Link patient to doctor
      await linkPatientToDoctor(patient.uid, userProfile.uid);
      
      Alert.alert('نجح', 'تم إضافة المريض بنجاح', [
        { text: 'حسناً', onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error('Error adding patient:', error);
      Alert.alert('خطأ', 'فشل إضافة المريض');
    } finally {
      setLoading(false);
    }
  };

  if (userProfile?.role !== 'doctor') {
    return (
      <ThemedView style={styles.container}>
        <Stack.Screen options={{ title: t('doctor.addPatient') }} />
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
      <Stack.Screen options={{ title: t('doctor.addPatient') }} />
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <IconSymbol name="info.circle.fill" size={24} color={colors.primary} />
            <ThemedText style={[styles.infoText, { color: colors.secondary }]}>
              أدخل كود المريض لإضافته إلى قائمة مرضاك. يمكن للمرضى الحصول على كودهم من صفحة الملف الشخصي.
            </ThemedText>
          </View>

          <View style={styles.formGroup}>
            <ThemedText style={[styles.label, { color: colors.secondary }]}>
              كود المريض
            </ThemedText>
            <TextInput
              style={[styles.input, { 
                backgroundColor: colors.background, 
                borderColor: colors.border,
                color: colors.text
              }]}
              placeholder="أدخل كود المريض"
              placeholderTextColor={colors.secondary}
              value={patientCode}
              onChangeText={setPatientCode}
              autoCapitalize="characters"
              editable={!loading}
            />
          </View>

          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: colors.primary }]}
            onPress={handleAddPatient}
            disabled={loading || !patientCode.trim()}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <IconSymbol name="person.badge.plus" size={20} color="white" />
                <ThemedText style={styles.addButtonText}>إضافة المريض</ThemedText>
              </>
            )}
          </TouchableOpacity>
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
    gap: 24,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  formGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
  },
  input: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 16,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  addButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

