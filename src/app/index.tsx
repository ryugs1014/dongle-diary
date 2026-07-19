import React, { useRef } from 'react';
import { View, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import PagerView from 'react-native-pager-view'; // 💡 ScrollView 대신 PagerView 사용
import { useDiaryStore } from '../store/useDiaryStore';

import CalendarView from '../components/CalendarView';
import DiaryListView from '../components/DiaryListView';

export default function MainSwipeScreen() {
  // 💡 ScrollView 대신 PagerView의 ref를 생성합니다.
  const pagerRef = useRef<PagerView>(null);

  const { language, theme } = useDiaryStore();
  const systemColorScheme = useColorScheme();
  const isDark =
    theme === 'system' ? systemColorScheme === 'dark' : theme === 'dark';
  const t = (koText: string, enText: string) =>
    language === 'en' ? enText : koText;

  // 💡 X 좌표를 계산할 필요 없이, 인덱스(1)로 페이지를 이동시킵니다.
  const slideToDiaryList = () => {
    pagerRef.current?.setPage(1);
  };

  // 💡 인덱스(0)으로 첫 번째 페이지(달력)로 이동시킵니다.
  const slideToCalendar = () => {
    pagerRef.current?.setPage(0);
  };

  const bgColor = isDark ? '#111' : '#fcfbfa';

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={{ flex: 1, backgroundColor: bgColor }}
    >
      <Stack.Screen options={{ headerShown: false }} />

      {/* 💡 Dimensions 계산 없이 flex: 1 로 꽉 채우고 페이징을 처리합니다. */}
      <PagerView
        ref={pagerRef}
        style={{ flex: 1 }}
        initialPage={0}
        overdrag={false} // 스와이프 끝에서 바운스되는 효과 제거 (선택사항)
      >
        {/* 💡 각 페이지는 key 값을 가져야 하며, 내부 배경색도 확실하게 칠해줍니다. */}
        <View key="0" style={{ flex: 1, backgroundColor: bgColor }}>
          <CalendarView isDark={isDark} t={t} />
        </View>

        <View key="1" style={{ flex: 1, backgroundColor: bgColor }}>
          <DiaryListView isDark={isDark} t={t} onGoBack={slideToCalendar} />
        </View>
      </PagerView>
    </SafeAreaView>
  );
}
