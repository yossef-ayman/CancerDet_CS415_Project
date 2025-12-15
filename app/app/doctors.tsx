import React, { useState, useEffect } from 'react';
import { StyleSheet, FlatList, TouchableOpacity, View, ActivityIndicator, TextInput } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Image } from 'expo-image';
import { useAuth } from '@/context/auth';
import { getAvailableDoctors, searchDoctors } from '@/services/user';
import { UserProfile } from '@/types/user';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function DoctorsScreen() {
  const { t } = useTranslation();
  const { userProfile } = useAuth();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = colorScheme ?? 'light';
  // @ts-ignore
  const colors = Colors[theme];

  const [doctors, setDoctors] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadDoctors();
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      searchDoctorsList();
    } else {
      loadDoctors();
    }
  }, [searchQuery]);

  const loadDoctors = async () => {
    setLoading(true);
    try {
      const data = await getAvailableDoctors();
      setDoctors(data);
    } catch (error) {
      console.error('Error loading doctors:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchDoctorsList = async () => {
    setLoading(true);
    try {
      const data = await searchDoctors(searchQuery);
      setDoctors(data);
    } catch (error) {
      console.error('Error searching doctors:', error);
    } finally {
      setLoading(false);
    }
  };

  const DoctorCard = ({ doctor }: { doctor: UserProfile }) => (
    <TouchableOpacity 
      style={[styles.doctorCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
      onPress={() => router.push(`/doctor-profile/${doctor.uid}`)}
    >
      <Image
        source={{ uri: doctor.photoURL || 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png' }}
        style={styles.avatar}
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
              {doctor.experienceYears} سنوات خبرة
            </ThemedText>
          )}
          {/* @ts-ignore */}
          {doctor.hospitalAffiliation && (
            <ThemedText style={[styles.doctorMetaText, { color: colors.secondary }]}>
              {/* @ts-ignore */}
              • {doctor.hospitalAffiliation}
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
            <ThemedText style={[styles.ratingCount, { color: colors.secondary }]}>
              ({doctor.totalReviews || 0})
            </ThemedText>
          </View>
        )}
      </View>
      <IconSymbol name="chevron.right" size={20} color={colors.secondary} />
    </TouchableOpacity>
  );

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: 'الأطباء المتاحين' }} />
      
      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <IconSymbol name="magnifyingglass" size={20} color={colors.secondary} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="ابحث عن طبيب..."
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
      ) : doctors.length > 0 ? (
        <FlatList
          data={doctors}
          keyExtractor={(item) => item.uid}
          renderItem={({ item }) => <DoctorCard doctor={item} />}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <IconSymbol name="person.slash" size={48} color={colors.secondary} />
          <ThemedText style={[styles.emptyText, { color: colors.secondary }]}>
            {searchQuery ? 'لا توجد نتائج' : 'لا يوجد أطباء متاحين'}
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
  doctorCard: {
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

