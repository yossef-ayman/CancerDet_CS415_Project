import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  TouchableOpacity, 
  Alert, 
  ActivityIndicator, 
  ScrollView, 
  TextInput, 
  Switch,
  Dimensions 
} from 'react-native';
import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const { width } = Dimensions.get('window');

// Server URL - Change as needed
const API_BASE_URL = 'http://192.168.1.6:8000'; // Replace with actual server address

// Available Cancer Types
const CANCER_TYPES = [
  { id: 'breast' },
  { id: 'colorectal' },
  { id: 'lung' },
] as const;

type CancerType = typeof CANCER_TYPES[number]['id'];

// Data Interfaces
interface BreastCancerData {
  radius_mean: string;
  texture_mean: string;
  perimeter_mean: string;
  area_mean: string;
  smoothness_mean: string;
  compactness_mean: string;
  concavity_mean: string;
  concave_points_mean: string;
  symmetry_mean: string;
  fractal_dimension_mean: string;
  radius_se: string;
  texture_se: string;
  perimeter_se: string;
  area_se: string;
  smoothness_se: string;
  compactness_se: string;
  concavity_se: string;
  concave_points_se: string;
  symmetry_se: string;
  fractal_dimension_se: string;
  radius_worst: string;
  texture_worst: string;
  perimeter_worst: string;
  area_worst: string;
  smoothness_worst: string;
  compactness_worst: string;
  concavity_worst: string;
  concave_points_worst: string;
  symmetry_worst: string;
  fractal_dimension_worst: string;
}

interface LungCancerData {
  age: string;
  pack_years: string;
  gender: 'Male' | 'Female';
  radon_exposure: 'High' | 'Low' | 'Unknown';
  cumulative_smoking:string;
  asbestos_exposure: boolean;
  secondhand_smoke_exposure: boolean;
  copd_diagnosis: boolean;
  alcohol_consumption: 'None' | 'Moderate' | 'High';
  family_history: boolean;
}

interface ColorectalCancerData {
  Age: string;
  Gender: 'Male' | 'Female';
  BMI: string;
  Lifestyle: 'Sedentary' | 'Active' | 'Very Active';
  Ethnicity: string;
  Family_History_CRC: boolean;
  'Pre-existing Conditions': string;
  'Carbohydrates (g)': string;
  'Proteins (g)': string;
  'Fats (g)': string;
  'Vitamin A (IU)': string;
  'Vitamin C (mg)': string;
  'Iron (mg)': string;
}

interface PredictionResult {
  request_id: string;
  model: string;
  prediction: {
    class: 'positive' | 'negative';
    probability: number;
    risk_level: 'high' | 'medium' | 'low';
    threshold_used: number;
  };
  processing_time_ms: number;
  received_features: any;
}

