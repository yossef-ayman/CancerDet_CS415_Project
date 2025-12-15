import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, View, ActivityIndicator } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/auth';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function HealthMetricsScreen() {
  const { t } = useTranslation();
  const { userProfile } = useAuth();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = colorScheme ?? 'light';
  // @ts-ignore
  const colors = Colors[theme];

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading
    setTimeout(() => setLoading(false), 500);
  }, []);

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <Stack.Screen options={{ title: t('home.healthScore') }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ThemedView>
    );
  }

  const healthScore = (userProfile as any)?.healthScore || 0;

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: t('home.healthScore') }} />
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Health Score Card */}
          <View style={[styles.scoreCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.scoreHeader}>
              <IconSymbol name="heart.fill" size={32} color="#E11D48" />
              <ThemedText type="title" style={styles.scoreTitle}>
                {t('home.healthScore')}
              </ThemedText>
            </View>
            <View style={styles.scoreValueContainer}>
              <ThemedText type="title" style={[styles.scoreValue, { color: colors.primary }]}>
                {healthScore}
              </ThemedText>
              <ThemedText style={[styles.scoreMax, { color: colors.secondary }]}>/ 100</ThemedText>
            </View>
            <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
              <View 
                style={[
                  styles.progressFill, 
                  { 
                    width: `${healthScore}%`, 
                    backgroundColor: healthScore >= 70 ? '#10B981' : healthScore >= 40 ? '#F59E0B' : '#E11D48' 
                  }
                ]} 
              />
            </View>
          </View>

          {/* Metrics Info */}
          <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              {t('home.overview')}
            </ThemedText>
            <ThemedText style={[styles.infoText, { color: colors.secondary }]}>
              {healthScore >= 70 
                ? 'حالتك الصحية جيدة جداً. استمر في الحفاظ على نمط حياة صحي.'
                : healthScore >= 40 
                ? 'حالتك الصحية متوسطة. يُنصح بمراجعة الطبيب قريباً.'
                : 'يُنصح بمراجعة الطبيب في أقرب وقت ممكن.'}
            </ThemedText>
          </View>

          {/* Last Checkup */}
          {(userProfile as any)?.lastCheckup && (
            <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <ThemedText type="subtitle" style={styles.sectionTitle}>
                آخر فحص طبي
              </ThemedText>
              <ThemedText style={[styles.infoText, { color: colors.secondary }]}>
                {new Date((userProfile as any).lastCheckup).toLocaleDateString('ar-EG', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </ThemedText>
            </View>
          )}

          {/* Next Visit */}
          {(userProfile as any)?.nextVisit && (
            <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <ThemedText type="subtitle" style={styles.sectionTitle}>
                {t('home.nextVisit')}
              </ThemedText>
              <ThemedText style={[styles.infoText, { color: colors.secondary }]}>
                {(userProfile as any).nextVisit}
              </ThemedText>
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
  scoreCard: {
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
  },
  scoreHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  scoreTitle: {
    fontSize: 20,
  },
  scoreValueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 16,
  },
  scoreValue: {
    fontSize: 64,
    fontWeight: 'bold',
  },
  scoreMax: {
    fontSize: 24,
    marginLeft: 8,
  },
  progressBar: {
    width: '100%',
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 6,
  },
  infoCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  sectionTitle: {
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
  },
});

