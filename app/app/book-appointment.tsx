import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, View, TextInput, TouchableOpacity, Alert } from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAuth } from '@/context/auth';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { getDoctorById } from '@/services/user';
import { DoctorProfile } from '@/types/user';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function BookAppointmentScreen() {
  const { t } = useTranslation();
  const { userProfile, user } = useAuth();
  const router = useRouter();
  const { doctorId } = useLocalSearchParams<{ doctorId?: string }>();
  const colorScheme = useColorScheme();
  const theme = colorScheme ?? 'light';
  const colors = Colors[theme];

  const [doctor, setDoctor] = useState<DoctorProfile | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState(new Date());
  const [reason, setReason] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    if (doctorId) {
      loadDoctor();
    }
  }, [doctorId]);

  const loadDoctor = async () => {
    if (!doctorId) return;
    try {
      const data = await getDoctorById(doctorId);
      setDoctor(data);
    } catch (error) {
      console.error('Error loading doctor:', error);
    }
  };

  const handleBook = async () => {
    if (!user?.uid || !doctorId || !doctor) {
      Alert.alert(t('appointment.error'), t('appointment.errorDesc'));
      return;
    }

    if (!reason.trim()) {
      Alert.alert(t('appointment.error'), 'Please enter reason for visit');
      return;
    }

    setBooking(true);
    try {
      await addDoc(collection(db, 'appointments'), {
        patientId: user.uid,
        doctorId: doctorId,
        patientName: userProfile?.displayName,
        doctorName: doctor.displayName,
        date: selectedDate.toISOString().split('T')[0],
        time: selectedTime.toTimeString().split(' ')[0].slice(0, 5),
        reason: reason,
        status: 'pending',
        createdAt: serverTimestamp(),
      });

      Alert.alert(t('appointment.success'), t('appointment.successDesc'));
      router.back();
    } catch (error) {
      console.error('Error booking appointment:', error);
      Alert.alert(t('appointment.error'), t('appointment.errorDesc'));
    } finally {
      setBooking(false);
    }
  };

  if (!doctor && doctorId) {
    return (
      <ThemedView style={styles.container}>
        <Stack.Screen options={{ title: t('appointment.book') }} />
        <View style={styles.loadingContainer}>
          <ThemedText>{t('appointment.loading')}</ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: t('appointment.book') }} />
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          {doctor && (
            <View style={[styles.doctorCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <ThemedText type="subtitle">{doctor.displayName}</ThemedText>
              <ThemedText style={{ color: colors.secondary }}>{doctor.specialty}</ThemedText>
            </View>
          )}

          <View style={[styles.inputCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <ThemedText type="defaultSemiBold" style={styles.label}>
              {t('appointment.selectDate')}
            </ThemedText>
            <TouchableOpacity
              style={[styles.dateButton, { borderColor: colors.border }]}
              onPress={() => setShowDatePicker(true)}
            >
              <IconSymbol name="calendar" size={20} color={colors.primary} />
              <ThemedText>
                {selectedDate.toLocaleDateString(i18n.language === 'ar' ? 'ar-EG' : 'en-US')}
              </ThemedText>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={selectedDate}
                mode="date"
                display="default"
                minimumDate={new Date()}
                onChange={(event, date) => {
                  setShowDatePicker(false);
                  if (date) setSelectedDate(date);
                }}
              />
            )}
          </View>

          <View style={[styles.inputCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <ThemedText type="defaultSemiBold" style={styles.label}>
              {t('appointment.selectTime')}
            </ThemedText>
            <TouchableOpacity
              style={[styles.dateButton, { borderColor: colors.border }]}
              onPress={() => setShowTimePicker(true)}
            >
              <IconSymbol name="clock.fill" size={20} color={colors.primary} />
              <ThemedText>
                {selectedTime.toLocaleTimeString(i18n.language === 'ar' ? 'ar-EG' : 'en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </ThemedText>
            </TouchableOpacity>
            {showTimePicker && (
              <DateTimePicker
                value={selectedTime}
                mode="time"
                display="default"
                onChange={(event, time) => {
                  setShowTimePicker(false);
                  if (time) setSelectedTime(time);
                }}
              />
            )}
          </View>

          <View style={[styles.inputCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <ThemedText type="defaultSemiBold" style={styles.label}>
              {t('appointment.reason')}
            </ThemedText>
            <TextInput
              style={[styles.textInput, { color: colors.text, borderColor: colors.border }]}
              placeholder={t('appointment.reasonPlaceholder')}
              placeholderTextColor={colors.secondary}
              value={reason}
              onChangeText={setReason}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          <TouchableOpacity
            style={[styles.bookButton, { backgroundColor: colors.primary }]}
            onPress={handleBook}
            disabled={booking}
          >
            <ThemedText style={styles.bookButtonText}>
              {booking ? t('appointment.booking') : t('appointment.bookButton')}
            </ThemedText>
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
    gap: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  doctorCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
  },
  inputCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  label: {
    fontSize: 16,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  textInput: {
    minHeight: 100,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 16,
    textAlignVertical: 'top',
  },
  bookButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  bookButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

