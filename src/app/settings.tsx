import React from 'react';
import { View, StyleSheet, ScrollView, useColorScheme } from 'react-native';
import AppTouchableOpacity from '@/components/atoms/AppTouchableOpacity';
import AppText from '@/components/atoms/AppText';
import { Stack, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDiaryStore } from '../store/useDiaryStore';
import {
  BackIcon,
  ArrowRightIcon,
  LockIcon,
  ThemeIcon,
  FontIcon,
  LanguageIcon,
  InfoIcon,
  CalendarIcon,
  DocumentIcon,
  ScreenIcon,
  CheckListIcon,
  ResetIcon,
  DetailEditIcon,
} from '../../assets/icons'; // DocumentIcon 추가 필요할 수 있음
import SvgDashedLine from '@/components/ui/SvgDashedLine';

export default function SettingsScreen() {
  const {
    language,
    theme,
    diaryFontSize,
    startupScreen,
    isLockEnabled,
    isBiometricEnabled,
  } = useDiaryStore();

  const systemColorScheme = useColorScheme();
  const isDark =
    theme === 'system' ? systemColorScheme === 'dark' : theme === 'dark';

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

  const getStartupText = () => {
    if (startupScreen === 'diary') return '일기장';
    if (startupScreen === 'memo') return '메모장';
    return '마지막 접속 화면';
  };

  const getLockText = () => {
    if (!isLockEnabled) return '꺼짐';
    if (isBiometricEnabled) return '켜짐 (생체인증)';
    return '켜짐';
  };

  const SettingItem = ({
    IconComponent,
    title,
    onPress,
    rightText,
    hideChevron,
  }: any) => (
    <AppTouchableOpacity
      style={styles.settingItem}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.7 : 1}
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
          <AppText
            style={[
              styles.rightText,
              isDark && styles.darkSubText,
              hideChevron && styles.hideChevron,
            ]}
          >
            {rightText}
          </AppText>
        )}
        {!hideChevron && onPress && (
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
            설정
          </AppText>
        </View>
        <View style={styles.rightIconsWrapper} />
      </View>

      <ScrollView
        style={styles.scrollWrapper}
        contentContainerStyle={{ paddingBottom: 40, paddingTop: 10 }}
      >
        {/* 💡 새로 만든 설정 카테고리 진입점 */}
        <SettingItem
          IconComponent={CalendarIcon}
          title="일기장"
          onPress={() => router.push('/diary-settings')}
        />
        <SettingItem
          IconComponent={DetailEditIcon}
          title="메모장"
          onPress={() => router.push('/memo-settings')}
        />
        <SettingItem
          IconComponent={CheckListIcon}
          title="할 일 목록"
          onPress={() => router.push('/check-settings')}
        />

        <View style={styles.dividerWrapper}>
          <SvgDashedLine />
        </View>

        {/* 앱 공통 설정 */}
        <SettingItem
          IconComponent={ScreenIcon}
          title="시작 화면"
          rightText={getStartupText()}
          onPress={() => router.push('/start-settings')}
        />
        <SettingItem
          IconComponent={LockIcon}
          title="암호 잠금"
          rightText={getLockText()}
          onPress={() => router.push('/lock-settings')}
        />
        <SettingItem
          IconComponent={ResetIcon}
          title="초기화"
          onPress={() => router.push('/reset-settings')}
        />

        <View style={styles.dividerWrapper}>
          <SvgDashedLine />
        </View>

        <SettingItem
          IconComponent={ThemeIcon}
          title="화면 테마"
          rightText={getThemeText()}
          onPress={() => router.push('/theme-settings')}
        />
        <SettingItem
          IconComponent={FontIcon}
          title="글꼴 · 크기"
          rightText={`크기 ${diaryFontSize}단계`}
          onPress={() => router.push('/font-settings')}
        />
        <SettingItem
          IconComponent={LanguageIcon}
          title="언어 · Language"
          rightText={getLanguageText()}
          onPress={() => router.push('/language-settings')}
        />

        <View style={styles.dividerWrapper}>
          <SvgDashedLine />
        </View>

        <SettingItem
          IconComponent={InfoIcon}
          title="버전 정보"
          rightText="v1.0.0"
          hideChevron={true}
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
  darkText: { color: '#ffffff' },
  rightText: { fontSize: 14, color: '#888', marginRight: 10 },
  darkSubText: { color: '#aaa' },
  hideChevron: { fontSize: 16, marginRight: 10 },
  scrollWrapper: { paddingVertical: 10 },
  dividerWrapper: { paddingHorizontal: 20, paddingVertical: 10 },
});