export default function AiAnalysisScreen() {
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const theme = colorScheme ?? 'light';
  // @ts-ignore
  const colors = Colors[theme];

  const [selectedCancerType, setSelectedCancerType] = useState<CancerType | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<PredictionResult | null>(null);
  
  // Model Data
  const [breastData, setBreastData] = useState<BreastCancerData>({
    radius_mean: '',
    texture_mean: '',
    perimeter_mean: '',
    area_mean: '',
    smoothness_mean: '',
    compactness_mean: '',
    concavity_mean: '',
    concave_points_mean: '',
    symmetry_mean: '',
    fractal_dimension_mean: '',
    radius_se: '',
    texture_se: '',
    perimeter_se: '',
    area_se: '',
    smoothness_se: '',
    compactness_se: '',
    concavity_se: '',
    concave_points_se: '',
    symmetry_se: '',
    fractal_dimension_se: '',
    radius_worst: '',
    texture_worst: '',
    perimeter_worst: '',
    area_worst: '',
    smoothness_worst: '',
    compactness_worst: '',
    concavity_worst: '',
    concave_points_worst: '',
    symmetry_worst: '',
    fractal_dimension_worst: ''
  });

  const [lungData, setLungData] = useState<LungCancerData>({
    age: '',
    pack_years: '',
    gender: 'Male',
    radon_exposure: 'Unknown',
    cumulative_smoking:'',
    asbestos_exposure: false,
    secondhand_smoke_exposure: false,
    copd_diagnosis: false,
    alcohol_consumption: 'None',
    family_history: false
  });

  const [colorectalData, setColorectalData] = useState<ColorectalCancerData>({
    Age: '',
    Gender: 'Male',
    BMI: '',
    Lifestyle: 'Sedentary',
    Ethnicity: '',
    Family_History_CRC: false,
    'Pre-existing Conditions': '',
    'Carbohydrates (g)': '',
    'Proteins (g)': '',
    'Fats (g)': '',
    'Vitamin A (IU)': '',
    'Vitamin C (mg)': '',
    'Iron (mg)': ''
  });

  const handleCancerTypeSelect = (cancerType: CancerType) => {
    setSelectedCancerType(cancerType);
    setResult(null);
  };

  // Function to send data to server
const sendPredictionRequest = async (modelName: string, features: any) => {
  try {
    let endpoint = '';

    if (modelName === 'breast') endpoint = '/predict/breast';
    else if (modelName === 'lung') endpoint = '/predict/lung';
    else if (modelName === 'colorectal') endpoint = '/predict/colorectal';

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        features: features,
        threshold: 0.5
      }),
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error('Prediction error:', error);
    throw new Error(`Failed to get prediction: ${error.message}`);
  }
};


  // Validation function
  const validateData = (data: any, cancerType: CancerType): boolean => {
    switch (cancerType) {
      case 'breast':
        for (const [key, value] of Object.entries(data)) {
          if (!value || isNaN(parseFloat(value as string))) {
            Alert.alert(t('ai.errors.dataError'), t('ai.errors.invalidValue', { field: key }));
            return false;
          }
        }
        break;
        
      case 'lung':
        if (!data.age || !data.pack_years) {
          Alert.alert(t('ai.errors.dataError'), t('ai.errors.missingLung'));
          return false;
        }
        if (isNaN(parseFloat(data.age)) || isNaN(parseFloat(data.pack_years))) {
          Alert.alert(t('ai.errors.dataError'), t('ai.errors.numericLung'));
          return false;
        }
        break;
        
      case 'colorectal':
        if (!data.Age || !data.BMI) {
          Alert.alert(t('ai.errors.dataError'), t('ai.errors.missingColorectal'));
          return false;
        }
        if (isNaN(parseFloat(data.Age)) || isNaN(parseFloat(data.BMI))) {
          Alert.alert(t('ai.errors.dataError'), t('ai.errors.numericColorectal'));
          return false;
        }
        break;
    }
    return true;
  };

  const handleAnalyze = async () => {
    if (!selectedCancerType) {
      Alert.alert(t('ai.errors.general'), t('ai.errors.selectType'));
      return;
    }

    let dataToSend: any;
    switch (selectedCancerType) {
      case 'breast':
        if (!validateData(breastData, 'breast')) return;
        dataToSend = { ...breastData };
        break;
      case 'lung':
        if (!validateData(lungData, 'lung')) return;
        dataToSend = {
          ...lungData,
          asbestos_exposure: lungData.asbestos_exposure ? 'Yes' : 'No',
          secondhand_smoke_exposure: lungData.secondhand_smoke_exposure ? 'Yes' : 'No',
          copd_diagnosis: lungData.copd_diagnosis ? 'Yes' : 'No',
          family_history: lungData.family_history ? 'Yes' : 'No'
        };
        break;
      case 'colorectal':
        if (!validateData(colorectalData, 'colorectal')) return;
        dataToSend = {
          ...colorectalData,
          Family_History_CRC: colorectalData.Family_History_CRC ? 'Yes' : 'No',
          Ethnicity: colorectalData.Ethnicity || 'Other',
          'Pre-existing Conditions': colorectalData['Pre-existing Conditions'] || 'None'
        };
        break;
      default:
        return;
    }

    setAnalyzing(true);
    setResult(null);

    try {
      const predictionResult = await sendPredictionRequest(selectedCancerType, dataToSend);
      setResult(predictionResult);
    } catch (error: any) {
      Alert.alert(t('ai.errors.analysisError'), error.message || t('ai.errors.serverError'));
    } finally {
      setAnalyzing(false);
    }
  };

  const renderBreastCancerForm = () => (
    <View style={styles.fullFormContainer}>
      <ThemedText type="subtitle" style={styles.formTitle}>{t('ai.forms.breast.title')}</ThemedText>
      <ThemedText style={styles.formSubtitle}>{t('ai.forms.breast.subtitle')}</ThemedText>
      
      <View style={styles.formScrollView}>
        <View style={styles.formGrid}>
          {/* Group 1: Mean Features */}
          <View style={styles.featureGroup}>
            <ThemedText type="defaultSemiBold" style={styles.groupTitle}>{t('ai.forms.breast.groups.mean')}</ThemedText>
            {[
              { key: 'radius_mean' },
              { key: 'texture_mean' },
              { key: 'perimeter_mean' },
              { key: 'area_mean' },
              { key: 'smoothness_mean' },
              { key: 'compactness_mean' },
              { key: 'concavity_mean' },
              { key: 'concave_points_mean' },
              { key: 'symmetry_mean' },
              { key: 'fractal_dimension_mean' },
            ].map(({ key }) => (
              <View key={key} style={styles.formRow}>
                <ThemedText style={styles.inputLabel}>{t(`ai.forms.breast.fields.${key}`)}</ThemedText>
                <TextInput
                  style={[styles.input, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.text }]}
                  value={breastData[key as keyof BreastCancerData]}
                  onChangeText={(text) => setBreastData(prev => ({ ...prev, [key]: text }))}
                  placeholder={t('ai.forms.breast.placeholder')}
                  placeholderTextColor={colors.icon}
                  keyboardType="decimal-pad"
                />
              </View>
            ))}
          </View>

          {/* Group 2: Standard Error Features */}
          <View style={styles.featureGroup}>
            <ThemedText type="defaultSemiBold" style={styles.groupTitle}>{t('ai.forms.breast.groups.se')}</ThemedText>
            {[
              { key: 'radius_se' },
              { key: 'texture_se' },
              { key: 'perimeter_se' },
              { key: 'area_se' },
              { key: 'smoothness_se' },
              { key: 'compactness_se' },
              { key: 'concavity_se' },
              { key: 'concave_points_se' },
              { key: 'symmetry_se' },
              { key: 'fractal_dimension_se' },
            ].map(({ key }) => (
              <View key={key} style={styles.formRow}>
                <ThemedText style={styles.inputLabel}>{t(`ai.forms.breast.fields.${key}`)}</ThemedText>
                <TextInput
                  style={[styles.input, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.text }]}
                  value={breastData[key as keyof BreastCancerData]}
                  onChangeText={(text) => setBreastData(prev => ({ ...prev, [key]: text }))}
                  placeholder={t('ai.forms.breast.placeholder')}
                  placeholderTextColor={colors.icon}
                  keyboardType="decimal-pad"
                />
              </View>
            ))}
          </View>

          {/* Group 3: Worst Features */}
          <View style={styles.featureGroup}>
            <ThemedText type="defaultSemiBold" style={styles.groupTitle}>{t('ai.forms.breast.groups.worst')}</ThemedText>
            {[
              { key: 'radius_worst' },
              { key: 'texture_worst' },
              { key: 'perimeter_worst' },
              { key: 'area_worst' },
              { key: 'smoothness_worst' },
              { key: 'compactness_worst' },
              { key: 'concavity_worst' },
              { key: 'concave_points_worst' },
              { key: 'symmetry_worst' },
              { key: 'fractal_dimension_worst' },
            ].map(({ key }) => (
              <View key={key} style={styles.formRow}>
                <ThemedText style={styles.inputLabel}>{t(`ai.forms.breast.fields.${key}`)}</ThemedText>
                <TextInput
                  style={[styles.input, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.text }]}
                  value={breastData[key as keyof BreastCancerData]}
                  onChangeText={(text) => setBreastData(prev => ({ ...prev, [key]: text }))}
                  placeholder={t('ai.forms.breast.placeholder')}
                  placeholderTextColor={colors.icon}
                  keyboardType="decimal-pad"
                />
              </View>
            ))}
          </View>
        </View>
      </View>
    </View>
  );

  const renderLungCancerForm = () => (
    <View style={styles.fullFormContainer}>
      <ThemedText type="subtitle" style={styles.formTitle}>{t('ai.forms.lung.title')}</ThemedText>
      
      <View style={styles.formScrollView}>
        <View style={styles.formGrid}>
          {/* Basic Information */}
          <View style={styles.featureGroup}>
            <ThemedText type="defaultSemiBold" style={styles.groupTitle}>{t('ai.forms.lung.groups.basic')}</ThemedText>
            
            <View style={styles.formRow}>
              <ThemedText style={styles.inputLabel}>{t('ai.forms.lung.fields.age')}</ThemedText>
              <TextInput
                style={[styles.input, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.text }]}
                value={lungData.age}
                onChangeText={(text) =>
  setLungData(prev => ({
    ...prev,
    age: text,
    cumulative_smoking:
      ((parseFloat(text) || 0) * (parseFloat(prev.pack_years) || 0)).toString()
  }))
}
                placeholder={t('ai.forms.lung.placeholders.age')}
                placeholderTextColor={colors.icon}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.formRow}>
              <ThemedText style={styles.inputLabel}>{t('ai.forms.lung.fields.packYears')}</ThemedText>
              <TextInput
                style={[styles.input, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.text }]}
                value={lungData.pack_years}
                onChangeText={(text) =>
  setLungData(prev => ({
    ...prev,
    pack_years: text,
    cumulative_smoking:
      ((parseFloat(prev.age) || 0) * (parseFloat(text) || 0)).toString()
  }))
}
                placeholder={t('ai.forms.lung.placeholders.packYears')}
                placeholderTextColor={colors.icon}
                keyboardType="decimal-pad"
              />
            </View>
            <View style={styles.formRow}>
  <ThemedText style={styles.inputLabel}>{t('ai.forms.lung.fields.cumulative')}</ThemedText>
  <TextInput
    style={[styles.input, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.text }]}
    value={lungData.cumulative_smoking?.toString() || "0"}
    placeholder="0"
    placeholderTextColor={colors.icon}
    editable={false}
  />
