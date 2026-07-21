import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import AppTouchableOpacity from '@/components/AppTouchableOpacity';
import AppText from '@/components/AppText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useDiaryStore, AppLanguage } from '../store/useDiaryStore';

export default function LanguageSettingsScreen() {
  const { language, setLanguage } = useDiaryStore();

  const OptionItem = ({
    label,
    value,
  }: {
    label: string;
    value: AppLanguage;
  }) => {
    const isSelected = language === value;
    return (
      <AppTouchableOpacity
        style={styles.optionItem}
        onPress={() => setLanguage(value)}
      >
        <AppText style={[styles.optionText, isSelected && styles.selectedText]}>
          {label}
        </AppText>
        {isSelected && <Ionicons name="checkmark" size={24} color="#FF6F61" />}
      </AppTouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen
        options={{ headerTitle: '언어', headerBackTitle: '설정' }}
      />

      <View style={styles.section}>
        <OptionItem label="시스템 기본값" value="system" />
        <OptionItem label="한국어" value="ko" />
        <OptionItem label="English" value="en" />
      </View>

      <AppText style={styles.description}>
        시스템 기본값을 선택하면 기기의 언어 설정에 따라 앱의 언어가 자동으로
        변경됩니다.
      </AppText>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  section: {
    marginTop: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  optionText: { fontSize: 16, color: '#333' },
  selectedText: { color: '#FF6F61', fontWeight: 'bold' },
  description: { padding: 20, fontSize: 13, color: '#888', lineHeight: 20 },
});
