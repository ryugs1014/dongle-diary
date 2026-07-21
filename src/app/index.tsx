import React, { useRef } from 'react';
import { View, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import PagerView from 'react-native-pager-view';
import { useDiaryStore } from '../store/useDiaryStore';

import CalendarView from '../components/CalendarView';
import DiaryListView from '../components/DiaryListView';

export default function MainSwipeScreen() {
  const pagerRef = useRef<PagerView>(null);

  const { language, theme } = useDiaryStore();
  const systemColorScheme = useColorScheme();
  const isDark =
    theme === 'system' ? systemColorScheme === 'dark' : theme === 'dark';
  const t = (koText: string, enText: string) =>
    language === 'en' ? enText : koText;

  const slideToDiaryList = () => {
    pagerRef.current?.setPage(1);
  };

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

      <PagerView
        ref={pagerRef}
        style={{ flex: 1 }}
        initialPage={0}
        overdrag={false} // 스와이프 끝에서 바운스되는 효과 제거
      >
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
