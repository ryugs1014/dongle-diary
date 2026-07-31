import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  useColorScheme,
  Keyboard,
} from 'react-native';
import AppTouchableOpacity from '@/components/atoms/AppTouchableOpacity';
import AppText from '@/components/atoms/AppText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack } from 'expo-router';
import Toast from 'react-native-toast-message';
import * as Updates from 'expo-updates';
import {
  BackIcon,
  ArrowRightIcon,
  CalendarIcon,
  CheckListIcon,
  DetailEditIcon,
  DetailDeleteIcon,
  ResetSettingIcon,
} from '@/assets/icons';
import AppPromptModal from '@/components/modals/AppPromptModal';
import CustomSpinner from '@/components/common/CustomSpinner';

import { useDiaryStore } from '@/store/useDiaryStore';
import { useMemoStore } from '@/store/useMemoStore';
import { useChecklistStore } from '@/store/useChecklistStore';
import SvgDashedLine from '@/components/ui/SvgDashedLine';

type ResetTarget = 'diary' | 'memo' | 'checklist' | 'settings' | 'all' | null;

export default function ResetSettingsScreen() {
  const systemColorScheme = useColorScheme();

  const { theme, clearAllDiaries, resetSettings } = useDiaryStore();
  const { clearAllMemos, resetMemoSettings } = useMemoStore();
  const { clearAllChecklists, resetChecklistSettings } = useChecklistStore();

  const isDark =
    theme === 'system' ? systemColorScheme === 'dark' : theme === 'dark';

  const [modalVisible, setModalVisible] = useState(false);
  const [resetTarget, setResetTarget] = useState<ResetTarget>(null);
  const [promptValue, setPromptValue] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  const modalConfig = {
    diary: {
      title: '일기장 초기화',
      message:
        '모든 일기와 첨부된 사진이 영구 삭제되요.\n초기화를 원하시면 아래 단어를 입력해주세요.\n초기화는 되돌릴 수 없어요.',
    },
    memo: {
      title: '메모장 초기화',
      message:
        '모든 메모/폴더, 첨부파일이 영구 삭제되요.\n초기화를 원하시면 아래 단어를 입력해주세요.\n초기화는 되돌릴 수 없어요.',
    },
    checklist: {
      title: '할 일 목록 초기화',
      message:
        '모든 할 일 항목과 루틴이 삭제되요.\n초기화를 원하시면 아래 단어를 입력해주세요.\n초기화는 되돌릴 수 없어요.',
    },
    settings: {
      title: '설정 초기화',
      message:
        '모든 설정을 기본값으로 되돌려요.\n초기화를 원하시면 아래 단어를 입력해주세요.\n초기화는 되돌릴 수 없어요.',
    },
    all: {
      title: '전체 데이터 초기화',
      message:
        '모든 설정/데이터를 완전히 초기화 해요.\n초기화를 원하시면 아래 단어를 입력해주세요.\n초기화는 되돌릴 수 없어요.',
    },
  };

  const handleOpenModal = (target: ResetTarget) => {
    setResetTarget(target);
    setPromptValue(''); // 열 때마다 입력창 초기화
    setModalVisible(true);
  };

  const handleConfirmReset = () => {
    if (!resetTarget) return;

    const expectedTitle = modalConfig[resetTarget].title;

    // 1. 입력값이 정확한지 확인
    if (promptValue !== expectedTitle) {
      Keyboard.dismiss();
      setModalVisible(false);
      return Toast.show({
        type: 'error',
        text1: '입력한 텍스트가 일치하지 않아요',
        position: 'top',
        topOffset: 60,
      });
    }

    // 2. 입력값이 맞으면 모달을 닫고 스피너 실행
    Keyboard.dismiss();
    setModalVisible(false);
    setIsResetting(true);

    // 3. 최소 3초 대기 후 실제 삭제 로직 수행
    setTimeout(() => {
      switch (resetTarget) {
        case 'diary':
          clearAllDiaries();
          Toast.show({
            type: 'success',
            text1: `일기장이 초기화되었어요\n앱을 재시작합니다`,
            position: 'top',
            topOffset: 60,
          });
          break;
        case 'memo':
          clearAllMemos();
          Toast.show({
            type: 'success',
            text1: `메모장이 초기화되었어요\n앱을 재시작합니다`,
            position: 'top',
            topOffset: 60,
          });
          break;
        case 'checklist':
          clearAllChecklists();
          Toast.show({
            type: 'success',
            text1: `할 일 목록이 초기화되었어요\n앱을 재시작합니다`,
            position: 'top',
            topOffset: 60,
          });
          break;
        case 'settings':
          resetSettings();
          resetChecklistSettings();
          resetMemoSettings();
          Toast.show({
            type: 'success',
            text1: `설정이 기본값으로 변경되었어요\n앱을 재시작합니다`,
            position: 'top',
            topOffset: 60,
          });
          break;
        case 'all':
          clearAllDiaries();
          clearAllMemos();
          clearAllChecklists();
          resetSettings();
          resetChecklistSettings();
          resetMemoSettings();
          Toast.show({
            type: 'success',
            text1: `앱의 모든 데이터가 초기화되었어요\n앱을 재시작합니다`,
            position: 'top',
            topOffset: 60,
          });
          // router.replace('/'); // 필요 시 주석 해제
          break;
      }

      // 스피너 종료 및 모달 타겟 초기화
      setIsResetting(false);
      setResetTarget(null);

      // 🔥 4. 사용자가 토스트 메시지를 읽을 수 있도록 1.5초(1500ms) 대기 후 앱 재시작
      setTimeout(async () => {
        try {
          await Updates.reloadAsync();
        } catch (error) {
          // 만약 개발 모드 등의 이유로 reloadAsync가 실패할 경우 안전장치로 홈화면 이동
          console.log('재시작 실패, 홈으로 이동합니다.', error);
          router.replace('/');
        }
      }, 1500);
    }, 3000);
  };

  // 🔥 IconComponent 추가 및 렌더링 구조 변경
  const SettingItem = ({
    IconComponent,
    title,
    subtitle,
    onPress,
    rightElement,
    disabled,
    isDestructive,
  }: {
    IconComponent: any;
    title: string;
    subtitle?: string;
    onPress?: () => void;
    rightElement?: React.ReactNode;
    disabled?: boolean;
    isDestructive?: boolean;
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
        <View style={styles.settingIcon}>
          <IconComponent
            width={24}
            height={24}
            color={isDestructive ? '#FF6262' : isDark ? '#ffffff' : '#333333'}
          />
        </View>

        <View style={styles.textWrapper}>
          <AppText
            style={[
              styles.settingTitle,
              isDark && styles.darkText,
              isDestructive && { color: '#FF6262' },
            ]}
          >
            {title}
          </AppText>
          {subtitle && (
            <AppText style={[styles.settingSub, isDark && styles.darkSubText]}>
              {subtitle}
            </AppText>
          )}
        </View>
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
            데이터 초기화
          </AppText>
        </View>
        <View style={styles.rightIconsWrapper} />
      </View>

      <ScrollView
        style={styles.scrollWrapper}
        contentContainerStyle={{ paddingBottom: 40, paddingTop: 10 }}
      >
        <SettingItem
          IconComponent={CalendarIcon}
          title="일기장 초기화"
          onPress={() => handleOpenModal('diary')}
        />

        <SettingItem
          IconComponent={DetailEditIcon}
          title="메모장 초기화"
          onPress={() => handleOpenModal('memo')}
        />

        <SettingItem
          IconComponent={CheckListIcon}
          title="할 일 목록 초기화"
          onPress={() => handleOpenModal('checklist')}
        />

        <View style={styles.dividerWrapper}>
          <SvgDashedLine />
        </View>

        <SettingItem
          IconComponent={ResetSettingIcon}
          title="설정 초기화"
          onPress={() => handleOpenModal('settings')}
        />

        <SettingItem
          IconComponent={DetailDeleteIcon}
          title="전체 초기화"
          subtitle="모든 데이터가 삭제되며, 복구할 수 없습니다."
          isDestructive={true}
          onPress={() => handleOpenModal('all')}
        />
      </ScrollView>

      <AppPromptModal
        visible={modalVisible}
        title={resetTarget ? modalConfig[resetTarget].title : ''}
        message={resetTarget ? modalConfig[resetTarget].message : ''}
        value={promptValue}
        onChangeText={setPromptValue}
        placeholder={
          resetTarget ? ` [${modalConfig[resetTarget].title}] 입력` : ''
        }
        confirmText="초기화"
        confirmColor="#FF6262"
        onConfirm={handleConfirmReset}
        onCancel={() => {
          setModalVisible(false);
          setResetTarget(null);
        }}
      />

      {isResetting && (
        <View style={styles.fullScreenOverlay}>
          <CustomSpinner />
        </View>
      )}
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
  settingItemWithSub: {
    height: 68,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    marginRight: 14,
  },
  textWrapper: {
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
  darkText: { color: '#ffffff' },
  darkSubText: { color: '#aaa' },

  fullScreenOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },

  dividerWrapper: { paddingHorizontal: 20, paddingVertical: 10 },
});
