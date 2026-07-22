import React from 'react';
import { View, StyleSheet, ScrollView, useColorScheme } from 'react-native';
import AppTouchableOpacity from '@/components/AppTouchableOpacity';
import AppText from '@/components/AppText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack } from 'expo-router';
import { useDiaryStore } from '../store/useDiaryStore';
import { BackIcon } from '@/assets/icons'; // 헤더 뒤로가기 아이콘 (CloseIcon 대신 BackIcon 사용을 추천)
import SvgDashedLine from '@/components/SvgDashedLine';
import RadioSettingItem from '@/components/RadioSettingItem'; // 분리한 컴포넌트 import

export default function LanguageSettingsScreen() {
  const { language, setLanguage, theme } = useDiaryStore();

  const systemColorScheme = useColorScheme();
  const isDark =
    theme === 'system' ? systemColorScheme === 'dark' : theme === 'dark';

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={[styles.container, isDark && styles.darkContainer]}
    >
      <Stack.Screen options={{ headerShown: false }} />

      <View style={[styles.customHeader, isDark && styles.darkCustomHeader]}>
        <View style={styles.leftIconsWrapper}>
          <AppTouchableOpacity onPress={() => router.back()}>
            <BackIcon
              width={28}
              height={28}
              color={isDark ? '#ffffff' : '#111111'}
            />
          </AppTouchableOpacity>
        </View>
        <View style={styles.headerTitleWrapper}>
          <AppText
            style={[styles.customHeaderTitle, isDark && styles.darkText]}
          >
            언어 · Language
          </AppText>
        </View>
        <View style={styles.rightIconsWrapper} />
      </View>

      <ScrollView
        style={styles.scrollWrapper}
        contentContainerStyle={{ paddingBottom: 40, paddingTop: 10 }}
      >
        <RadioSettingItem
          title="시스템 기본값"
          isSelected={language === 'system'}
          onPress={() => setLanguage('system')}
          isDark={isDark}
        />

        {/*<View style={styles.dividerWrapper}>*/}
        {/*  <SvgDashedLine />*/}
        {/*</View>*/}

        <RadioSettingItem
          title="한국어"
          isSelected={language === 'ko'}
          onPress={() => setLanguage('ko')}
          isDark={isDark}
        />

        {/*<View style={styles.dividerWrapper}>*/}
        {/*  <SvgDashedLine />*/}
        {/*</View>*/}

        <RadioSettingItem
          title="English"
          isSelected={language === 'en'}
          onPress={() => setLanguage('en')}
          isDark={isDark}
        />
      </ScrollView>

      <AppText style={[styles.infoText, isDark && styles.darkSubText]}>
        시스템 기본값을 선택하면 기기의 언어 설정에 따라 앱의 언어가 자동으로
        변경됩니다.
      </AppText>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FCFBFA' },
  darkContainer: { backgroundColor: '#111111' },

  customHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    height: 50,
  },
  darkCustomHeader: {
    backgroundColor: '#111111',
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
  },
  leftIconsWrapper: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  headerTitleWrapper: {
    flex: 2,
    alignItems: 'center',
  },
  customHeaderTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  rightIconsWrapper: {
    flex: 1,
  },

  scrollWrapper: {
    paddingVertical: 10,
  },

  dividerWrapper: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },

  infoText: {
    marginTop: 'auto',
    marginBottom: 40,
    paddingHorizontal: 20,
    fontSize: 13,
    color: '#888888',
    textAlign: 'center',
    lineHeight: 20,
  },
  darkText: { color: '#ffffff' },
  darkSubText: { color: '#aaa' },
});
