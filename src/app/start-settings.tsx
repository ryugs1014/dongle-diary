import React from 'react';
import { View, StyleSheet, ScrollView, useColorScheme } from 'react-native';
import AppTouchableOpacity from '@/components/atoms/AppTouchableOpacity';
import AppText from '@/components/atoms/AppText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack } from 'expo-router';
import { BackIcon } from '@/assets/icons';
import SvgDashedLine from '@/components/ui/SvgDashedLine';
import RadioSettingItem from '@/components/common/RadioSettingItem';
import { useDiaryStore } from '@/store/useDiaryStore';

export default function StartupSettingsScreen() {
  const { theme, startupScreen, setStartupScreen } = useDiaryStore();

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
            시작 화면
          </AppText>
        </View>
        <View style={styles.rightIconsWrapper} />
      </View>

      <ScrollView
        style={styles.scrollWrapper}
        contentContainerStyle={{ paddingBottom: 40, paddingTop: 10 }}
      >
        <RadioSettingItem
          title="일기장"
          isSelected={startupScreen === 'diary'}
          onPress={() => setStartupScreen('diary')}
          isDark={isDark}
        />

        <RadioSettingItem
          title="메모장"
          isSelected={startupScreen === 'memo'}
          onPress={() => setStartupScreen('memo')}
          isDark={isDark}
        />

        <RadioSettingItem
          title="마지막으로 접속한 화면"
          isSelected={startupScreen === 'last_visited'}
          onPress={() => setStartupScreen('last_visited')}
          isDark={isDark}
        />

        <View style={styles.dividerWrapper}>
          <SvgDashedLine />
        </View>

        <AppText style={[styles.infoText, isDark && styles.darkSubText]}>
          앱을 처음 실행할 때 가장 먼저 보여질 화면을 선택합니다.
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
    textAlign: 'center',
    lineHeight: 20,
  },
  darkText: { color: '#ffffff' },
  darkSubText: { color: '#aaa' },
});
