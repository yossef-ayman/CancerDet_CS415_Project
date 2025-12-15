import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, View, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Calendar } from 'react-native-calendars';
import { useAuth } from '@/context/auth';
import { getDoctorSchedule, getAppointmentsForDateRange } from '@/services/appointment';
import { Appointment } from '@/types/user';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function DoctorScheduleScreen() {
  const { t } = useTranslation();
  const { userProfile } = useAuth();
  const colorScheme = useColorScheme();
  const theme = colorScheme ?? 'light';
  // @ts-ignore
  const colors = Colors[theme];

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [markedDates, setMarkedDates] = useState({});

  useEffect(() => {
    if (userProfile?.role === 'doctor') {
      loadSchedule();
      loadMarkedDates();
    }
  }, [userProfile, selectedDate]);

  const loadSchedule = async () => {
    if (!userProfile || userProfile.role !== 'doctor') return;
    
    setLoading(true);
    try {
      const schedule = await getDoctorSchedule(userProfile.uid, selectedDate);
      setAppointments(schedule);
    } catch (error) {
      console.error('Error loading schedule:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMarkedDates = async () => {
    if (!userProfile || userProfile.role !== 'doctor') return;
    
    try {
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 1);
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 2);
      
      const allAppointments = await getAppointmentsForDateRange(
        userProfile.uid,
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0],
        'doctor'
      );
      
      const marked: any = {};
      allAppointments.forEach(apt => {
        if (apt.status === 'confirmed' || apt.status === 'pending') {
          marked[apt.date] = {
            marked: true,
            dotColor: colors.primary,
            selected: apt.date === selectedDate,
            selectedColor: colors.primary,
          };
        }
      });
      
      if (marked[selectedDate]) {
        marked[selectedDate].selected = true;
      } else {
        marked[selectedDate] = { selected: true, selectedColor: colors.primary };
      }
      
      setMarkedDates(marked);
    } catch (error) {
      console.error('Error loading marked dates:', error);
    }
  };

  const AppointmentItem = ({ appointment }: { appointment: Appointment }) => (
    <View style={[styles.appointmentItem, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.timeContainer}>
        <ThemedText type="defaultSemiBold" style={styles.timeText}>
          {appointment.time}
        </ThemedText>
      </View>
      <View style={styles.appointmentInfo}>
        <ThemedText type="defaultSemiBold" style={styles.patientName}>
          {appointment.patientName}
        </ThemedText>
        <ThemedText style={[styles.reason, { color: colors.secondary }]} numberOfLines={1}>
          {appointment.reason}
        </ThemedText>
        <View style={[styles.statusBadge, {
          backgroundColor: 
            appointment.status === 'confirmed' ? '#DCFCE7' :
            appointment.status === 'pending' ? '#FEF9C3' : '#FEE2E2'
        }]}>
          <ThemedText style={[styles.statusText, {
            color: 
              appointment.status === 'confirmed' ? '#166534' :
              appointment.status === 'pending' ? '#854D0E' : '#991B1B'
          }]}>
            {appointment.status === 'confirmed' ? 'مؤكد' :
             appointment.status === 'pending' ? 'قيد الانتظار' : appointment.status}
          </ThemedText>
        </View>
      </View>
    </View>
  );

  if (userProfile?.role !== 'doctor') {
    return (
      <ThemedView style={styles.container}>
        <Stack.Screen options={{ title: t('home.schedule') }} />
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
      <Stack.Screen options={{ title: t('home.schedule') }} />
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Calendar */}
          <View style={[styles.calendarContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Calendar
              current={selectedDate}
              markedDates={markedDates}
              onDayPress={(day) => setSelectedDate(day.dateString)}
              theme={{
                backgroundColor: colors.surface,
                calendarBackground: colors.surface,
                textSectionTitleColor: colors.secondary,
                selectedDayBackgroundColor: colors.primary,
                selectedDayTextColor: '#ffffff',
                todayTextColor: colors.primary,
                dayTextColor: colors.text,
                textDisabledColor: colors.border,
                dotColor: colors.primary,
                selectedDotColor: '#ffffff',
                arrowColor: colors.primary,
                monthTextColor: colors.text,
              }}
            />
          </View>

          {/* Appointments List */}
          <View style={styles.appointmentsSection}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              مواعيد {new Date(selectedDate).toLocaleDateString('ar-EG', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </ThemedText>
            
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            ) : appointments.length > 0 ? (
              <FlatList
                data={appointments}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => <AppointmentItem appointment={item} />}
                scrollEnabled={false}
                contentContainerStyle={styles.appointmentsList}
              />
            ) : (
              <View style={[styles.emptyState, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <IconSymbol name="calendar" size={40} color={colors.secondary} />
                <ThemedText style={[styles.emptyStateText, { color: colors.secondary }]}>
                  لا توجد مواعيد في هذا اليوم
                </ThemedText>
              </View>
            )}
          </View>
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
  calendarContainer: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    overflow: 'hidden',
  },
  appointmentsSection: {
    gap: 12,
  },
  sectionTitle: {
    marginBottom: 8,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  appointmentsList: {
    gap: 12,
  },
  appointmentItem: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 16,
  },
  timeContainer: {
    width: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeText: {
    fontSize: 16,
  },
  appointmentInfo: {
    flex: 1,
    gap: 4,
  },
  patientName: {
    fontSize: 16,
  },
  reason: {
    fontSize: 13,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  emptyState: {
    padding: 40,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    borderStyle: 'dashed',
  },
  emptyStateText: {
    marginTop: 12,
    fontSize: 14,
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
  },
});

