import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, View, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/auth';
import { getUpcomingAppointments, getAppointmentsForDateRange } from '@/services/appointment';
import { Appointment } from '@/types/user';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function AppointmentsScreen() {
  const { t } = useTranslation();
  const { userProfile } = useAuth();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = colorScheme ?? 'light';
  // @ts-ignore
  const colors = Colors[theme];

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'upcoming' | 'past' | 'all'>('upcoming');

  useEffect(() => {
    loadAppointments();
  }, [userProfile, filter]);

  const loadAppointments = async () => {
    if (!userProfile) return;
    
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const endDate = new Date();
      endDate.setFullYear(endDate.getFullYear() + 1);
      const futureDate = endDate.toISOString().split('T')[0];
      
      if (filter === 'upcoming') {
        const upcoming = await getUpcomingAppointments(userProfile.uid);
        setAppointments(upcoming);
      } else if (filter === 'past') {
        const past = await getAppointmentsForDateRange(
          userProfile.uid,
          '2020-01-01',
          today,
          userProfile.role as 'patient' | 'doctor'
        );
        setAppointments(past.filter(a => a.status === 'completed' || a.status === 'cancelled'));
      } else {
        const all = await getAppointmentsForDateRange(
          userProfile.uid,
          '2020-01-01',
          futureDate,
          userProfile.role as 'patient' | 'doctor'
        );
        setAppointments(all);
      }
    } catch (error) {
      console.error('Error loading appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const AppointmentCard = ({ appointment }: { appointment: Appointment }) => {
    const appointmentDate = new Date(`${appointment.date}T${appointment.time}`);
    const isToday = new Date().toDateString() === appointmentDate.toDateString();
    
    return (
      <TouchableOpacity 
        style={[styles.appointmentCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
        onPress={() => router.push(`/appointment-details/${appointment.id}`)}
      >
        <View style={styles.appointmentHeader}>
          <View style={[styles.appointmentStatus, { 
            backgroundColor: 
              appointment.status === 'confirmed' ? '#DCFCE7' :
              appointment.status === 'pending' ? '#FEF9C3' :
              appointment.status === 'cancelled' ? '#FEE2E2' :
              appointment.status === 'completed' ? '#E0F2FE' : '#F3F4F6'
          }]}>
            <ThemedText style={[styles.statusText, {
              color: 
                appointment.status === 'confirmed' ? '#166534' :
                appointment.status === 'pending' ? '#854D0E' :
                appointment.status === 'cancelled' ? '#991B1B' :
                appointment.status === 'completed' ? '#075985' : '#374151'
            }]}>
              {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
            </ThemedText>
          </View>
          {isToday && (
            <View style={styles.todayBadge}>
              <ThemedText style={styles.todayText}>اليوم</ThemedText>
            </View>
          )}
        </View>
        
        <ThemedText type="defaultSemiBold" style={styles.appointmentTitle}>
          {userProfile?.role === 'patient' ? appointment.doctorName : appointment.patientName}
        </ThemedText>
        
        <View style={styles.appointmentDetails}>
          <View style={styles.detailItem}>
            <IconSymbol name="calendar" size={14} color={colors.secondary} />
            <ThemedText style={[styles.detailText, { color: colors.secondary }]}>
              {appointmentDate.toLocaleDateString('ar-EG', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </ThemedText>
          </View>
          
          <View style={styles.detailItem}>
            <IconSymbol name="clock" size={14} color={colors.secondary} />
            <ThemedText style={[styles.detailText, { color: colors.secondary }]}>
              {appointment.time}
            </ThemedText>
          </View>
          
          <View style={styles.detailItem}>
            <IconSymbol name="stethoscope" size={14} color={colors.secondary} />
            <ThemedText style={[styles.detailText, { color: colors.secondary }]}>
              {appointment.type}
            </ThemedText>
          </View>
        </View>
        
        <ThemedText style={[styles.reasonText, { color: colors.secondary }]} numberOfLines={2}>
          {appointment.reason}
        </ThemedText>
      </TouchableOpacity>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: t('home.upcomingAppointments') }} />
      
      {/* Filter Tabs */}
      <View style={[styles.filterContainer, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'upcoming' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
          onPress={() => setFilter('upcoming')}
        >
          <ThemedText style={[styles.filterText, filter === 'upcoming' && { color: colors.primary, fontWeight: 'bold' }]}>
            القادمة
          </ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'past' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
          onPress={() => setFilter('past')}
        >
          <ThemedText style={[styles.filterText, filter === 'past' && { color: colors.primary, fontWeight: 'bold' }]}>
            السابقة
          </ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'all' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
          onPress={() => setFilter('all')}
        >
          <ThemedText style={[styles.filterText, filter === 'all' && { color: colors.primary, fontWeight: 'bold' }]}>
            الكل
          </ThemedText>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : appointments.length > 0 ? (
        <FlatList
          data={appointments}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <AppointmentCard appointment={item} />}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <IconSymbol name="calendar" size={48} color={colors.secondary} />
          <ThemedText style={[styles.emptyText, { color: colors.secondary }]}>
            لا توجد مواعيد
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
  filterContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    paddingHorizontal: 20,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  filterText: {
    fontSize: 14,
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
  appointmentCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  appointmentStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  todayBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#FEF3C7',
  },
  todayText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#92400E',
  },
  appointmentTitle: {
    fontSize: 18,
    marginBottom: 12,
  },
  appointmentDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 12,
  },
  reasonText: {
    fontSize: 13,
    lineHeight: 18,
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

