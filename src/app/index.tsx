import React, { useRef, useState, useCallback } from 'react';
import { View, useColorScheme, BackHandler } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useFocusEffect } from 'expo-router';
import PagerView from 'react-native-pager-view';
import { useDiaryStore } from '../store/useDiaryStore';

import CalendarView from '../components/sections/CalendarView';
import DiaryListView from '../components/sections/DiaryListView';
import AppConfirmModal from '@/components/modals/AppConfirmModal';

export default function MainSwipeScreen() {
  const pagerRef = useRef<PagerView>(null);

  const { language, theme } = useDiaryStore();
  const systemColorScheme = useColorScheme();
  const isDark =
    theme === 'system' ? systemColorScheme === 'dark' : theme === 'dark';
  const t = (koText: string, enText: string) =>
    language === 'en' ? enText : koText;

  const [currentPage, setCurrentPage] = useState(0);
  const [exitModalVisible, setExitModalVisible] = useState(false);

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
          <CalendarView isDark={isDark} t={t} />
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
    </SafeAreaView>
  );
}