</View>


            <View style={styles.formRow}>
              <ThemedText style={styles.inputLabel}>{t('ai.forms.lung.fields.gender')}</ThemedText>
              <View style={styles.radioGroup}>
                {['Male', 'Female'].map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.radioOption,
                      {
                        backgroundColor: lungData.gender === option ? colors.primary : colors.surface,
                        borderColor: colors.border
                      }
                    ]}
                    onPress={() => setLungData(prev => ({ ...prev, gender: option as 'Male' | 'Female' }))}
                  >
                    <ThemedText style={{ color: lungData.gender === option ? 'white' : colors.text }}>
                      {t(`ai.forms.lung.options.${option.toLowerCase()}`)}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formRow}>
              <ThemedText style={styles.inputLabel}>{t('ai.forms.lung.fields.radon')}</ThemedText>
              <View style={styles.radioGroup}>
                {['High', 'Low', 'Unknown'].map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.radioOption,
                      {
                        backgroundColor: lungData.radon_exposure === option ? colors.primary : colors.surface,
                        borderColor: colors.border
                      }
                    ]}
                    onPress={() => setLungData(prev => ({ ...prev, radon_exposure: option as any }))}
                  >
                    <ThemedText style={{ color: lungData.radon_exposure === option ? 'white' : colors.text }}>
                      {t(`ai.forms.lung.options.${option.toLowerCase()}`)}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Risk Factors */}
          <View style={styles.featureGroup}>
            <ThemedText type="defaultSemiBold" style={styles.groupTitle}>{t('ai.forms.lung.groups.risk')}</ThemedText>
            
            {[
              { key: 'asbestos_exposure', label: 'asbestos' },
              { key: 'secondhand_smoke_exposure', label: 'secondhand' },
              { key: 'copd_diagnosis', label: 'copd' },
              { key: 'family_history', label: 'history' },
            ].map(({ key, label }) => (
              <View key={key} style={styles.switchRow}>
                <ThemedText style={styles.inputLabel}>{t(`ai.forms.lung.fields.${label}`)}</ThemedText>
                <Switch
                  value={lungData[key as keyof LungCancerData] as boolean}
                  onValueChange={(value) => setLungData(prev => ({ ...prev, [key]: value }))}
                  trackColor={{ false: colors.border, true: colors.primary }}
                />
              </View>
            ))}

            <View style={styles.formRow}>
              <ThemedText style={styles.inputLabel}>{t('ai.forms.lung.fields.alcohol')}</ThemedText>
              <View style={styles.radioGroup}>
                {['None', 'Moderate', 'High'].map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.radioOption,
                      {
                        backgroundColor: lungData.alcohol_consumption === option ? colors.primary : colors.surface,
                        borderColor: colors.border
                      }
                    ]}
                    onPress={() => setLungData(prev => ({ ...prev, alcohol_consumption: option as any }))}
                  >
                    <ThemedText style={{ color: lungData.alcohol_consumption === option ? 'white' : colors.text }}>
                      {t(`ai.forms.lung.options.${option.toLowerCase()}`)}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </View>
      </View>
    </View>
  );

  const renderColorectalCancerForm = () => (
    <View style={styles.fullFormContainer}>
      <ThemedText type="subtitle" style={styles.formTitle}>{t('ai.forms.colorectal.title')}</ThemedText>
      
      <View style={styles.formScrollView}>
        <View style={styles.formGrid}>
          {/* Personal Information */}
          <View style={styles.featureGroup}>
            <ThemedText type="defaultSemiBold" style={styles.groupTitle}>{t('ai.forms.colorectal.groups.personal')}</ThemedText>
            
            <View style={styles.formRow}>
              <ThemedText style={styles.inputLabel}>{t('ai.forms.colorectal.fields.age')}</ThemedText>
              <TextInput
                style={[styles.input, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.text }]}
                value={colorectalData.Age}
                onChangeText={(text) => setColorectalData(prev => ({ ...prev, Age: text }))}
                placeholder={t('ai.forms.colorectal.placeholders.age')}
                placeholderTextColor={colors.icon}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.formRow}>
              <ThemedText style={styles.inputLabel}>{t('ai.forms.colorectal.fields.gender')}</ThemedText>
              <View style={styles.radioGroup}>
                {['Male', 'Female'].map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.radioOption,
                      {
                        backgroundColor: colorectalData.Gender === option ? colors.primary : colors.surface,
                        borderColor: colors.border
                      }
                    ]}
                    onPress={() => setColorectalData(prev => ({ ...prev, Gender: option as 'Male' | 'Female' }))}
                  >
                    <ThemedText style={{ color: colorectalData.Gender === option ? 'white' : colors.text }}>
                      {t(`ai.forms.colorectal.options.${option.toLowerCase()}`)}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formRow}>
              <ThemedText style={styles.inputLabel}>{t('ai.forms.colorectal.fields.bmi')}</ThemedText>
              <TextInput
                style={[styles.input, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.text }]}
                value={colorectalData.BMI}
                onChangeText={(text) => setColorectalData(prev => ({ ...prev, BMI: text }))}
                placeholder={t('ai.forms.colorectal.placeholders.bmi')}
                placeholderTextColor={colors.icon}
                keyboardType="decimal-pad"
              />
            </View>

            <View style={styles.formRow}>
              <ThemedText style={styles.inputLabel}>{t('ai.forms.colorectal.fields.lifestyle')}</ThemedText>
              <View style={styles.radioGroup}>
                {['Sedentary', 'Active', 'Very Active'].map((option) => {
                  const keyMap: Record<string, string> = {
                    'Sedentary': 'sedentary',
                    'Active': 'active',
                    'Very Active': 'veryActive'
                  };
                  return (
                    <TouchableOpacity
                      key={option}
                      style={[
                        styles.radioOption,
                        {
                          backgroundColor: colorectalData.Lifestyle === option ? colors.primary : colors.surface,
                          borderColor: colors.border
                        }
                      ]}
                      onPress={() => setColorectalData(prev => ({ ...prev, Lifestyle: option as any }))}
                    >
                      <ThemedText style={{ color: colorectalData.Lifestyle === option ? 'white' : colors.text }}>
                        {t(`ai.forms.colorectal.options.${keyMap[option]}`)}
                      </ThemedText>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={styles.formRow}>
              <ThemedText style={styles.inputLabel}>{t('ai.forms.colorectal.fields.ethnicity')}</ThemedText>
              <TextInput
                style={[styles.input, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.text }]}
                value={colorectalData.Ethnicity}
                onChangeText={(text) => setColorectalData(prev => ({ ...prev, Ethnicity: text }))}
                placeholder={t('ai.forms.colorectal.placeholders.ethnicity')}
                placeholderTextColor={colors.icon}
              />
            </View>

            <View style={styles.switchRow}>
              <ThemedText style={styles.inputLabel}>{t('ai.forms.colorectal.fields.history')}</ThemedText>
              <Switch
                value={colorectalData.Family_History_CRC}
                onValueChange={(value) => setColorectalData(prev => ({ ...prev, Family_History_CRC: value }))}
                trackColor={{ false: colors.border, true: colors.primary }}
              />
            </View>

            <View style={styles.formRow}>
              <ThemedText style={styles.inputLabel}>{t('ai.forms.colorectal.fields.conditions')}</ThemedText>
              <TextInput
                style={[styles.input, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.text }]}
                value={colorectalData['Pre-existing Conditions']}
                onChangeText={(text) => setColorectalData(prev => ({ ...prev, 'Pre-existing Conditions': text }))}
                placeholder={t('ai.forms.colorectal.placeholders.conditions')}
                placeholderTextColor={colors.icon}
              />
            </View>
          </View>

          {/* Nutritional Information */}
          <View style={styles.featureGroup}>
            <ThemedText type="defaultSemiBold" style={styles.groupTitle}>{t('ai.forms.colorectal.groups.nutritional')}</ThemedText>
            
            {[
              { key: 'Carbohydrates (g)', label: 'carbs' },
              { key: 'Proteins (g)', label: 'proteins' },
              { key: 'Fats (g)', label: 'fats' },
              { key: 'Vitamin A (IU)', label: 'vitA' },
              { key: 'Vitamin C (mg)', label: 'vitC' },
              { key: 'Iron (mg)', label: 'iron' },
            ].map(({ key, label }) => (
              <View key={key} style={styles.formRow}>
                <ThemedText style={styles.inputLabel}>{t(`ai.forms.colorectal.fields.${label}`)}</ThemedText>
                <TextInput
                  style={[styles.input, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.text }]}
                  value={colorectalData[key as keyof ColorectalCancerData] as string}
                  onChangeText={(text) => setColorectalData(prev => ({ ...prev, [key]: text }))}
                  placeholder={t('ai.forms.colorectal.placeholders.generic', { label: t(`ai.forms.colorectal.fields.${label}`) })}
                  placeholderTextColor={colors.icon}
                  keyboardType="numeric"
                />
              </View>
            ))}
          </View>
        </View>
      </View>
    </View>
  );

  const renderDataForm = () => {
    if (!selectedCancerType) return null;

    switch (selectedCancerType) {
      case 'breast':
        return renderBreastCancerForm();
      case 'lung':
        return renderLungCancerForm();
      case 'colorectal':
        return renderColorectalCancerForm();
      default:
        return null;
    }
  };

  const renderResult = () => {
    if (!result) return null;

    const { prediction } = result;
    const isPositive = prediction.class === 'positive';
    const resultColor = isPositive ? colors.error : colors.success;
    const riskLevelColors: Record<string, string> = {
      high: colors.error,
      medium: colors.accent,
      low: colors.success
    };

    return (
      <View style={[styles.resultContainer, { 
        backgroundColor: resultColor + '15', 
        borderColor: resultColor 
      }]}>
        <View style={styles.resultHeader}>
          <IconSymbol 
            name={isPositive ? "exclamationmark.triangle.fill" : "checkmark.circle.fill"} 
            size={24} 
            color={resultColor} 
          />
          <ThemedText type="subtitle" style={{ color: resultColor, marginLeft: 8 }}>
            {t('ai.results.title')}
          </ThemedText>
        </View>
        
        <View style={styles.resultContent}>
          <View style={styles.resultRow}>
            <ThemedText style={styles.resultLabel}>{t('ai.results.diagnosis')}</ThemedText>
            <ThemedText type="defaultSemiBold" style={{ color: resultColor }}>
              {isPositive ? t('ai.results.positive') : t('ai.results.negative')}
            </ThemedText>
          </View>
          
          <View style={styles.resultRow}>
            <ThemedText style={styles.resultLabel}>{t('ai.results.probability')}</ThemedText>
            <ThemedText type="defaultSemiBold">
              {(prediction.probability * 100).toFixed(2)}%
            </ThemedText>
          </View>
          
          <View style={styles.resultRow}>
            <ThemedText style={styles.resultLabel}>{t('ai.results.riskLevel')}</ThemedText>
            <View style={[styles.riskBadge, { backgroundColor: riskLevelColors[prediction.risk_level] + '30' }]}>
              <ThemedText style={{ color: riskLevelColors[prediction.risk_level] }}>
                {t(`ai.results.levels.${prediction.risk_level}`)}
              </ThemedText>
            </View>
          </View>
          
          <View style={styles.resultRow}>
            <ThemedText style={styles.resultLabel}>{t('ai.results.threshold')}</ThemedText>
            <ThemedText>{prediction.threshold_used}</ThemedText>
          </View>
          
          <View style={[styles.resultFooter, { borderTopColor: colors.border }]}>
            <ThemedText style={{ fontSize: 12, opacity: 0.6 }}>
              {t('ai.results.type')} {t(`ai.types.${selectedCancerType}`)}
            </ThemedText>
            <ThemedText style={{ fontSize: 12, opacity: 0.6 }}>
              {t('ai.results.time', { time: result.processing_time_ms })}
            </ThemedText>
          </View>
        </View>
      </View>
    );
  };

  const isAnalyzeDisabled = !selectedCancerType || analyzing;

