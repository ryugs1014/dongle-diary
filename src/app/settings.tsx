import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import AppText from '@/components/AppText';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useDiaryStore } from '../store/useDiaryStore';

export default function SettingsScreen() {
  const { language, theme, isAlarmEnabled, alarmTime, diaryFontSize } =
    useDiaryStore();

  // 현재 설정된 값을 한글로 표시하기 위한 변환기
  const getLanguageText = () => {
    if (language === 'ko') return '한국어';
    if (language === 'en') return 'English';
    return '시스템 기본값';
  };

  const getThemeText = () => {
    if (theme === 'light') return '라이트 모드';
    if (theme === 'dark') return '다크 모드';
    return '시스템 기본값';
  };

  // 💡 알람 시간 표시기 (오전/오후 포맷)
  const getAlarmText = () => {
    if (!isAlarmEnabled) return '꺼짐';
    const hours = alarmTime.getHours();
    const minutes = alarmTime.getMinutes();
    const ampm = hours >= 12 ? '오후' : '오전';
    const formattedHours = hours % 12 || 12;
    const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
    return `${ampm} ${formattedHours}:${formattedMinutes}`;
  };

  const SettingItem = ({ icon, title, onPress, rightText }: any) => (
    <TouchableOpacity
      style={styles.settingItem}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.settingLeft}>
        <Ionicons
          name={icon}
          size={24}
          color="#333"
          style={styles.settingIcon}
        />
        <AppText style={styles.settingTitle}>{title}</AppText>
      </View>
      <View style={styles.settingRight}>
        {rightText && <AppText style={styles.rightText}>{rightText}</AppText>}
        <Ionicons name="chevron-forward" size={20} color="#ccc" />
      </View>
    </TouchableOpacity>
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      <Stack.Screen
        options={{ headerTitle: '설정', headerBackTitle: '뒤로' }}
      />

      <View style={styles.section}>
        <AppText style={styles.sectionTitle}>데이터 관리</AppText>
        <SettingItem
          icon="cloud-upload-outline"
          title="수동 백업/복구"
          onPress={() => router.push('/backup-settings')}
        />
        <SettingItem
          icon="document-text-outline"
          title="PDF로 내보내기"
          onPress={() => router.push('/pdf-export')}
        />
      </View>

      <View style={styles.section}>
        <AppText style={styles.sectionTitle}>보안</AppText>
        <SettingItem
          icon="lock-closed-outline"
          title="화면 잠금 설정"
          onPress={() => router.push('/lock-settings')}
        />
        <SettingItem
          icon="notifications-outline"
          title="일기 작성 알림"
          rightText={getAlarmText()}
          onPress={() => router.push('/alarm-settings')}
        />
      </View>

      <View style={styles.section}>
        <AppText style={styles.sectionTitle}>앱 설정</AppText>
        <SettingItem
          icon="language-outline"
          title="언어"
          rightText={getLanguageText()}
          onPress={() => router.push('/language-settings')}
        />
        <SettingItem
          icon="moon-outline"
          title="화면 테마"
          rightText={getThemeText()}
          onPress={() => router.push('/theme-settings')}
        />
        <SettingItem
          icon="text-outline"
          title="글꼴 및 크기"
          rightText={`크기 ${diaryFontSize}단계`}
          onPress={() => router.push('/font-settings')}
        />
      </View>

      <AppText style={styles.versionText}>앱 버전 1.0.0</AppText>
    </ScrollView>
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
  sectionTitle: {
    fontSize: 13,
    color: '#888',
    fontWeight: 'bold',
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 5,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingLeft: { flexDirection: 'row', alignItems: 'center' },
  settingRight: { flexDirection: 'row', alignItems: 'center' },
  settingIcon: { marginRight: 15 },
  settingTitle: { fontSize: 16, color: '#333' },
  rightText: { fontSize: 14, color: '#888', marginRight: 8 },
  versionText: {
    textAlign: 'center',
    marginTop: 30,
    color: '#aaa',
    fontSize: 12,
  },
});
