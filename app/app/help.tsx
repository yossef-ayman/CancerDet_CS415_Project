import React from 'react';
import { StyleSheet, ScrollView, View, TouchableOpacity } from 'react-native';
import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/auth';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function HelpScreen() {
  const { t } = useTranslation();
  const { userProfile } = useAuth();
  const colorScheme = useColorScheme();
  const theme = colorScheme ?? 'light';
  const colors = Colors[theme];

  const isDoctor = userProfile?.role === 'doctor';

  const HelpSection = ({ title, items }: { title: string; items: string[] }) => (
    <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <ThemedText type="subtitle" style={styles.sectionTitle}>
        {title}
      </ThemedText>
      {items.map((item, index) => (
        <View key={index} style={styles.item}>
          <IconSymbol name="checkmark.circle.fill" size={16} color={colors.primary} />
          <ThemedText style={styles.itemText}>{item}</ThemedText>
        </View>
      ))}
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: t('help.title') }} />
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          {isDoctor ? (
            <>
              <HelpSection
                title={t('help.forDoctors')}
                items={[
                  t('help.doctor1'),
                  t('help.doctor2'),
                  t('help.doctor3'),
                  t('help.doctor4'),
                  t('help.doctor5'),
                ]}
              />
            </>
          ) : (
            <>
              <HelpSection
                title={t('help.forPatients')}
                items={[
                  t('help.patient1'),
                  t('help.patient2'),
                  t('help.patient3'),
                  t('help.patient4'),
                  t('help.patient5'),
                ]}
              />
            </>
          )}

          <HelpSection
            title={t('help.gettingStarted')}
            items={[
              t('help.start1'),
              t('help.start2'),
              t('help.start3'),
            ]}
          />

          <HelpSection
            title={t('help.features')}
            items={[
              t('help.feature1'),
              t('help.feature2'),
              t('help.feature3'),
              t('help.feature4'),
            ]}
          />
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
    gap: 20,
  },
  section: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: 8,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  itemText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
});

