import React, { useRef, useState } from 'react';
import {
  View,
  useColorScheme,
  StyleSheet,
  Modal,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack } from 'expo-router';
import PagerView from 'react-native-pager-view';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import MemoListView from '@/components/sections/MemoListView';
import MemoFolderView from '@/components/sections/MemoFolderView';
import { useDiaryStore } from '@/store/useDiaryStore';
import AppTouchableOpacity from '@/components/atoms/AppTouchableOpacity';
import {
  CalandarIcon,
  DocumentIcon,
  MenuIcon,
  SearchIcon,
  SelectArrowIcon,
} from '@/assets/icons';
import AppText from '@/components/atoms/AppText';

export default function MemoMainScreen() {
  const pagerRef = useRef<PagerView>(null);
  const [menuVisible, setMenuVisible] = useState(false);

  const { language, theme } = useDiaryStore();

  const systemColorScheme = useColorScheme();
  const isDark =
    theme === 'system' ? systemColorScheme === 'dark' : theme === 'dark';
  const t = (koText: string, enText: string) =>
    language === 'en' ? enText : koText;

  // 💡 작성된 순서에 맞게 인덱스를 수정합니다.
  // FolderView가 Index 0 (왼쪽), ListView가 Index 1 (오른쪽)입니다.
  const slideToFolders = () => pagerRef.current?.setPage(0);
  const slideToList = () => pagerRef.current?.setPage(1);

  const bgColor = isDark ? '#111111' : '#fcfbfa';

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
            <DocumentIcon
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
          initialPage={1} // 💡 첫 화면을 Index 1 (MemoListView)로 강제 지정합니다.
          ref={pagerRef}
          overdrag={false}
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
                <CalandarIcon
                  width={24}
                  height={24}
                  color={isDark ? '#ffffff' : '#111111'}
                />
                <AppText style={[styles.menuText, isDark && styles.darkText]}>
                  일기장
                </AppText>
              </AppTouchableOpacity>

              <AppTouchableOpacity
                style={[styles.menuItem, styles.lastMenuItem]} // 💡 여기에 lastMenuItem 적용
                onPress={() => {
                  setMenuVisible(false);
                  // 현재 달력 화면이므로 창만 닫습니다.
                }}
              >
                <DocumentIcon
                  width={24}
                  height={24}
                  color={isDark ? '#ffffff' : '#111111'}
                />
                <AppText style={[styles.menuText, isDark && styles.darkText]}>
                  메모장
                </AppText>
              </AppTouchableOpacity>
            </View>
          </Pressable>
        </Modal>
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
    // backgroundColor: 'rgba(0,0,0,0.3)',
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
    elevation: 5,
  },
  darkMenuBox: { backgroundColor: '#1e1e1e' },
  menuItem: {
    padding: 16,
    borderBottomWidth: 1,
    alignItems: 'center',
    borderBottomColor: '#f1f2f3',
    flexDirection: 'row',
    gap: 4,
  },
  lastMenuItem: {
    borderBottomWidth: 0,
  },
  darkMenuItem: { borderBottomColor: '#333' },
  menuText: { fontSize: 14 },
});
