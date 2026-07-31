import React from 'react';
import { View, StyleSheet, ScrollView, useColorScheme } from 'react-native';
import AppTouchableOpacity from '@/components/atoms/AppTouchableOpacity';
import AppText from '@/components/atoms/AppText';
import { Stack, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDiaryStore } from '@/store/useDiaryStore';
import { useMemoStore } from '@/store/useMemoStore';
import {
  BackIcon,
  ArrowRightIcon,
  ClockIcon,
  FolderIcon,
  CalendarIcon,
} from '@/assets/icons';
import SvgDashedLine from '@/components/ui/SvgDashedLine';

export default function CheckSettingsScreen() {
  const { theme } = useDiaryStore();
  const { autoDeleteDays, memoStartupScreen } = useMemoStore();

  const systemColorScheme = useColorScheme();
  const isDark =
    theme === 'system' ? systemColorScheme === 'dark' : theme === 'dark';

  const getMemoStartupText = () => {
    if (memoStartupScreen === 'folder') return '폴더 목록';
    if (memoStartupScreen === 'list') return '메모 목록';
    return '마지막 접속 화면';
  };

  const getAutoDeleteText = () => {
    if (autoDeleteDays === 0) return '꺼짐';
    return `${autoDeleteDays}일`;
  };

  const SettingItem = ({ IconComponent, title, onPress, rightText }: any) => (
    <AppTouchableOpacity
      style={styles.settingItem}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.settingLeft}>
        <View style={styles.settingIcon}>
          <IconComponent
            width={24}
            height={24}
            color={isDark ? '#fffFFf' : '#333'}
          />
        </View>
        <AppText style={[styles.settingTitle, isDark && styles.darkText]}>
          {title}
        </AppText>
      </View>
      <View style={styles.settingRight}>
        {rightText && (
          <AppText style={[styles.rightText, isDark && styles.darkSubText]}>
            {rightText}
          </AppText>
        )}
        <ArrowRightIcon
          width={28}
          height={28}
          color={isDark ? '#666' : '#ccc'}
        />
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
            설정 - 할 일 목록
          </AppText>
        </View>
        <View style={styles.rightIconsWrapper} />
      </View>

      <ScrollView
        style={styles.scrollWrapper}
        contentContainerStyle={{ paddingBottom: 40, paddingTop: 10 }}
      >
        <SettingItem
          IconComponent={FolderIcon}
          title="카테고리 관리"
          onPress={() => router.push('/category-settings')}
        />
        <SettingItem
          IconComponent={ClockIcon}
          title="루틴 관리"
          onPress={() => router.push('/routine-settings')}
        />

        <View style={styles.dividerWrapper}>
          <SvgDashedLine />
        </View>

        <SettingItem
          IconComponent={CalendarIcon}
          title="달력 설정"
          onPress={() => router.push('/check-calendar-settings')}
        />
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
  darkText: { color: '#ffffff' },
  rightIconsWrapper: { flex: 1 },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    height: 50,
  },
  settingLeft: { flexDirection: 'row', alignItems: 'center' },
  settingRight: { flexDirection: 'row', alignItems: 'center' },
  settingIcon: { marginRight: 10 },
  settingTitle: { fontSize: 16, color: '#333' },
  rightText: { fontSize: 14, color: '#888', marginRight: 10 },
  darkSubText: { color: '#aaa' },
  scrollWrapper: { paddingVertical: 10 },
  dividerWrapper: { paddingHorizontal: 20, paddingVertical: 10 },
});
