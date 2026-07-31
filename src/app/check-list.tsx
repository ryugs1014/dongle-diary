import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  useColorScheme,
  StyleSheet,
  Modal,
  Pressable,
  BackHandler,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack, useFocusEffect } from 'expo-router';

import ChecklistView from '@/components/sections/ChecklistView'; // 앞서 만든 컴포넌트
import { useDiaryStore } from '@/store/useDiaryStore';
import { useChecklistStore } from '@/store/useChecklistStore';
import AppTouchableOpacity from '@/components/atoms/AppTouchableOpacity';
import AppConfirmModal from '@/components/modals/AppConfirmModal';
import AppText from '@/components/atoms/AppText';

import {
  DocumentIcon,
  CheckListIcon,
  MenuIcon,
  SelectArrowIcon,
  CalendarIcon,
  DetailEditIcon,
} from '@/assets/icons';

export default function ChecklistMainScreen() {
  const [menuVisible, setMenuVisible] = useState(false);
  const [exitModalVisible, setExitModalVisible] = useState(false);

  const { language, theme, setLastVisitedScreen } = useDiaryStore();
  const { setLastVisitedChecklistScreen } = useChecklistStore();

  const systemColorScheme = useColorScheme();
  const isDark =
    theme === 'system' ? systemColorScheme === 'dark' : theme === 'dark';
  const t = (koText: string, enText: string) =>
    language === 'en' ? enText : koText;
  const bgColor = isDark ? '#111111' : '#fcfbfa';

  useEffect(() => {
    setLastVisitedScreen('checklist'); // 앱 재시작 시 마지막 방문지 기억 (필요시 DiaryStore 수정 필요)
    setLastVisitedChecklistScreen('checklist');
  }, [setLastVisitedScreen, setLastVisitedChecklistScreen]);

  // 뒤로 가기 시 앱 종료 확인
  useFocusEffect(
    useCallback(() => {
      const backAction = () => {
        setExitModalVisible(true);
        return true;
      };
      const backHandler = BackHandler.addEventListener(
        'hardwareBackPress',
        backAction,
      );
      return () => backHandler.remove();
    }, []),
  );

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={{ flex: 1, backgroundColor: bgColor }}
    >
      <Stack.Screen options={{ headerShown: false }} />

      {/* 헤더 */}
      <View style={styles.customHeader}>
        <AppTouchableOpacity
          style={styles.contentSelect}
          onPress={() => setMenuVisible(true)}
        >
          <CheckListIcon
            width={28}
            height={28}
            color={isDark ? '#ffffff' : '#111111'}
          />
          <SelectArrowIcon
            width={16}
            height={16}
            color={isDark ? '#ffffff' : '#111111'}
          />
        </AppTouchableOpacity>

        <View style={styles.rightIconsWrapper}>
          <AppTouchableOpacity onPress={() => router.push('/settings')}>
            <MenuIcon
              width={28}
              height={28}
              color={isDark ? '#ffffff' : '#111111'}
            />
          </AppTouchableOpacity>
        </View>
      </View>

      {/* 메인 뷰 */}
      <View style={{ flex: 1 }}>
        <ChecklistView isDark={isDark} t={t} />
      </View>

      {/* 일기장/메모장/할 일 목록 전환 모달 */}
      <Modal visible={menuVisible} transparent animationType="fade">
        {/* 모달 내용 기존과 동일하여 생략 (그대로 유지하세요) */}
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setMenuVisible(false)}
        >
          <View style={[styles.menuBox, isDark && styles.darkMenuBox]}>
            <AppTouchableOpacity
              style={[styles.menuItem, isDark && styles.darkMenuItem]}
              onPress={() => {
                setMenuVisible(false);
                router.replace('/');
              }}
            >
              <CalendarIcon
                width={24}
                height={24}
                color={isDark ? '#ffffff' : '#111111'}
              />
              <AppText style={[styles.menuText, isDark && styles.darkText]}>
                일기장
              </AppText>
            </AppTouchableOpacity>

            <AppTouchableOpacity
              style={[styles.menuItem, isDark && styles.darkMenuItem]}
              onPress={() => {
                setMenuVisible(false);
                router.replace('/memo-list');
              }}
            >
              <DetailEditIcon
                width={24}
                height={24}
                color={isDark ? '#ffffff' : '#111111'}
              />
              <AppText style={[styles.menuText, isDark && styles.darkText]}>
                메모장
              </AppText>
            </AppTouchableOpacity>

            <AppTouchableOpacity
              style={[styles.menuItem, styles.lastMenuItem]}
              onPress={() => setMenuVisible(false)}
            >
              <CheckListIcon
                width={24}
                height={24}
                color={isDark ? '#ffffff' : '#111111'}
              />
              <AppText style={[styles.menuText, isDark && styles.darkText]}>
                할 일 목록
              </AppText>
            </AppTouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      {/* 앱 종료 모달 */}
      <AppConfirmModal
        visible={exitModalVisible}
        title={t('동글일기', 'Exit App')}
        message={t('앱을 종료할까요?', 'Are you sure you want to exit?')}
        cancelText={t('취소', 'Cancel')}
        confirmText={t('종료', 'Exit')}
        confirmColor="#FF6F61"
        onCancel={() => setExitModalVisible(false)}
        onConfirm={() => {
          setExitModalVisible(false);
          BackHandler.exitApp();
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  customHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    height: 50,
  },
  contentSelect: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingRight: 20,
  },
  rightIconsWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    paddingTop: 100,
    paddingLeft: 20,
  },
  menuBox: {
    backgroundColor: '#ffffff',
    width: 160,
    borderRadius: 20,
    // overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    // elevation: 16,
  },
  darkMenuBox: { backgroundColor: '#1e1e1e' },
  menuItem: {
    padding: 16,
    borderBottomWidth: 1,
    alignItems: 'center',
    borderBottomColor: '#f1f2f3',
    flexDirection: 'row',
    gap: 8,
  },
  lastMenuItem: {
    borderBottomWidth: 0,
  },
  darkMenuItem: { borderBottomColor: '#333' },
  menuText: { fontSize: 14 },
});
