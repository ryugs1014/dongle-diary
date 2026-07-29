import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  SectionList,
  useColorScheme,
  Keyboard,
  TouchableOpacity,
  Alert,
} from 'react-native';
import AppTouchableOpacity from '@/components/atoms/AppTouchableOpacity';
import AppTextInput from '@/components/atoms/AppTextInput';
import AppText from '@/components/atoms/AppText';
import { Stack, router, useNavigation } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDiaryStore } from '@/store/useDiaryStore';
import { useMemoStore } from '@/store/useMemoStore';
import {
  OrderIcon,
  SearchIcon,
  DeleteIcon,
  BackIcon,
  OptionIcon,
  FolderIcon,
  FolderEmptyIcon,
  LockTitleIcon,
  PinIcon,
} from '@/assets/icons';
import Toast from 'react-native-toast-message';
import MemoOptionsBottomSheet from '@/components/modals/MemoOptionsBottomSheet';
import FolderSelectBottomSheet from '@/components/modals/FolderSelectBottomSheet';
import SortMemoSearchBottomSheet, {
  MemoSearchSortType,
} from '@/components/modals/SortMemoSearchBottomSheet';

// 날짜 포맷 함수
const formatMemoDate = (timestamp: number) => {
  const now = new Date();
  const todayStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  ).getTime();
  const targetDate = new Date(timestamp);
  const timeDiff = timestamp - todayStart;
  const oneDay = 86400000;

  const hours = targetDate.getHours();
  const minutes = targetDate.getMinutes();
  const ampm = hours < 12 ? '오전' : '오후';
  const h12 = hours % 12 || 12;
  const mStr = minutes < 10 ? `0${minutes}` : minutes;
  const timeString = `${ampm} ${h12}:${mStr}`;

  if (timeDiff >= 0) return timeString;
  if (timeDiff >= -oneDay) return `어제 ${timeString}`;
  if (timeDiff >= -(oneDay * 7)) {
    const days = [
      '일요일',
      '월요일',
      '화요일',
      '수요일',
      '목요일',
      '금요일',
      '토요일',
    ];
    const dayStr = days[targetDate.getDay()];
    return `${dayStr} ${timeString}`;
  }
  return `${targetDate.getFullYear()}. ${targetDate.getMonth() + 1}. ${targetDate.getDate()}`;
};

