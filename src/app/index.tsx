import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, useColorScheme, BackHandler, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useFocusEffect, router } from 'expo-router';
import PagerView from 'react-native-pager-view';
import { useDiaryStore } from '../store/useDiaryStore';

import CalendarView from '../components/sections/CalendarView';
import DiaryListView from '../components/sections/DiaryListView';
import AppConfirmModal from '@/components/modals/AppConfirmModal';
import AppTouchableOpacity from '@/components/atoms/AppTouchableOpacity';
import {
  DocumentIcon,
  MenuIcon,
  SearchIcon,
  SelectArrowIcon,
} from '@/assets/icons';

let hasCheckedDraftGlobal = false;

let hasHandledStartupRedirect = false; // 전역 변수로 앱 실행 시 1회만 리다이렉트 되도록 방어

export default function MainSwipeScreen() {
  const pagerRef = useRef<PagerView>(null);

  const {
    language,
    theme,
    draft,
    setSelectedDate,
    isAppReady,
    startupScreen,
    lastVisitedScreen,
    setLastVisitedScreen,
  } = useDiaryStore();
  const systemColorScheme = useColorScheme();
  const isDark =
    theme === 'system' ? systemColorScheme === 'dark' : theme === 'dark';
  const t = (koText: string, enText: string) =>
    language === 'en' ? enText : koText;

  const [currentPage, setCurrentPage] = useState(0);
  const [exitModalVisible, setExitModalVisible] = useState(false);

  const [draftAlertVisible, setDraftAlertVisible] = useState(false);
  // const hasCheckedDraft = useRef(false);

  // 💡 시작 화면 리다이렉트 및 접속 기록 남기기
  useEffect(() => {
    // 앱이 처음 로드되었을 때 1회만 실행
    if (!hasHandledStartupRedirect) {
      hasHandledStartupRedirect = true;

      let targetScreen = 'diary';
      if (startupScreen === 'memo') targetScreen = 'memo';
      else if (startupScreen === 'last_visited')
        targetScreen = lastVisitedScreen;

      // 목표 화면이 메모장이면 즉시 메모장으로 이동
      if (targetScreen === 'memo') {
        router.replace('/memo-list'); // 메모장 경로
        return;
      }
    }

    // 위에서 return 되지 않고 남아있다면, 현재 사용자가 '일기장'을 보고 있는 것임
    setLastVisitedScreen('diary');
  }, [startupScreen, lastVisitedScreen, setLastVisitedScreen]);

  useEffect(() => {
    // 전역 변수로 체크
    if (isAppReady && !hasCheckedDraftGlobal) {
      hasCheckedDraftGlobal = true; // 체크 완료 표시
      if (draft) {
        setTimeout(() => {
          setDraftAlertVisible(true);
        }, 1000);
      }
    }
  }, [isAppReady, draft]);

  const slideToDiaryList = () => {
    pagerRef.current?.setPage(1);
  };

  const slideToCalendar = () => {
    pagerRef.current?.setPage(0);
  };

  useFocusEffect(
    useCallback(() => {
      const backAction = () => {
        if (currentPage === 1) {
          // DiaryListView에 있을 때: 달력으로 스와이프 이동
          slideToCalendar();
          return true;
        } else if (currentPage === 0) {
          // CalendarView에 있을 때: 앱 종료 확인 모달 띄우기
          setExitModalVisible(true);
          return true;
        }
        return false;
      };

      const backHandler = BackHandler.addEventListener(
        'hardwareBackPress',
        backAction,
      );

      // 화면을 벗어나면(설정 창 등으로 가면) 이벤트를 즉시 해제합니다.
      return () => backHandler.remove();
    }, [currentPage]), // currentPage가 변경될 때 최신 상태 적용
  );

  const bgColor = isDark ? '#111111' : '#fcfbfa';

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={{ flex: 1, backgroundColor: bgColor }}
    >
      <Stack.Screen options={{ headerShown: false }} />

      <PagerView
        ref={pagerRef}
        style={{ flex: 1 }}
        initialPage={0}
        overdrag={false} // 스와이프 끝에서 바운스되는 효과 제거
        onPageSelected={(e) => setCurrentPage(e.nativeEvent.position)}
      >
        <View key="0" style={{ flex: 1, backgroundColor: bgColor }}>
          <CalendarView isDark={isDark} t={t} onGoToList={slideToDiaryList} />
        </View>

        <View key="1" style={{ flex: 1, backgroundColor: bgColor }}>
          <DiaryListView isDark={isDark} t={t} onGoBack={slideToCalendar} />
        </View>
      </PagerView>

      {/* 한 번 더 누르면 끌 수 있어요 */}
      <AppConfirmModal
        visible={exitModalVisible}
        title={t('동글일기', 'Exit App')}
        message={t('일기장을 닫으시겠어요?', 'Are you sure you want to exit?')}
        cancelText={t('취소', 'Cancel')}
        confirmText={t('종료', 'Exit')}
        confirmColor="#FF6F61"
        onCancel={() => setExitModalVisible(false)}
        onConfirm={() => {
          setExitModalVisible(false);
          BackHandler.exitApp();
        }}
      />

      <AppConfirmModal
        visible={draftAlertVisible}
        title={t('작성 중인 일기', 'Draft Diary')}
        message={t(
          '작성 중이던 일기가 있어요.\n이어서 작성하시겠어요?',
          'You have a saved draft.\nDo you want to continue writing?',
        )}
        cancelText={t('닫기', 'Close')}
        confirmText={t('이어서 작성', 'Continue')}
        confirmColor="#007AFF"
        onCancel={() => setDraftAlertVisible(false)}
        onConfirm={() => {
          setDraftAlertVisible(false);
          if (draft) {
            // 달력의 선택 날짜를 임시저장된 날짜로 동기화
            setSelectedDate(draft.date);
            // URL 파라미터로 'autoLoadDraft=true'를 함께 보냅니다.
            router.push({
              pathname: '/write',
              params: { autoLoadDraft: 'true' },
            });
          }
        }}
      />
    </SafeAreaView>
  );
}
