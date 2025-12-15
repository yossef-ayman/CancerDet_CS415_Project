import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, View, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/auth';
import { getAppointmentById, updateAppointmentStatus, cancelAppointment } from '@/services/appointment';
import { Appointment } from '@/types/user';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function AppointmentDetailsScreen() {
  const { t } = useTranslation();
  const { userProfile } = useAuth();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme();
  const theme = colorScheme ?? 'light';
  // @ts-ignore
  const colors = Colors[theme];

  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadAppointment();
  }, [id]);

  const loadAppointment = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      const data = await getAppointmentById(id);
      setAppointment(data);
    } catch (error) {
      console.error('Error loading appointment:', error);
      Alert.alert('خطأ', 'فشل تحميل تفاصيل الموعد');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus: Appointment['status']) => {
    if (!id || !appointment) return;
    
    setUpdating(true);
    try {
      await updateAppointmentStatus(id, newStatus);
      await loadAppointment();
      Alert.alert('نجح', 'تم تحديث حالة الموعد');
    } catch (error) {
      console.error('Error updating appointment:', error);
      Alert.alert('خطأ', 'فشل تحديث حالة الموعد');
    } finally {
      setUpdating(false);
    }
  };

  const handleCancel = async () => {
    if (!id) return;
    
    Alert.alert(
      'إلغاء الموعد',
      'هل أنت متأكد من إلغاء هذا الموعد؟',
      [
        { text: 'لا', style: 'cancel' },
        {
          text: 'نعم',
          style: 'destructive',
          onPress: async () => {
            setUpdating(true);
            try {
              await cancelAppointment(id);
              await loadAppointment();
              Alert.alert('نجح', 'تم إلغاء الموعد');
            } catch (error) {
              console.error('Error cancelling appointment:', error);
              Alert.alert('خطأ', 'فشل إلغاء الموعد');
            } finally {
              setUpdating(false);
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <Stack.Screen options={{ title: 'تفاصيل الموعد' }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ThemedView>
    );
  }

  if (!appointment) {
    return (
      <ThemedView style={styles.container}>
        <Stack.Screen options={{ title: 'تفاصيل الموعد' }} />
        <View style={styles.emptyContainer}>
          <IconSymbol name="exclamationmark.triangle" size={48} color={colors.secondary} />
          <ThemedText style={[styles.emptyText, { color: colors.secondary }]}>
            الموعد غير موجود
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  const appointmentDate = new Date(`${appointment.date}T${appointment.time}`);

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: 'تفاصيل الموعد' }} />
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Status Card */}
          <View style={[styles.statusCard, { 
            backgroundColor: 
              appointment.status === 'confirmed' ? '#DCFCE7' :
              appointment.status === 'pending' ? '#FEF9C3' :
              appointment.status === 'cancelled' ? '#FEE2E2' :
              appointment.status === 'completed' ? '#E0F2FE' : colors.surface,
            borderColor: colors.border 
          }]}>
            <ThemedText type="title" style={styles.statusTitle}>
              {appointment.status === 'confirmed' ? 'مؤكد' :
               appointment.status === 'pending' ? 'قيد الانتظار' :
               appointment.status === 'cancelled' ? 'ملغي' :
               appointment.status === 'completed' ? 'مكتمل' : appointment.status}
            </ThemedText>
          </View>

          {/* Details */}
          <View style={[styles.detailCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <DetailRow 
              icon="person.fill" 
              label={userProfile?.role === 'patient' ? 'الطبيب' : 'المريض'}
              value={userProfile?.role === 'patient' ? appointment.doctorName : appointment.patientName}
              colors={colors}
            />
            <DetailRow 
              icon="calendar" 
              label="التاريخ"
              value={appointmentDate.toLocaleDateString('ar-EG', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
              colors={colors}
            />
            <DetailRow 
              icon="clock" 
              label="الوقت"
              value={appointment.time}
              colors={colors}
            />
            <DetailRow 
              icon="stethoscope" 
              label="نوع الموعد"
              value={appointment.type}
              colors={colors}
            />
            <DetailRow 
              icon="doc.text" 
              label="السبب"
              value={appointment.reason}
              colors={colors}
            />
          </View>

          {/* Notes */}
          {appointment.notes && (
            <View style={[styles.detailCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <ThemedText type="subtitle" style={styles.sectionTitle}>ملاحظات</ThemedText>
              <ThemedText style={[styles.notesText, { color: colors.secondary }]}>
                {appointment.notes}
              </ThemedText>
            </View>
          )}

          {/* Actions */}
          {userProfile?.role === 'doctor' && appointment.status === 'pending' && (
            <View style={styles.actionsContainer}>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.primary }]}
                onPress={() => handleStatusUpdate('confirmed')}
                disabled={updating}
              >
                {updating ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <>
                    <IconSymbol name="checkmark.circle.fill" size={20} color="white" />
                    <ThemedText style={styles.actionButtonText}>تأكيد الموعد</ThemedText>
                  </>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: '#E11D48', borderColor: '#E11D48' }]}
                onPress={handleCancel}
                disabled={updating}
              >
                <IconSymbol name="xmark.circle.fill" size={20} color="white" />
                <ThemedText style={styles.actionButtonText}>إلغاء</ThemedText>
              </TouchableOpacity>
            </View>
          )}

          {userProfile?.role === 'patient' && appointment.status !== 'cancelled' && appointment.status !== 'completed' && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: '#E11D48', borderColor: '#E11D48' }]}
              onPress={handleCancel}
              disabled={updating}
            >
              {updating ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <IconSymbol name="xmark.circle.fill" size={20} color="white" />
                  <ThemedText style={styles.actionButtonText}>إلغاء الموعد</ThemedText>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const DetailRow = ({ icon, label, value, colors }: { icon: string, label: string, value: string, colors: any }) => (
  <View style={styles.detailRow}>
    <View style={styles.detailRowLeft}>
      <IconSymbol name={icon} size={18} color={colors.secondary} />
      <ThemedText style={[styles.detailLabel, { color: colors.secondary }]}>{label}</ThemedText>
    </View>
    <ThemedText type="defaultSemiBold" style={styles.detailValue}>{value}</ThemedText>
  </View>
);

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
  statusCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
  },
  statusTitle: {
    fontSize: 24,
  },
  detailCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  detailRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  detailLabel: {
    fontSize: 14,
  },
  detailValue: {
    fontSize: 14,
    flex: 1,
    textAlign: 'right',
  },
  sectionTitle: {
    marginBottom: 8,
  },
  notesText: {
    fontSize: 14,
    lineHeight: 20,
  },
  actionsContainer: {
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  actionButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