export default function MemoSearchScreen() {
  const { theme } = useDiaryStore();
  const navigation = useNavigation();
  const {
    memos,
    folders,
    updateMemo,
    moveToTrash,
    duplicateMemo,
    moveMultipleMemos,
    addFolder,
  } = useMemoStore();

  const systemColorScheme = useColorScheme();
  const isDark =
    theme === 'system' ? systemColorScheme === 'dark' : theme === 'dark';

  // 검색 관련 상태
  const [searchText, setSearchText] = useState('');
  const [submittedText, setSubmittedText] = useState('');

  // 정렬 관련 상태
  const [sortType, setSortType] = useState<MemoSearchSortType>('dateDesc');
  const [isSortModalVisible, setIsSortModalVisible] = useState(false);

  // 옵션 및 이동 모달 관련 상태
  const [activeMenuMemoId, setActiveMenuMemoId] = useState<string | null>(null);
  const [isMoveModalVisible, setIsMoveModalVisible] = useState(false);
  const [memoIdToMove, setMemoIdToMove] = useState<string | null>(null);

  const searchInputRef = useRef<TextInput>(null);
  const isBackAllowed = useRef(false);

  useEffect(() => {
    navigation.setOptions({ gestureEnabled: false });
    const allowBackTimer = setTimeout(() => {
      isBackAllowed.current = true;
      navigation.setOptions({ gestureEnabled: true });
    }, 1000);
    const focusTimeout = setTimeout(() => {
      searchInputRef.current?.focus();
    }, 750);

    return () => {
      clearTimeout(allowBackTimer);
      clearTimeout(focusTimeout);
    };
  }, [navigation]);

  const handleClear = () => {
    setSearchText('');
    setSubmittedText('');
    searchInputRef.current?.focus();
  };

  const handleSearchSubmit = () => {
    setSubmittedText(searchText);
    Keyboard.dismiss();
  };

  const groupedMemos = useMemo(() => {
    let filtered = memos.filter((m) => !m.deletedAt);

    if (submittedText.trim() !== '') {
      const term = submittedText.toLowerCase();
      filtered = filtered.filter((m) => {
        const matchTitle = m.title.toLowerCase().includes(term);
        const matchContent = m.content.toLowerCase().includes(term);

        const d = new Date(m.updatedAt);
        const dateFormats = [
          `${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()}`,
          `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`,
          `${d.getMonth() + 1}월 ${d.getDate()}일`,
          `${d.getFullYear()}${d.getMonth() + 1}${d.getDate()}`,
        ].map((df) => df.replace(/\s+/g, ''));

        const matchDate = dateFormats.some((df) =>
          df.includes(term.replace(/\s+/g, '')),
        );

        return matchTitle || matchContent || matchDate;
      });
    } else {
      return [];
    }

    if (sortType === 'nameAsc' || sortType === 'nameDesc') {
      const pinned: any[] = [];
      const unpinned: any[] = [];

      filtered.forEach((memo) => {
        if (memo.isPinned) pinned.push(memo);
        else unpinned.push(memo);
      });

      const sortFn = (a: any, b: any) =>
        sortType === 'nameAsc'
          ? a.title.localeCompare(b.title)
          : b.title.localeCompare(a.title);

      pinned.sort(sortFn);
      unpinned.sort(sortFn);

      const sections = [];
      if (pinned.length > 0)
        sections.push({ title: '고정된 메모', data: pinned });
      if (unpinned.length > 0)
        sections.push({
          title:
            sortType === 'nameAsc' ? '이름순 (오름차순)' : '이름순 (내림차순)',
          data: unpinned,
        });

      return sections;
    }

    const pinned: any[] = [];
    const unpinned: any[] = [];

    filtered.forEach((memo) => {
      if (memo.isPinned) pinned.push(memo);
      else unpinned.push(memo);
    });

    unpinned.sort((a, b) =>
      sortType === 'dateDesc'
        ? b.updatedAt - a.updatedAt
        : a.updatedAt - b.updatedAt,
    );

    const today: any[] = [];
    const yesterday: any[] = [];
    const last7Days: any[] = [];
    const olderMap: Record<string, any[]> = {};

    const now = new Date();
    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    ).getTime();
    const oneDay = 86400000;

    unpinned.forEach((memo) => {
      const memoDate = new Date(memo.updatedAt);
      const timeDiff = memo.updatedAt - todayStart;

      if (timeDiff >= 0) today.push(memo);
      else if (timeDiff >= -oneDay) yesterday.push(memo);
      else if (timeDiff >= -(oneDay * 7)) last7Days.push(memo);
      else {
        const monthKey = `${memoDate.getFullYear()}년 ${memoDate.getMonth() + 1}월`;
        if (!olderMap[monthKey]) olderMap[monthKey] = [];
        olderMap[monthKey].push(memo);
      }
    });

    const sections = [];
    if (pinned.length > 0)
      sections.push({ title: '고정된 메모', data: pinned });

    if (sortType === 'dateAsc') {
      const olderKeys = Object.keys(olderMap).sort((a, b) => {
        const parseKey = (key: string) => {
          const match = key.match(/(\d+)년 (\d+)월/);
          if (match) return parseInt(match[1]) * 100 + parseInt(match[2]);
          return 0;
        };
        return parseKey(a) - parseKey(b);
      });

      olderKeys.forEach((key) => {
        sections.push({ title: key, data: olderMap[key] });
      });
      if (last7Days.length > 0)
        sections.push({ title: '최근 7일', data: last7Days });
      if (yesterday.length > 0)
        sections.push({ title: '어제', data: yesterday });
      if (today.length > 0) sections.push({ title: '오늘', data: today });
    } else {
      if (today.length > 0) sections.push({ title: '오늘', data: today });
      if (yesterday.length > 0)
        sections.push({ title: '어제', data: yesterday });
      if (last7Days.length > 0)
        sections.push({ title: '최근 7일', data: last7Days });

      const olderKeys = Object.keys(olderMap).sort((a, b) => {
        const parseKey = (key: string) => {
          const match = key.match(/(\d+)년 (\d+)월/);
          if (match) return parseInt(match[1]) * 100 + parseInt(match[2]);
          return 0;
        };
        return parseKey(b) - parseKey(a);
      });

      olderKeys.forEach((key) => {
        sections.push({ title: key, data: olderMap[key] });
      });
    }

    return sections;
  }, [memos, submittedText, sortType]);

  const activeMenuMemo = useMemo(() => {
    return memos.find((m) => m.id === activeMenuMemoId) || null;
  }, [memos, activeMenuMemoId]);

  const currentFolderIdForMove = useMemo(() => {
    if (memoIdToMove) {
      const memo = memos.find((m) => m.id === memoIdToMove);
      return memo?.folderId || null;
    }
    return undefined;
  }, [memoIdToMove, memos]);

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={[styles.container, isDark && styles.darkContainer]}
    >
      <Stack.Screen options={{ headerShown: false }} />

      {/* 헤더 부분 */}
      <View style={[styles.customHeader, isDark && styles.darkCustomHeader]}>
        <View style={styles.leftIconsWrapper}>
          <AppTouchableOpacity
            onPress={() => {
              if (!isBackAllowed.current) return;
              router.back();
            }}
          >
            <BackIcon
              width={28}
              height={28}
              color={isDark ? '#ffffff' : '#111111'}
            />
          </AppTouchableOpacity>
        </View>

        <View style={styles.searchRow}>
          <View
            style={[
              styles.searchContainer,
              isDark && styles.darkSearchContainer,
            ]}
          >
            <AppTextInput
              ref={searchInputRef}
              style={[styles.searchInput, isDark && styles.darkText]}
              placeholder="메모 내용 또는 날짜 검색"
              placeholderTextColor={isDark ? '#666' : '#999'}
              cursorColor={isDark ? '#ffffff' : '#111111'}
              selectionColor={
                isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)'
              }
              value={searchText}
              onChangeText={setSearchText}
              returnKeyType="search"
              onSubmitEditing={handleSearchSubmit}
            />
            {searchText.length > 0 && (
              <AppTouchableOpacity
                onPress={handleClear}
                style={styles.clearBtn}
              >
                <DeleteIcon
                  width={24}
                  height={24}
                  color={isDark ? '#333' : '#ccc'}
                />
              </AppTouchableOpacity>
            )}
          </View>

          <AppTouchableOpacity
            style={styles.submitBtn}
            onPress={handleSearchSubmit}
          >
            <SearchIcon
              width={28}
              height={28}
              color={isDark ? '#ffffff' : '#111111'}
            />
          </AppTouchableOpacity>

          <AppTouchableOpacity
            style={styles.filterBtn}
            onPress={() => setIsSortModalVisible(true)}
          >
            <OrderIcon
              width={28}
              height={28}
              color={isDark ? '#ffffff' : '#111111'}
            />
          </AppTouchableOpacity>
        </View>
      </View>

      <SectionList
        sections={groupedMemos}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContainer,
          groupedMemos.length === 0 && { flex: 1 },
        ]}
        keyboardShouldPersistTaps="handled"
        stickySectionHeadersEnabled={false}
        ListEmptyComponent={
          submittedText.trim() !== '' ? (
            <View style={styles.emptyContainer}>
              <AppText style={[styles.emptyText, isDark && styles.darkSubText]}>
                조건에 맞는 메모가 없어요.
              </AppText>
            </View>
          ) : null
        }
        renderSectionHeader={({ section: { title } }) => (
          <AppText style={styles.sectionTitle}>{title}</AppText>
        )}
        renderItem={({ item }) => {
          const formattedDate = formatMemoDate(item.updatedAt);
          const parentFolder = folders.find((f) => f.id === item.folderId);

          // 🔥 MemoListView와 동일한 텍스트 포맷 (이모지 제거)
          const folderText =
            item.folderId && parentFolder ? ` ${parentFolder.name}` : ` 미분류`;

          return (
            <TouchableOpacity
              style={[styles.memoCard, isDark && styles.memoCardDark]}
              onLongPress={() => setActiveMenuMemoId(item.id)}
              onPress={() => {
                router.push({
                  pathname: '/memo-editor',
                  params: { id: item.id },
                });
              }}
            >
              <View style={styles.memoTextContainer}>
                <View style={styles.memoMainContainer}>
                  <View style={styles.memoHeaderContainer}>
                    <View style={styles.memoTitleContainer}>
                      {item.isLocked && (
                        <LockTitleIcon
                          width={20}
                          height={24}
                          color={isDark ? '#ffffff' : '#111111'}
                        />
                      )}

                      <AppText style={styles.memoTitle} numberOfLines={1}>
                        {item.title}
                      </AppText>

                      {item.isPinned && (
                        <PinIcon
                          width={20}
                          height={24}
                          color={isDark ? '#ffffff' : '#111111'}
                        />
                      )}
                    </View>

                    <AppText
                      numberOfLines={1}
                      style={[styles.memoPreview, isDark && styles.darkSubText]}
                    >
                      {item.preview}
                    </AppText>
                  </View>

                  <TouchableOpacity
                    style={styles.dotsBtn}
                    onPress={() => setActiveMenuMemoId(item.id)}
                  >
                    <OptionIcon
                      width={28}
                      height={28}
                      color={isDark ? '#ffffff' : '#111111'}
                    />
                  </TouchableOpacity>
                </View>

                {/* 🔥 MemoListView와 완벽히 동일한 구조/스타일 반영 */}
                <View style={styles.memoMetaContainer}>
                  <AppText
                    style={[styles.memoMeta, isDark && styles.darkMetaText]}
                  >
                    {formattedDate}
                  </AppText>

                  {!!folderText && (
                    <View style={styles.folderWrapper}>
                      <FolderIcon
                        width={20}
                        height={20}
                        color={isDark ? '#777' : '#999'}
                      />
                      <AppText
                        style={[
                          styles.folderText,
                          isDark && styles.darkMetaText,
                        ]}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
                        {folderText}
                      </AppText>
                    </View>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
      />

      <SortMemoSearchBottomSheet
        visible={isSortModalVisible}
        onClose={() => setIsSortModalVisible(false)}
        sortType={sortType}
        setSortType={setSortType}
        isDark={isDark}
      />

      <MemoOptionsBottomSheet
        visible={!!activeMenuMemoId}
        onClose={() => setActiveMenuMemoId(null)}
        memo={activeMenuMemo}
        isDark={isDark}
        onTogglePin={() => {
          if (activeMenuMemo) {
            updateMemo(activeMenuMemo.id, {
              isPinned: !activeMenuMemo.isPinned,
            });
          }
          setActiveMenuMemoId(null);
        }}
        onToggleLock={() => {
          if (activeMenuMemo) {
            updateMemo(activeMenuMemo.id, {
              isLocked: !activeMenuMemo.isLocked,
            });
          }
          setActiveMenuMemoId(null);
        }}
        onMove={() => {
          if (activeMenuMemoId) {
            setMemoIdToMove(activeMenuMemoId);
            setIsMoveModalVisible(true);
          }
          setActiveMenuMemoId(null);
        }}
        onDuplicate={() => {
          if (activeMenuMemo) {
            duplicateMemo(activeMenuMemo.id);
          }
          setActiveMenuMemoId(null);
        }}
        onDelete={() => {
          if (activeMenuMemo?.isLocked) {
            Toast.show({
              type: 'error',
              text1: '잠긴 메모는 삭제할 수 없습니다.',
              position: 'top',
              topOffset: 60,
            });
            setActiveMenuMemoId(null);
            return;
          }

          if (activeMenuMemo) {
            moveToTrash(activeMenuMemo.id);
            Toast.show({
              type: 'success',
              text1: '휴지통으로 이동되었습니다.',
            });
          }
          setActiveMenuMemoId(null);
        }}
      />

      <FolderSelectBottomSheet
        visible={isMoveModalVisible}
        onClose={() => {
          setIsMoveModalVisible(false);
          setMemoIdToMove(null);
        }}
        title="이동할 폴더 선택"
        selectedId={currentFolderIdForMove}
        options={[
          { id: null, name: '미분류 메모', icon: FolderEmptyIcon },
          ...folders.map((f) => ({ id: f.id, name: f.name, icon: FolderIcon })),
        ]}
        onSelect={(id) => {
          if (memoIdToMove) {
            moveMultipleMemos([memoIdToMove], id);
            setMemoIdToMove(null);
          }
          setIsMoveModalVisible(false);

          Toast.show({
            type: 'success',
            text1: '메모가 이동되었어요',
            position: 'top',
            topOffset: 60,
          });
        }}
        onCreateFolder={addFolder}
        isDark={isDark}
      />
    </SafeAreaView>
  );
}

// 🔥 MemoListView와 100% 동일하게 스타일 맞춤
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FCFBFA' },
  darkContainer: { backgroundColor: '#111111' },

  customHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    height: 50,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(33, 37, 41, 0.2)',
  },
  darkCustomHeader: {
    backgroundColor: '#111111',
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
  },
  leftIconsWrapper: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    gap: 10,
  },

  searchRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
  },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 14, lineHeight: 16 },
  darkText: { color: '#ffffff' },
  clearBtn: { padding: 5 },
  submitBtn: { justifyContent: 'center', alignItems: 'center' },
  filterBtn: { justifyContent: 'center', alignItems: 'center' },

  listContainer: {
    paddingTop: 20,
    paddingBottom: 60,
    paddingHorizontal: 20,
    gap: 10,
  },

  sectionTitle: {
    paddingHorizontal: 4,
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 20,
  },

  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 100,
  },
  emptyText: { textAlign: 'center', color: '#888', fontSize: 14 },
  darkSubText: { color: '#aaa' },

  // 🔥 MemoListView의 메모 카드 스타일 동기화
  memoCard: {
    flexDirection: 'row',
    gap: 15,
    paddingLeft: 20,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 16,
  },
  memoCardDark: { backgroundColor: '#191919' },
  memoTextContainer: { flex: 1, justifyContent: 'flex-start', gap: 8 },
  memoMainContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 2,
  },
  memoHeaderContainer: {
    flex: 1,
    paddingTop: 20,
    paddingRight: 20,
    marginBottom: 12,
    gap: 4,
  },
  memoTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memoMetaContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 20,
    paddingRight: 20,
    marginBottom: 16,
    height: 24,
  },
  memoTitle: { fontSize: 16, fontWeight: 'bold', lineHeight: 24 },
  memoPreview: { fontSize: 14, color: '#666' },

  folderWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
  },
  memoMeta: { fontSize: 12, color: '#999' },
  folderText: { fontSize: 12, color: '#999', flexShrink: 1 },
  darkMetaText: { color: '#777' },

  dotsBtn: { padding: 20 },
});
