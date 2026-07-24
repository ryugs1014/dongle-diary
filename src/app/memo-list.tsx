import React, { useRef } from 'react';
import { View, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import PagerView from 'react-native-pager-view';

import MemoListView from '@/components/sections/MemoListView';
import MemoFolderView from '@/components/sections/MemoFolderView';

export default function MemoMainScreen() {
  const pagerRef = useRef<PagerView>(null);
  const isDark = useColorScheme() === 'dark';
  const bgColor = isDark ? '#111111' : '#f8f9fa';

  // 💡 작성된 순서에 맞게 인덱스를 수정합니다.
  // FolderView가 Index 0 (왼쪽), ListView가 Index 1 (오른쪽)입니다.
  const slideToFolders = () => pagerRef.current?.setPage(0);
  const slideToList = () => pagerRef.current?.setPage(1);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bgColor }}>
      <Stack.Screen options={{ headerShown: false }} />

      <PagerView
        style={{ flex: 1 }}
        initialPage={1} // 💡 첫 화면을 Index 1 (MemoListView)로 강제 지정합니다.
        ref={pagerRef}
        overdrag={false}
      >
        {/* Index 0 (왼쪽): 폴더 뷰 */}
        <View key="folder" style={{ flex: 1 }}>
          <MemoFolderView onGoToList={slideToList} />
        </View>

        {/* Index 1 (오른쪽): 리스트 뷰 */}
        <View key="list" style={{ flex: 1 }}>
          <MemoListView onGoToFolders={slideToFolders} />
        </View>
      </PagerView>
    </SafeAreaView>
  );
}
