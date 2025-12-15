import React, { useState, useEffect } from 'react';
import { StyleSheet, FlatList, TouchableOpacity, View, ActivityIndicator, TextInput } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Image } from 'expo-image';
import { useAuth } from '@/context/auth';
import { getPatientsByDoctor, getPatientsByName } from '@/services/user';
import { PatientProfile } from '@/types/user';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function PatientsScreen() {
  const { t } = useTranslation();
  const { userProfile } = useAuth();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = colorScheme ?? 'light';
  // @ts-ignore
  const colors = Colors[theme];

  const [patients, setPatients] = useState<PatientProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (userProfile?.role === 'doctor') {
      loadPatients();
    }
  }, [userProfile]);

  useEffect(() => {
    if (searchQuery.trim()) {
      searchPatients();
    } else {
      loadPatients();
    }
  }, [searchQuery]);

  const loadPatients = async () => {
    if (!userProfile || userProfile.role !== 'doctor') return;
    
    setLoading(true);
    try {
      const data = await getPatientsByDoctor(userProfile.uid);
      setPatients(data);
    } catch (error) {
      console.error('Error loading patients:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchPatients = async () => {
    if (!userProfile || userProfile.role !== 'doctor') return;
    
    setLoading(true);
    try {
      const data = await getPatientsByName(searchQuery, userProfile.uid);
      setPatients(data);
    } catch (error) {
      console.error('Error searching patients:', error);
    } finally {
      setLoading(false);
    }
  };

  const PatientCard = ({ patient }: { patient: PatientProfile }) => (
    <TouchableOpacity 
      style={[styles.patientCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
      onPress={() => router.push(`/patient-profile/${patient.uid}`)}
    >
      <Image
        source={{ uri: patient.photoURL || 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png' }}
        style={styles.avatar}
      />
      <View style={styles.patientInfo}>
        <ThemedText type="defaultSemiBold" style={styles.patientName}>
          {patient.displayName}
        </ThemedText>
        {patient.email && (
          <ThemedText style={[styles.patientEmail, { color: colors.secondary }]}>
            {patient.email}
          </ThemedText>
        )}
        {patient.phoneNumber && (
          <ThemedText style={[styles.patientPhone, { color: colors.secondary }]}>
            {patient.phoneNumber}
          </ThemedText>
        )}
        {(patient as any)?.healthScore !== undefined && (
          <View style={styles.healthScoreContainer}>
            <IconSymbol name="heart.fill" size={12} color="#E11D48" />
            <ThemedText style={[styles.healthScore, { color: colors.secondary }]}>
              {(patient as any).healthScore || 0}/100
            </ThemedText>
          </View>
        )}
      </View>
      <IconSymbol name="chevron.right" size={20} color={colors.secondary} />
    </TouchableOpacity>
  );

  if (userProfile?.role !== 'doctor') {
    return (
      <ThemedView style={styles.container}>
        <Stack.Screen options={{ title: t('doctor.patientList') }} />
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
      <Stack.Screen options={{ title: t('doctor.patientList') }} />
      
      {/* Header with Image */}
      <View style={[styles.headerContainer, { backgroundColor: colors.primary }]}>
        <View style={styles.headerContent}>
          <ThemedText style={styles.headerTitle}>مرضىي</ThemedText>
          <ThemedText style={styles.headerSubtitle}>
            {patients.length} {patients.length === 1 ? 'مريض' : 'مريض'}
          </ThemedText>
        </View>
        <IconSymbol 
          name="person.2.fill" 
          size={80} 
          color="rgba(255,255,255,0.2)" 
          style={styles.headerIcon} 
        />
      </View>
      
      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <IconSymbol name="magnifyingglass" size={20} color={colors.secondary} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="ابحث عن مريض..."
          placeholderTextColor={colors.secondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <IconSymbol name="xmark.circle.fill" size={20} color={colors.secondary} />
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : patients.length > 0 ? (
        <FlatList
          data={patients}
          keyExtractor={(item) => item.uid}
          renderItem={({ item }) => <PatientCard patient={item} />}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <IconSymbol name="person.slash" size={48} color={colors.secondary} />
          <ThemedText style={[styles.emptyText, { color: colors.secondary }]}>
            {searchQuery ? 'لا توجد نتائج' : 'لا يوجد مرضى مرتبطين'}
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
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 24,
    overflow: 'hidden',
  },
  headerContent: {
    flex: 1,
    zIndex: 1,
  },
  headerTitle: {
    color: 'white',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  headerSubtitle: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 16,
  },
  headerIcon: {
    position: 'absolute',
    right: -10,
    bottom: -10,
    transform: [{ rotate: '-15deg' }],
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    margin: 20,
    marginBottom: 0,
    borderRadius: 12,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
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
  patientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 16,
    marginBottom: 4,
  },
  patientEmail: {
    fontSize: 12,
    marginBottom: 2,
  },
  patientPhone: {
    fontSize: 12,
    marginBottom: 4,
  },
  healthScoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  healthScore: {
    fontSize: 12,
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

