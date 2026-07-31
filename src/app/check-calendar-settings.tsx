import React from 'react';
import { View, StyleSheet, ScrollView, useColorScheme } from 'react-native';
import AppTouchableOpacity from '@/components/atoms/AppTouchableOpacity';
import AppText from '@/components/atoms/AppText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack } from 'expo-router';
import { useDiaryStore } from '@/store/useDiaryStore';
import { useChecklistStore } from '@/store/useChecklistStore';
import { BackIcon } from '@/assets/icons';
import SvgDashedLine from '@/components/ui/SvgDashedLine';
import CustomSwitch from '@/components/common/CustomSwitch';

export default function ChecklistCalendarSettingsScreen() {
  const { theme } = useDiaryStore();
  const systemColorScheme = useColorScheme();
  const isDark =
    theme === 'system' ? systemColorScheme === 'dark' : theme === 'dark';

  // 🔥 설정 값들을 스토어에서 불러옵니다.
  const { showDateText, setShowDateText, isWeekView, setIsWeekView } =
    useChecklistStore();

  const SettingItem = ({
    title,
    value,
    onValueChange,
  }: {
    title: string;
    value: boolean;
    onValueChange: (val: boolean) => void;
  }) => (
    <View style={styles.settingItem}>
      <AppText style={[styles.settingTitle, isDark && styles.darkText]}>
        {title}
      </AppText>
      <CustomSwitch
        value={value}
        onValueChange={onValueChange}
        isDark={isDark}
      />
    </View>
  );

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
            달력 설정
          </AppText>
        </View>
        <View style={styles.rightIconsWrapper} />
      </View>

      <ScrollView
        style={styles.scrollWrapper}
        contentContainerStyle={{ paddingBottom: 40, paddingTop: 10 }}
      >
        <SettingItem
          title="날짜 표시"
          value={showDateText}
          onValueChange={(val) => setShowDateText(val)}
        />

        <SettingItem
          title="간략한 달력 보기"
          value={isWeekView}
          onValueChange={(val) => setIsWeekView(val)}
        />

        <View style={styles.dividerWrapper}>
          <SvgDashedLine />
        </View>

        <AppText style={[styles.infoText, isDark && styles.darkSubText]}>
          간략한 달력 보기는 할 일 목록에서 달력이 1주일 단위로 표시되요.
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

  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    height: 52,
  },
  settingTitle: {
    fontSize: 16,
    color: '#333',
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
