import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, View, TouchableOpacity, Switch, Alert } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/auth';
import { updateUserProfile } from '@/services/user';
import { PrivacySettings } from '@/types/user';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const defaultPrivacySettings: PrivacySettings = {
  profileVisibility: 'contacts',
  showMedicalInfo: false,
  allowMessagesFrom: 'contacts',
  showOnlineStatus: true,
  shareDataForResearch: false,
  twoFactorAuth: false,
};

export default function PrivacySecurityScreen() {
  const { t } = useTranslation();
  const { userProfile, user } = useAuth();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = colorScheme ?? 'light';
  const colors = Colors[theme];

  const [settings, setSettings] = useState<PrivacySettings>(
    userProfile?.privacySettings || defaultPrivacySettings
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (userProfile?.privacySettings) {
      setSettings(userProfile.privacySettings);
    }
  }, [userProfile]);

  const handleSave = async () => {
    if (!user?.uid) return;
    
    setSaving(true);
    try {
      await updateUserProfile(user.uid, { privacySettings: settings });
      Alert.alert(t('privacy.saveSuccess'), t('privacy.saveSuccessDesc'));
      router.back();
    } catch (error) {
      Alert.alert(t('privacy.saveError'), t('privacy.saveErrorDesc'));
    } finally {
      setSaving(false);
    }
  };

  const SettingRow = ({ 
    icon, 
    title, 
    description, 
    value, 
    onValueChange,
    type = 'switch'
  }: {
    icon: string;
    title: string;
    description?: string;
    value: boolean | string;
    onValueChange: (value: any) => void;
    type?: 'switch' | 'select';
  }) => (
    <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
      <View style={styles.settingInfo}>
        <View style={styles.settingHeader}>
          <IconSymbol name={icon} size={20} color={colors.primary} />
          <ThemedText type="defaultSemiBold" style={styles.settingTitle}>
            {title}
          </ThemedText>
        </View>
        {description && (
          <ThemedText style={[styles.settingDesc, { color: colors.secondary }]}>
            {description}
          </ThemedText>
        )}
      </View>
      {type === 'switch' ? (
        <Switch
          value={value as boolean}
          onValueChange={onValueChange}
          trackColor={{ false: colors.border, true: colors.primary }}
          thumbColor="white"
        />
      ) : null}
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: t('profile.privacy') }} />
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          {/* Profile Visibility */}
          <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              {t('privacy.profileVisibility')}
            </ThemedText>
            <SettingRow
              icon="eye.fill"
              title={t('privacy.showProfile')}
              description={t('privacy.showProfileDesc')}
              value={settings.profileVisibility === 'public'}
              onValueChange={(val) => setSettings({ ...settings, profileVisibility: val ? 'public' : 'private' })}
            />
            <SettingRow
              icon="heart.text.square.fill"
              title={t('privacy.showMedicalInfo')}
              description={t('privacy.showMedicalInfoDesc')}
              value={settings.showMedicalInfo}
              onValueChange={(val) => setSettings({ ...settings, showMedicalInfo: val })}
            />
          </View>

          {/* Messages */}
          <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              {t('privacy.messages')}
            </ThemedText>
            <SettingRow
              icon="message.fill"
              title={t('privacy.allowMessages')}
              description={t('privacy.allowMessagesDesc')}
              value={settings.allowMessagesFrom === 'all'}
              onValueChange={(val) => setSettings({ ...settings, allowMessagesFrom: val ? 'all' : 'contacts' })}
            />
          </View>

          {/* Status */}
          <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              {t('privacy.status')}
            </ThemedText>
            <SettingRow
              icon="circle.fill"
              title={t('privacy.showOnlineStatus')}
              description={t('privacy.showOnlineStatusDesc')}
              value={settings.showOnlineStatus}
              onValueChange={(val) => setSettings({ ...settings, showOnlineStatus: val })}
            />
          </View>

          {/* Security */}
          <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              {t('privacy.security')}
            </ThemedText>
            <SettingRow
              icon="lock.fill"
              title={t('privacy.twoFactorAuth')}
              description={t('privacy.twoFactorAuthDesc')}
              value={settings.twoFactorAuth}
              onValueChange={(val) => setSettings({ ...settings, twoFactorAuth: val })}
            />
          </View>

          {/* Data Sharing */}
          <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              {t('privacy.dataSharing')}
            </ThemedText>
            <SettingRow
              icon="chart.bar.fill"
              title={t('privacy.shareDataForResearch')}
              description={t('privacy.shareDataForResearchDesc')}
              value={settings.shareDataForResearch}
              onValueChange={(val) => setSettings({ ...settings, shareDataForResearch: val })}
            />
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: colors.primary }]}
            onPress={handleSave}
            disabled={saving}
          >
            <ThemedText style={styles.saveButtonText}>
              {saving ? t('privacy.saving') : t('privacy.save')}
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
    gap: 20,
  },
  section: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  sectionTitle: {
    marginBottom: 8,
    fontSize: 18,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  settingInfo: {
    flex: 1,
    marginRight: 12,
  },
  settingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  settingTitle: {
    fontSize: 16,
  },
  settingDesc: {
    fontSize: 12,
    marginTop: 4,
  },
  saveButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

