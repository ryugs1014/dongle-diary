import React from 'react';
import { View, StyleSheet, ScrollView, useColorScheme } from 'react-native';
import AppTouchableOpacity from '@/components/atoms/AppTouchableOpacity';
import AppText from '@/components/atoms/AppText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack } from 'expo-router';
import { BackIcon } from '@/assets/icons';
import SvgDashedLine from '@/components/ui/SvgDashedLine';
import RadioSettingItem from '@/components/common/RadioSettingItem';

// 스토어 import (경로는 프로젝트에 맞게 조정해주세요)
import { useDiaryStore } from '@/store/useDiaryStore';
import { useMemoStore } from '@/store/useMemoStore';

export default function MemoAutoDeleteSettingsScreen() {
  const { theme } = useDiaryStore();
  const { autoDeleteDays, setAutoDeleteDays } = useMemoStore();

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
            자동 삭제
          </AppText>
        </View>
        <View style={styles.rightIconsWrapper} />
      </View>

      <ScrollView
        style={styles.scrollWrapper}
        contentContainerStyle={{ paddingBottom: 40, paddingTop: 10 }}
      >
        <RadioSettingItem
          title="30일 후 자동 삭제"
          isSelected={autoDeleteDays === 30}
          onPress={() => setAutoDeleteDays(30)}
          isDark={isDark}
        />

        <RadioSettingItem
          title="7일 후 자동 삭제"
          isSelected={autoDeleteDays === 7}
          onPress={() => setAutoDeleteDays(7)}
          isDark={isDark}
        />

        <RadioSettingItem
          title="1일 후 자동 삭제"
          isSelected={autoDeleteDays === 1}
          onPress={() => setAutoDeleteDays(1)}
          isDark={isDark}
        />

        <RadioSettingItem
          title="자동 삭제 끄기"
          isSelected={autoDeleteDays === 0} // 0을 '자동 삭제 안 함'으로 취급
          onPress={() => setAutoDeleteDays(0)}
          isDark={isDark}
        />

        <View style={styles.dividerWrapper}>
          <SvgDashedLine />
        </View>

        <AppText style={[styles.infoText, isDark && styles.darkSubText]}>
          설정한 날짜에 휴지통의 메모가 영구 삭제되고, 변경한 날짜보다 남은
          시간이 작으면 메모가 바로 삭제될 수 있어요.
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
