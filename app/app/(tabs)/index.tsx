import { Image } from 'expo-image';
import { 
  StyleSheet, 
  View, 
  TouchableOpacity, 
  Alert, 
  ScrollView, 
  Dimensions, 
  Modal, 
  Pressable,
  FlatList,
  TextInput,
  ActivityIndicator
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import * as Clipboard from 'expo-clipboard';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Calendar } from 'react-native-calendars';

import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/context/auth';
import { createAppointment, getAvailableDoctors, getUpcomingAppointments, getDoctorSchedule } from '@/services/appointment';
import { UserProfile, Appointment } from '@/types/user';

const { width } = Dimensions.get('window');
const isSmallScreen = width < 380;

export default function HomeScreen() {
  const { t } = useTranslation();
  const { userProfile, getLinkedDoctors, getLinkedPatients } = useAuth();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = colorScheme ?? 'light';
  // @ts-ignore
  const colors = Colors[theme];

  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const [codeModalVisible, setCodeModalVisible] = useState(false);
  const [appointmentModalVisible, setAppointmentModalVisible] = useState(false);
  const [doctorsModalVisible, setDoctorsModalVisible] = useState(false);
  const [availableDoctors, setAvailableDoctors] = useState<UserProfile[]>([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState<UserProfile | null>(null);
  const [appointmentReason, setAppointmentReason] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [calendarMarkedDates, setCalendarMarkedDates] = useState({});
  const [linkedDoctors, setLinkedDoctors] = useState<UserProfile[]>([]);
  const [linkedPatients, setLinkedPatients] = useState<UserProfile[]>([]);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, [userProfile]);

  const loadData = async () => {
    if (!userProfile) return;
    
    setLoading(true);
    try {
      // Load upcoming appointments
      const appointments = await getUpcomingAppointments(userProfile.uid);
      setUpcomingAppointments(appointments);
      
      // Load linked profiles
      if (userProfile.role === 'patient' && getLinkedDoctors) {
        const doctors = await getLinkedDoctors();
        setLinkedDoctors(doctors);
      } else if (userProfile.role === 'doctor' && getLinkedPatients) {
        const patients = await getLinkedPatients();
        setLinkedPatients(patients);
      }
      
      // Prepare calendar marked dates
      const markedDates: any = {};
      appointments.forEach(appointment => {
        const dateStr = new Date(appointment.date).toISOString().split('T')[0];
        markedDates[dateStr] = {
          selected: true,
          selectedColor: colors.primary,
          dotColor: 'white',
        };
      });
      setCalendarMarkedDates(markedDates);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableDoctors = async () => {
    setLoadingDoctors(true);
    try {
      const doctors = await getAvailableDoctors();
      setAvailableDoctors(doctors);
      setDoctorsModalVisible(true);
    } catch (error) {
      console.error('Error loading doctors:', error);
      Alert.alert('Error', 'Failed to load available doctors');
    } finally {
      setLoadingDoctors(false);
    }
  };

  const handleDocumentPick = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled) {
        setUploadedFiles(prev => [...prev, result.assets[0]]);
        Alert.alert('Success', 'File Uploaded Successfully');
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  const handleAiAnalysis = () => {
    router.push('/ai-analysis');
  };

  const handleBookAppointment = async () => {
    if (!selectedDoctor || !selectedTime || !appointmentReason.trim()) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    if (!userProfile) return;

    setLoading(true);
    try {
      await createAppointment({
        patientId: userProfile.uid,
        patientName: userProfile.displayName,
        doctorId: selectedDoctor.uid,
        doctorName: selectedDoctor.displayName,
        date: selectedDate.toISOString().split('T')[0],
        time: selectedTime,
        reason: appointmentReason,
        type: 'consultation',
        status: 'pending',
      });

      Alert.alert('Success', 'Appointment booked successfully');
      setAppointmentModalVisible(false);
      setSelectedDoctor(null);
      setSelectedTime('');
      setAppointmentReason('');
      loadData(); // Refresh data
    } catch (error) {
      console.error('Error booking appointment:', error);
      Alert.alert('Error', 'Failed to book appointment');
    } finally {
      setLoading(false);
    }
  };

  const QuickAction = ({ icon, label, onPress, color, disabled = false }: any) => (
    <TouchableOpacity 
      style={[
        styles.quickAction, 
        { 
          backgroundColor: colors.surface, 
          borderColor: colors.border,
          opacity: disabled ? 0.5 : 1
        }
      ]} 
      onPress={onPress}
      disabled={disabled}
    >
      <View style={[styles.quickActionIcon, { backgroundColor: color + '15' }]}>
        <IconSymbol name={icon} size={24} color={color} />
      </View>
      <ThemedText style={styles.quickActionLabel} numberOfLines={2}>{label}</ThemedText>
    </TouchableOpacity>
  );

  const InfoCard = ({ title, value, subtext, icon, color, onPress }: any) => (
    <TouchableOpacity 
      style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={styles.infoCardHeader}>
        <ThemedText style={[styles.infoCardTitle, { color: colors.secondary }]}>{title}</ThemedText>
        <IconSymbol name={icon} size={16} color={color} />
      </View>
      <ThemedText type="title" style={{ fontSize: 24, marginVertical: 4 }}>{value}</ThemedText>
      {subtext && <ThemedText style={styles.infoCardSubtext}>{subtext}</ThemedText>}
    </TouchableOpacity>
  );

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
              appointment.status === 'cancelled' ? '#FEE2E2' : '#E0F2FE'
          }]}>
            <ThemedText style={[styles.statusText, {
              color: 
                appointment.status === 'confirmed' ? '#166534' :
                appointment.status === 'pending' ? '#854D0E' :
                appointment.status === 'cancelled' ? '#991B1B' : '#075985'
            }]}>
              {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
            </ThemedText>
          </View>
          {isToday && (
            <View style={styles.todayBadge}>
              <ThemedText style={styles.todayText}>Today</ThemedText>
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
              {appointmentDate.toLocaleDateString('en-US', { 
                weekday: 'short', 
                month: 'short', 
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

  const DoctorCard = ({ doctor, onSelect }: { doctor: UserProfile, onSelect: () => void }) => (
    <TouchableOpacity 
      style={[styles.doctorCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
      onPress={onSelect}
    >
      <Image
        source={{ uri: doctor.photoURL || 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png' }}
        style={styles.doctorAvatar}
      />
      <View style={styles.doctorInfo}>
        <ThemedText type="defaultSemiBold" style={styles.doctorName}>
          {doctor.displayName}
        </ThemedText>
        {/* @ts-ignore */}
        <ThemedText style={[styles.doctorSpecialty, { color: colors.secondary }]}>
          {doctor.specialty || 'General Practitioner'}
        </ThemedText>
        <View style={styles.doctorMeta}>
          {/* @ts-ignore */}
          {doctor.experienceYears && (
            <ThemedText style={[styles.doctorMetaText, { color: colors.secondary }]}>
              {/* @ts-ignore */}
              {doctor.experienceYears} yrs exp
            </ThemedText>
          )}
          {/* @ts-ignore */}
          {doctor.hospital && (
            <ThemedText style={[styles.doctorMetaText, { color: colors.secondary }]}>
              {/* @ts-ignore */}
              • {doctor.hospital}
            </ThemedText>
          )}
        </View>
        {/* @ts-ignore */}
        {doctor.rating && (
          <View style={styles.ratingContainer}>
            <IconSymbol name="star.fill" size={12} color="#FFD700" />
            {/* @ts-ignore */}
            <ThemedText style={styles.ratingText}>{doctor.rating.toFixed(1)}</ThemedText>
            {/* @ts-ignore */}
            <ThemedText style={[styles.ratingCount, { color: colors.secondary }]}>({doctor.totalReviews || 0})</ThemedText>
          </View>
        )}
      </View>
      <IconSymbol name="chevron.right" size={20} color={colors.secondary} />
    </TouchableOpacity>
  );

  return (
    <ParallaxScrollView
      headerBackgroundColor={{
        dark: colors.background,
        light: colors.surface,
      }}
      headerImage={
        <View style={[styles.headerContainer, { backgroundColor: colors.primary }]}>
          <View style={styles.headerContent}>
            <ThemedText style={styles.greetingText}>
              {new Date().getHours() < 12 ? '🌤️ صباح الخير' : 
               new Date().getHours() < 18 ? '☀️ مساء الخير' : '🌙 مساء الخير'}
            </ThemedText>
            <ThemedText style={styles.nameText}>{userProfile?.displayName || 'User'}</ThemedText>
            <ThemedText style={styles.roleText}>
              {userProfile?.role === 'doctor' ? '👨‍⚕️ طبيب' : '👤 مريض'}
            </ThemedText>
          </View>
          <IconSymbol 
            name={userProfile?.role === 'doctor' ? "stethoscope" : "heart.fill"} 
            size={80} 
            color="rgba(255,255,255,0.2)" 
            style={styles.headerIcon} 
          />
        </View>
      }
    >
      {/* Modals */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={codeModalVisible}
        onRequestClose={() => setCodeModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalView, { backgroundColor: colors.surface }]}>
            <IconSymbol name="qrcode" size={48} color={colors.primary} />
            <ThemedText type="subtitle" style={{ marginTop: 16, marginBottom: 8 }}>كود الدكتور</ThemedText>
            <ThemedText style={{ textAlign: 'center', opacity: 0.7, marginBottom: 20 }}>
              شارك هذا الكود مع المرضى للربط معك
            </ThemedText>
            
            <TouchableOpacity 
              style={[styles.codeDisplay, { borderColor: colors.primary, backgroundColor: colors.primary + '10' }]}
              onPress={async () => {
                  // @ts-ignore
                  const code = userProfile?.doctorCode;
                  if (code) {
                      await Clipboard.setStringAsync(code);
                      Alert.alert('تم النسخ', 'تم نسخ كود الدكتور');
                  }
              }}
            >
              {/* @ts-ignore */}
              <ThemedText type="title" style={{ color: colors.primary, letterSpacing: 2, fontFamily: 'monospace' }}>
                {userProfile?.doctorCode || '----'}
              </ThemedText>
              <ThemedText style={{ fontSize: 10, opacity: 0.6, textAlign: 'center', marginTop: 4 }}>انقر للنسخ</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: colors.primary }]}
              onPress={() => setCodeModalVisible(false)}
            >
              <ThemedText style={styles.modalButtonText}>إغلاق</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Doctors Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={doctorsModalVisible}
        onRequestClose={() => setDoctorsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.largeModalView, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <ThemedText type="title">الأطباء المتاحين</ThemedText>
              <TouchableOpacity onPress={() => setDoctorsModalVisible(false)}>
                <IconSymbol name="xmark.circle.fill" size={24} color={colors.secondary} />
              </TouchableOpacity>
            </View>
            
            {loadingDoctors ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <ThemedText style={{ marginTop: 16, color: colors.secondary }}>جاري تحميل الأطباء...</ThemedText>
              </View>
            ) : availableDoctors.length > 0 ? (
              <FlatList
                data={availableDoctors}
                keyExtractor={(item) => item.uid}
                renderItem={({ item }) => (
                  <DoctorCard 
                    doctor={item} 
                    onSelect={() => {
                      setSelectedDoctor(item);
                      setDoctorsModalVisible(false);
                      setAppointmentModalVisible(true);
                    }}
                  />
                )}
                contentContainerStyle={styles.doctorsList}
                showsVerticalScrollIndicator={false}
              />
            ) : (
              <View style={styles.emptyContainer}>
                <IconSymbol name="person.slash" size={48} color={colors.secondary} />
                <ThemedText style={{ marginTop: 16, color: colors.secondary }}>لا توجد أطباء متاحين حالياً</ThemedText>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Appointment Booking Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={appointmentModalVisible}
        onRequestClose={() => setAppointmentModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.largeModalView, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <ThemedText type="title">حجز موعد جديد</ThemedText>
              <TouchableOpacity onPress={() => setAppointmentModalVisible(false)}>
                <IconSymbol name="xmark.circle.fill" size={24} color={colors.secondary} />
              </TouchableOpacity>
            </View>
            
            <ScrollView showsVerticalScrollIndicator={false} style={styles.appointmentForm}>
              {/* Selected Doctor */}
              {selectedDoctor && (
                <View style={styles.selectedDoctorContainer}>
                  <ThemedText style={[styles.label, { color: colors.secondary }]}>الدكتور المختار</ThemedText>
                  <View style={[styles.selectedDoctorCard, { backgroundColor: colors.primary + '10', borderColor: colors.primary }]}>
                    <Image
                      source={{ uri: selectedDoctor.photoURL || 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png' }}
                      style={styles.smallDoctorAvatar}
                    />
                    <View style={styles.selectedDoctorInfo}>
                      <ThemedText type="defaultSemiBold">{selectedDoctor.displayName}</ThemedText>
                      {/* @ts-ignore */}
                      <ThemedText style={{ color: colors.secondary, fontSize: 12 }}>
                        {selectedDoctor.specialty || 'General Practitioner'}
                      </ThemedText>
                    </View>
                    <TouchableOpacity onPress={() => setSelectedDoctor(null)}>
                      <IconSymbol name="xmark.circle.fill" size={20} color={colors.secondary} />
                    </TouchableOpacity>
                  </View>
                </View>
              )}
              
              {/* Date Selection */}
              <View style={styles.formGroup}>
                <ThemedText style={[styles.label, { color: colors.secondary }]}>التاريخ</ThemedText>
                <TouchableOpacity 
                  style={[styles.inputField, { backgroundColor: colors.background, borderColor: colors.border }]}
                  onPress={() => setShowDatePicker(true)}
                >
                  <ThemedText>
                    {selectedDate.toLocaleDateString('ar-EG', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </ThemedText>
                  <IconSymbol name="calendar" size={20} color={colors.secondary} />
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
              
              {/* Time Selection */}
              <View style={styles.formGroup}>
                <ThemedText style={[styles.label, { color: colors.secondary }]}>الوقت</ThemedText>
                <TextInput
                  style={[styles.timeInput, { 
                    backgroundColor: colors.background, 
                    borderColor: colors.border,
                    color: colors.text
                  }]}
                  placeholder="مثال: 14:30"
                  placeholderTextColor={colors.secondary}
                  value={selectedTime}
                  onChangeText={setSelectedTime}
                />
                <ThemedText style={[styles.hint, { color: colors.secondary }]}>
                  أدخل الوقت بتنسيق 24 ساعة (ساعة:دقيقة)
                </ThemedText>
              </View>
              
              {/* Reason */}
              <View style={styles.formGroup}>
                <ThemedText style={[styles.label, { color: colors.secondary }]}>سبب الزيارة</ThemedText>
                <TextInput
                  style={[styles.textArea, { 
                    backgroundColor: colors.background, 
                    borderColor: colors.border,
                    color: colors.text
                  }]}
                  placeholder="وصف الأعراض أو السبب"
                  placeholderTextColor={colors.secondary}
                  value={appointmentReason}
                  onChangeText={setAppointmentReason}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>
              
              {/* Action Buttons */}
              <View style={styles.formActions}>
                <TouchableOpacity 
                  style={[styles.secondaryButton, { borderColor: colors.border }]}
                  onPress={() => setAppointmentModalVisible(false)}
                >
                  <ThemedText style={{ color: colors.secondary }}>إلغاء</ThemedText>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.primaryButton, { backgroundColor: colors.primary }]}
                  onPress={handleBookAppointment}
                  disabled={loading || !selectedDoctor || !selectedTime || !appointmentReason.trim()}
                >
                  {loading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <ThemedText style={{ color: 'white', fontWeight: 'bold' }}>حجز الموعد</ThemedText>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Main Content */}
      <View style={styles.contentContainer}>
        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          {userProfile?.role === 'patient' ? (
            <>
              <InfoCard 
                title="المؤشر الصحي" 
                value={(userProfile as any)?.healthScore?.toString() || "0"} 
                subtext="آخر تحديث" 
                icon="heart.fill" 
                color="#E11D48"
                onPress={() => router.push('/health-metrics')}
              />
              <InfoCard 
                title="المواعيد القادمة" 
                value={upcomingAppointments.length.toString()} 
                subtext="موعد قادم" 
                icon="calendar.badge.clock" 
                color={colors.primary}
                onPress={() => router.push('/appointments')}
              />
            </>
          ) : (
            <>
              <InfoCard 
                title="المرضى" 
                value={userProfile?.stats?.patientCount?.toString() || "0"} 
                subtext="مرضى مرتبطين" 
                icon="person.2.fill" 
                color={colors.primary}
                onPress={() => router.push('/(tabs)/patients')}
              />
              <InfoCard 
                title="المواعيد" 
                value={upcomingAppointments.length.toString()} 
                subtext="اليوم" 
                icon="calendar" 
                color="#10B981"
                onPress={() => router.push('/doctor-schedule')}
              />
            </>
          )}
        </View>

        {/* Quick Actions */}
        <ThemedText type="subtitle" style={styles.sectionTitle}>الإجراءات السريعة</ThemedText>
        <View style={styles.quickActionGrid}>
          {userProfile?.role === 'patient' ? (
            <>
              <QuickAction 
                icon="calendar.badge.plus" 
                label="حجز موعد" 
                color={colors.primary} 
                onPress={loadAvailableDoctors}
              />
              <QuickAction 
                icon="message.fill" 
                label="المحادثات" 
                color="#10B981" 
                onPress={() => router.push('/(tabs)/chat')}
              />
              <QuickAction 
                icon="paperclip" 
                label="رفع تقرير" 
                color="#F59E0B" 
                onPress={handleDocumentPick}
              />
              <QuickAction 
                icon="waveform.path.ecg" 
                label="تحليل ذكي" 
                color="#8B5CF6" 
                onPress={handleAiAnalysis}
              />
            </>
          ) : (
            <>
              <QuickAction 
                icon="qrcode" 
                label="كود الربط" 
                color={colors.primary} 
                onPress={() => setCodeModalVisible(true)}
              />
              <QuickAction 
                icon="person.badge.plus" 
                label="إضافة مريض" 
                color="#10B981" 
                onPress={() => router.push('/add-patient')}
              />
              <QuickAction 
                icon="message.fill" 
                label="المحادثات" 
                color="#F59E0B" 
                onPress={() => router.push('/(tabs)/chat')}
              />
              <QuickAction 
                icon="doc.text.fill" 
                label="مراجعة تقارير" 
                color="#8B5CF6" 
                onPress={() => router.push('/pending-reports')}
              />
            </>
          )}
        </View>

        {/* Upcoming Appointments */}
        <View style={styles.appointmentsHeader}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>المواعيد القادمة</ThemedText>
          {upcomingAppointments.length > 0 && (
            <TouchableOpacity onPress={() => router.push('/appointments')}>
              <ThemedText style={{ color: colors.primary, fontSize: 14 }}>عرض الكل</ThemedText>
            </TouchableOpacity>
          )}
        </View>
        
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        ) : upcomingAppointments.length > 0 ? (
          <FlatList
            data={upcomingAppointments.slice(0, 3)}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <AppointmentCard appointment={item} />}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.appointmentsList}
          />
        ) : (
          <View style={[styles.emptyState, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <IconSymbol name="calendar" size={40} color={colors.secondary} />
            <ThemedText style={[styles.emptyStateText, { color: colors.secondary }]}>
              {userProfile?.role === 'patient' 
                ? 'لا توجد مواعيد قادمة. احجز موعدك الآن!' 
                : 'لا توجد مواعيد قادمة.'}
            </ThemedText>
            {userProfile?.role === 'patient' && (
              <TouchableOpacity 
                style={[styles.emptyStateButton, { backgroundColor: colors.primary }]}
                onPress={loadAvailableDoctors}
              >
                <ThemedText style={{ color: 'white', fontWeight: 'bold' }}>حجز موعد جديد</ThemedText>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Linked Profiles */}
        {(linkedDoctors.length > 0 || linkedPatients.length > 0) && (
          <>
            <View style={styles.appointmentsHeader}>
              <ThemedText type="subtitle" style={styles.sectionTitle}>
                {userProfile?.role === 'patient' ? 'الأطباء المرتبطين' : 'المرضى الجدد'}
              </ThemedText>
              <TouchableOpacity onPress={() => router.push(userProfile?.role === 'patient' ? '/doctors' : '/(tabs)/patients')}>
                <ThemedText style={{ color: colors.primary, fontSize: 14 }}>عرض الكل</ThemedText>
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={userProfile?.role === 'patient' ? linkedDoctors.slice(0, 3) : linkedPatients.slice(0, 3)}
              keyExtractor={(item) => item.uid}
              renderItem={({ item }) => (
                <DoctorCard 
                  doctor={item} 
                  onSelect={() => {
                    if (userProfile?.role === 'patient') {
                      // Navigate to doctor profile
                      router.push(`/doctor-profile/${item.uid}`);
                    } else {
                      // Navigate to patient profile
                      router.push(`/patient-profile/${item.uid}`);
                    }
                  }}
                />
              )}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.linkedProfilesList}
            />
          </>
        )}

        {/* Mini Calendar for Patients */}
        {userProfile?.role === 'patient' && (
          <>
            <ThemedText type="subtitle" style={styles.sectionTitle}>التقويم</ThemedText>
            <View style={[styles.calendarContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Calendar
                current={new Date().toISOString().split('T')[0]}
                markedDates={calendarMarkedDates}
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
                  textDayFontFamily: 'System',
                  textMonthFontFamily: 'System',
                  textDayHeaderFontFamily: 'System',
                }}
                onDayPress={(day) => {
                  const appointmentsOnDay = upcomingAppointments.filter(
                    appointment => new Date(appointment.date).toISOString().split('T')[0] === day.dateString
                  );
                  if (appointmentsOnDay.length > 0) {
                    Alert.alert(
                      'المواعيد',
                      `لديك ${appointmentsOnDay.length} موعد في هذا اليوم`
                    );
                  }
                }}
              />
            </View>
          </>
        )}
      </View>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    overflow: 'hidden',
  },
  headerContent: {
    flex: 1,
    zIndex: 1,
  },
  greetingText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 16,
    marginBottom: 4,
  },
  nameText: {
    color: 'white',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  roleText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    fontWeight: '600',
  },
  headerIcon: {
    position: 'absolute',
    right: -10,
    bottom: -10,
    transform: [{ rotate: '-15deg' }],
  },
  contentContainer: {
    padding: 20,
    gap: 24,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  quickActionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  quickAction: {
    width: '48%',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    gap: 12,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickActionLabel: {
    fontWeight: '600',
    textAlign: 'center',
    fontSize: 14,
  },
  infoCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  infoCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoCardTitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  infoCardSubtext: {
    fontSize: 12,
    opacity: 0.6,
  },
  appointmentsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  appointmentsList: {
    gap: 12,
    paddingRight: 20,
  },
  appointmentCard: {
    width: 280,
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
    gap: 8,
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
  linkedProfilesList: {
    gap: 12,
    paddingRight: 20,
  },
  doctorCard: {
    width: 300,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  doctorAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  doctorInfo: {
    flex: 1,
  },
  doctorName: {
    fontSize: 16,
    marginBottom: 2,
  },
  doctorSpecialty: {
    fontSize: 14,
    marginBottom: 4,
  },
  doctorMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  doctorMetaText: {
    fontSize: 12,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 2,
  },
  ratingCount: {
    fontSize: 11,
  },
  calendarContainer: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
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
  emptyStateButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalView: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  largeModalView: {
    width: '100%',
    height: '80%',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    width: '100%',
  },
  codeDisplay: {
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    marginBottom: 24,
    alignItems: 'center',
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  modalButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  doctorsList: {
    gap: 12,
    paddingBottom: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Appointment Form Styles
  appointmentForm: {
    flex: 1,
  },
  selectedDoctorContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  selectedDoctorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  smallDoctorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  selectedDoctorInfo: {
    flex: 1,
  },
  formGroup: {
    marginBottom: 20,
  },
  inputField: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  timeInput: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 16,
  },
  hint: {
    fontSize: 12,
    marginTop: 4,
  },
  textArea: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 16,
    minHeight: 100,
  },
  formActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
    marginBottom: 20,
  },
  primaryButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
});