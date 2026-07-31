import React, { useEffect, useRef, useState, useCallback } from 'react';
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
import PagerView from 'react-native-pager-view';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import MemoListView from '@/components/sections/MemoListView';
import MemoFolderView from '@/components/sections/MemoFolderView';
import { useDiaryStore } from '@/store/useDiaryStore';
import { useMemoStore } from '@/store/useMemoStore';
import AppTouchableOpacity from '@/components/atoms/AppTouchableOpacity';
import AppConfirmModal from '@/components/modals/AppConfirmModal';
import {
  CalendarIcon,
  DocumentIcon,
  MenuIcon,
  SearchIcon,
  SelectArrowIcon,
  CheckListIcon,
  DetailEditIcon,
} from '@/assets/icons';
import AppText from '@/components/atoms/AppText';

export default function MemoMainScreen() {
  const pagerRef = useRef<PagerView>(null);
  const [menuVisible, setMenuVisible] = useState(false);

  const { language, theme, setLastVisitedScreen } = useDiaryStore();
  const { memoStartupScreen, lastVisitedMemoScreen, setLastVisitedMemoScreen } =
    useMemoStore(); // 💡 추가

  const systemColorScheme = useColorScheme();
  const isDark =
    theme === 'system' ? systemColorScheme === 'dark' : theme === 'dark';
  const t = (koText: string, enText: string) =>
    language === 'en' ? enText : koText;

  // 💡 설정에 따른 최초 진입 페이지 계산
  const initialPageIndex = (() => {
    if (memoStartupScreen === 'folder') return 0;
    if (memoStartupScreen === 'list') return 1;
    return lastVisitedMemoScreen === 'folder' ? 0 : 1;
  })();

  const [currentPage, setCurrentPage] = useState(initialPageIndex);
  const [exitModalVisible, setExitModalVisible] = useState(false);

  const slideToFolders = () => pagerRef.current?.setPage(0);
  const slideToList = () => pagerRef.current?.setPage(1);

  const bgColor = isDark ? '#111111' : '#fcfbfa';

  useEffect(() => {
    setLastVisitedScreen('memo');
  }, [setLastVisitedScreen]);

  // 💡 뒤로 가기 제어 로직 추가
  useFocusEffect(
    useCallback(() => {
      const backAction = () => {
        if (currentPage === 1) {
          // 리스트 뷰(1)에 있을 때 뒤로 가기를 누르면 폴더 뷰(0)로 이동
          slideToFolders();
          return true;
        } else if (currentPage === 0) {
          // 폴더 뷰(0)에 있을 때 앱 종료 모달 띄우기
          setExitModalVisible(true);
          return true;
        }
        return false;
      };

      const backHandler = BackHandler.addEventListener(
        'hardwareBackPress',
        backAction,
      );

      return () => backHandler.remove();
    }, [currentPage]),
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView
        edges={['top', 'left', 'right']}
        style={{ flex: 1, backgroundColor: bgColor }}
      >
        <Stack.Screen options={{ headerShown: false }} />

        <View style={[styles.customHeader]}>
          <AppTouchableOpacity
            style={styles.contentSelect}
            onPress={() => setMenuVisible(true)}
          >
            <DetailEditIcon
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
            <AppTouchableOpacity onPress={() => router.push('/memo-search')}>
              <SearchIcon
                width={28}
                height={28}
                color={isDark ? '#ffffff' : '#111111'}
              />
            </AppTouchableOpacity>

            <AppTouchableOpacity onPress={() => router.push('/settings')}>
              <MenuIcon
                width={28}
                height={28}
                color={isDark ? '#ffffff' : '#111111'}
              />
            </AppTouchableOpacity>
          </View>
        </View>

        <PagerView
          style={{ flex: 1 }}
          initialPage={initialPageIndex} // 💡 동적으로 설정된 초기 페이지 적용
          ref={pagerRef}
          overdrag={false}
          onPageSelected={(e) => {
            // 💡 스와이프 할 때마다 현재 페이지 기억
            const page = e.nativeEvent.position;
            setCurrentPage(page);
            setLastVisitedMemoScreen(page === 0 ? 'folder' : 'list');
          }}
        >
          {/* Index 0 (왼쪽): 폴더 뷰 */}
          <View key="folder" style={{ flex: 1 }}>
            <MemoFolderView isDark={isDark} t={t} onGoToList={slideToList} />
          </View>

          {/* Index 1 (오른쪽): 리스트 뷰 */}
          <View key="list" style={{ flex: 1 }}>
            <MemoListView
              isDark={isDark}
              t={t}
              onGoToFolders={slideToFolders}
            />
          </View>
        </PagerView>

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
                onPress={() => setMenuVisible(false)}
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
                onPress={() => {
                  setMenuVisible(false);
                  router.replace('/check-list');
                }}
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

        {/* 💡 앱 종료 모달 추가 */}
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
    </GestureHandlerRootView>
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
    justifyContent: 'flex-start',
    alignItems: 'center',
    gap: 2,
    paddingRight: 20,
  },
  rightIconsWrapper: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
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
