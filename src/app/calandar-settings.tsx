import React from 'react';
import { View, StyleSheet, ScrollView, useColorScheme } from 'react-native';
import AppTouchableOpacity from '@/components/atoms/AppTouchableOpacity';
import AppText from '@/components/atoms/AppText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack } from 'expo-router';
import { useDiaryStore } from '../store/useDiaryStore';
import { BackIcon, ArrowRightIcon } from '@/assets/icons';
import CustomSwitch from '@/components/common/CustomSwitch';
import SvgDashedLine from '@/components/ui/SvgDashedLine';

export default function CalendarSettingsScreen() {
  const {
    theme,
    calendarStartMonday,
    alwaysShowDate,
    setCalendarStartMonday,
    setAlwaysShowDate,
  } = useDiaryStore();

  const systemColorScheme = useColorScheme();
  const isDark =
    theme === 'system' ? systemColorScheme === 'dark' : theme === 'dark';

  // LockSettingsScreen과 동일한 SettingItem 컴포넌트
  const SettingItem = ({
    title,
    subtitle,
    onPress,
    rightElement,
    disabled,
  }: {
    title: string;
    subtitle?: string;
    onPress?: () => void;
    rightElement?: React.ReactNode;
    disabled?: boolean;
  }) => (
    <AppTouchableOpacity
      style={[
        styles.settingItem,
        subtitle && styles.settingItemWithSub,
        disabled && { opacity: 0.2 },
      ]}
      onPress={onPress}
      disabled={disabled || !onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={styles.settingLeft}>
        <AppText style={[styles.settingTitle, isDark && styles.darkText]}>
          {title}
        </AppText>
        {subtitle && (
          <AppText style={[styles.settingSub, isDark && styles.darkSubText]}>
            {subtitle}
          </AppText>
        )}
      </View>

      <View style={[styles.settingRight, disabled && { opacity: 0 }]}>
        {rightElement ? (
          rightElement
        ) : (
          <ArrowRightIcon
            width={28}
            height={28}
            color={isDark ? '#666' : '#ccc'}
          />
        )}
      </View>
    </AppTouchableOpacity>
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
          title="월요일을 시작일로 표시"
          rightElement={
            <CustomSwitch
              value={calendarStartMonday}
              onValueChange={setCalendarStartMonday}
              isDark={isDark}
            />
          }
        />

        {/* <View style={styles.dividerWrapper}>
          <SvgDashedLine />
        </View> */}

        <SettingItem
          title="달력 날짜 항상 표시"
          rightElement={
            <CustomSwitch
              value={alwaysShowDate}
              onValueChange={setAlwaysShowDate}
              isDark={isDark}
            />
          }
        />

        <View style={styles.dividerWrapper}>
          <SvgDashedLine />
        </View>

        <AppText style={[styles.infoText, isDark && styles.darkSubText]}>
          시작화면의 달력 설정을 변경할 수 있습니다.
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
  headerTitleWrapper: { flex: 2, alignItems: 'center' },
  customHeaderTitle: { fontSize: 16, fontWeight: 'bold' },
  rightIconsWrapper: { flex: 1 },

  scrollWrapper: { paddingVertical: 10 },

  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    height: 52,
  },
  settingItemWithSub: {
    height: 68,
  },
  settingLeft: {
    flexDirection: 'column',
    justifyContent: 'center',
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingTitle: {
    fontSize: 16,
    color: '#333',
  },
  settingSub: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
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

  dividerWrapper: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
});