return (
  <>
    <Stack.Screen options={{ title: t('ai.title') }} />

    <ThemedView style={{ flex: 1 }}>
      <ScrollView 
        style={{ flex: 1 }}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >

          {/* Header */}
          <ThemedText type="title" style={styles.header}>
            {t('ai.title')}
          </ThemedText>

          <ThemedText style={styles.description}>
            {t('ai.description')}
          </ThemedText>

          {/* Cancer Type Selection */}
          <View style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              {t('ai.chooseType')}
            </ThemedText>
            <View style={styles.cancerTypesContainer}>
              {CANCER_TYPES.map((cancer) => (
                <TouchableOpacity
                  key={cancer.id}
                  style={[
                    styles.cancerTypeButton,
                    {
                      backgroundColor: selectedCancerType === cancer.id 
                        ? colors.primary 
                        : colors.surface,
                      borderColor:
                        selectedCancerType === cancer.id
                          ? colors.primary
                          : colors.border,
                    },
                  ]}
                  onPress={() => handleCancerTypeSelect(cancer.id)}
                  disabled={analyzing}
                >
                  <ThemedText
                    style={{
                      color:
                        selectedCancerType === cancer.id
                          ? "white"
                          : colors.text,
                    }}
                  >
                    {t(`ai.types.${cancer.id}`)}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Form */}
          {selectedCancerType && (
            <View style={{ marginTop: 10 }}>
              <ThemedText type="subtitle" style={styles.sectionTitle}>
                {t('ai.enterData', { type: t(`ai.types.${selectedCancerType}`) })}
              </ThemedText>

              <View style={{ marginTop: 12 }}>
                {renderDataForm()}
              </View>
            </View>
          )}

          {/* Result */}
          {!analyzing && result && renderResult()}
      </ScrollView>

      {/* Action Button */}
      <ThemedView style={styles.fixedButtonContainer}>
        <TouchableOpacity
          style={[
            styles.analyzeButton,
            {
              backgroundColor: !isAnalyzeDisabled
                ? colors.primary
                : colors.icon + "40",
            },
          ]}
          onPress={handleAnalyze}
          disabled={isAnalyzeDisabled}
        >
          <IconSymbol
            name="brain.head.profile"
            size={24}
            color="white"
            style={{ marginRight: 8 }}
          />
          <ThemedText style={styles.buttonText}>{t('ai.actions.analyze')}</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    </ThemedView>
  </>
);
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
    paddingBottom: 120,
  },
  header: {
    marginBottom: 8,
  },
  description: {
    marginBottom: 24,
    opacity: 0.7,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  cancerTypesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  cancerTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    minWidth: '30%',
    justifyContent: 'center',
    gap: 8,
  },
  cancerTypeText: {
    fontWeight: '600',
    fontSize: 14,
  },
  fullFormContainer: {
    width: '100%',
  },
  formTitle: {
    marginBottom: 8,
    textAlign: 'center',
  },
  formSubtitle: {
    fontSize: 12,
    opacity: 0.7,
    marginBottom: 16,
    textAlign: 'center',
  },
  formScrollView: {
    width: '100%',
  },
  formGrid: {
    width: '100%',
  },
  featureGroup: {
    marginBottom: 24,
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.02)',
  },
  groupTitle: {
    fontSize: 16,
    marginBottom: 16,
    color: '#666',
  },
  formRow: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    marginBottom: 8,
    opacity: 0.8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  radioGroup: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  radioOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  analyzeButton: {
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  loadingContainer: {
    marginVertical: 24,
    padding: 20,
  },
  resultContainer: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 24,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  resultContent: {
    marginTop: 8,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 4,
  },
  resultLabel: {
    fontSize: 14,
    opacity: 0.7,
  },
  resultFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  riskBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginTop: 16,
    gap: 8,
  },
  tipText: {
    fontSize: 14,
    flex: 1,
  },
  fixedButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    paddingBottom: 34,
    backgroundColor: 'transparent',
  },
});