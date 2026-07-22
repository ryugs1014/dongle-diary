import React from 'react';
import { View, StyleSheet, ScrollView, useColorScheme } from 'react-native';
import AppTouchableOpacity from '@/components/AppTouchableOpacity';
import AppText from '@/components/AppText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack } from 'expo-router';
import { useDiaryStore } from '../store/useDiaryStore';
import { BackIcon } from '@/assets/icons';
import SvgDashedLine from '@/components/SvgDashedLine';
import RadioSettingItem from '@/components/RadioSettingItem';

export default function ThemeSettingsScreen() {
  const { theme, setTheme } = useDiaryStore();

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
            화면 테마
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
          isSelected={theme === 'system'}
          onPress={() => setTheme('system')}
          isDark={isDark}
        />

        {/*<View style={styles.dividerWrapper}>*/}
        {/*  <SvgDashedLine />*/}
        {/*</View>*/}

        <RadioSettingItem
          title="라이트 모드"
          isSelected={theme === 'light'}
          onPress={() => setTheme('light')}
          isDark={isDark}
        />

        {/*<View style={styles.dividerWrapper}>*/}
        {/*  <SvgDashedLine />*/}
        {/*</View>*/}

        <RadioSettingItem
          title="다크 모드"
          isSelected={theme === 'dark'}
          onPress={() => setTheme('dark')}
          isDark={isDark}
        />

        <View style={styles.dividerWrapper}>
          <SvgDashedLine />
        </View>

        <AppText style={[styles.infoText, isDark && styles.darkSubText]}>
          시스템 기본값을 선택하면 기기의 디스플레이 설정(라이트/다크)에 맞춰
          앱의 테마가 자동으로 변경됩니다.
        </AppText>
      </ScrollView>
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
    marginTop: 15,
    marginBottom: 40,
    paddingHorizontal: 20,
    fontSize: 13,
    color: '#888888',
    textAlign: 'left',
    lineHeight: 20,
  },
  darkText: { color: '#ffffff' },
  darkSubText: { color: '#aaa' },
});
