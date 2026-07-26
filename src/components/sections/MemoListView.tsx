import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  StyleSheet,
  SectionList,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import AppText from '@/components/atoms/AppText';
import { useMemoStore } from '@/store/useMemoStore';
import {
  AddBigIcon,
  ArrowDownIcon,
  BackIcon,
  EmptyEmotionIcon,
  LockIcon,
  OptionIcon,
  SearchIcon,
} from '@/assets/icons';
import AppTouchableOpacity from '@/components/atoms/AppTouchableOpacity';
import { LinearGradient } from 'expo-linear-gradient';

import MemoOptionsBottomSheet from '@/components/modals/MemoOptionsBottomSheet';
import SortMemoBottomSheet, {
  MemoSortType,
} from '@/components/modals/SortMemoBottomSheet';
import FolderSelectBottomSheet from '@/components/modals/FolderSelectBottomSheet';
import Toast from 'react-native-toast-message';

interface MemoListViewProps {
  isDark: boolean;
  t: (ko: string, en: string) => string;
  onGoToFolders: () => void;
}

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

export default function MemoListView({
  isDark,
  t,
  onGoToFolders,
}: MemoListViewProps) {
  const {
    memos,
    folders,
    activeFolderId,
    setActiveFolderId,
    updateMemo,
    deleteMemo, // 영구 삭제
    moveToTrash, // 휴지통 이동
    moveMultipleToTrash,
    restoreMemo, // 복구
    restoreMultipleMemos,
    deleteMultipleMemos,
    duplicateMemo,
    moveMultipleMemos,
    addFolder,
  } = useMemoStore();

  // 🔥 휴지통 모드 여부 확인
  const isTrashMode = activeFolderId === 'trash';

  const [searchQuery, setSearchQuery] = useState('');
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeMenuMemoId, setActiveMenuMemoId] = useState<string | null>(null);
  const [isFolderSelectVisible, setIsFolderSelectVisible] = useState(false);
  const [isMoveModalVisible, setIsMoveModalVisible] = useState(false);
  const [memoIdToMove, setMemoIdToMove] = useState<string | null>(null);

  // 🔥 단일 메모 및 다중 메모 이동 시, 현재 속한 폴더 ID를 찾아내는 로직
  const currentFolderIdForMove = useMemo(() => {
    // 휴지통에서는 이동 기능 사용 X
    if (isTrashMode) return undefined;

    // 1. 단일 메모 이동인 경우 (해당 메모의 출처를 찾음)
    if (memoIdToMove) {
      const memo = memos.find((m) => m.id === memoIdToMove);
      return memo?.folderId || null;
    }

    // 2. 다중 선택 이동인 경우
    // '전체 메모' 탭이라면 메모들의 폴더가 섞여 있을 수 있으므로 선택 안 함 (undefined)
    if (activeFolderId === null) return undefined;

    // '폴더 미지정' 탭이라면 이동 모달의 '폴더 미지정' ID인 null을 반환
    if (activeFolderId === 'uncategorized') return null;

    // 특정 폴더 탭이라면 현재 보고 있는 폴더 ID를 반환
    return activeFolderId;
  }, [memoIdToMove, memos, activeFolderId]);

  // 🔥 정렬 관련 상태
  const [sortType, setSortType] = useState<MemoSortType>('dateDesc');
  const [isSortModalVisible, setIsSortModalVisible] = useState(false);

  useEffect(() => {
    if (
      activeFolderId &&
      activeFolderId !== 'uncategorized' &&
      activeFolderId !== 'trash' &&
      !folders.find((f) => f.id === activeFolderId)
    ) {
      setActiveFolderId(null);
    }
  }, [activeFolderId, folders, setActiveFolderId]);

  const groupedMemos = useMemo(() => {
    let filtered = memos;

    // 🔥 1. 휴지통 모드 분기
    if (isTrashMode) {
      filtered = filtered.filter((m) => m.deletedAt); // 삭제된 메모만
    } else {
      filtered = filtered.filter((m) => !m.deletedAt); // 정상 메모만

      // 일반 모드일 때만 폴더별 필터링 적용
      if (activeFolderId === 'uncategorized') {
        filtered = filtered.filter((m) => !m.folderId);
      } else if (activeFolderId) {
        filtered = filtered.filter((m) => m.folderId === activeFolderId);
      }
    }

    // 🔥 2. 검색 필터링
    if (searchQuery) {
      filtered = filtered.filter(
        (m) => m.title.includes(searchQuery) || m.content.includes(searchQuery),
      );
    }

    // 🔥 3. 이름순 정렬일 경우 (시간 날짜 그룹 무시)
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
        sections.push({ title: '📌 고정된 메모', data: pinned });
      if (unpinned.length > 0)
        sections.push({
          title:
            sortType === 'nameAsc' ? '이름순 (오름차순)' : '이름순 (내림차순)',
          data: unpinned,
        });

      return sections;
    }

    // 🔥 4. 기본 최근 날짜순 정렬일 경우 (날짜별 그룹)
    const pinned: any[] = [];
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

    filtered.forEach((memo) => {
      if (memo.isPinned) {
        pinned.push(memo);
        return;
      }
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
      sections.push({ title: '📌 고정된 메모', data: pinned });
    if (today.length > 0) sections.push({ title: '오늘', data: today });
    if (yesterday.length > 0) sections.push({ title: '어제', data: yesterday });
    if (last7Days.length > 0)
      sections.push({ title: '최근 7일', data: last7Days });

    Object.keys(olderMap).forEach((key) => {
      sections.push({ title: key, data: olderMap[key] });
    });

    return sections;
  }, [memos, folders, searchQuery, activeFolderId, sortType, isTrashMode]);

  const activeMenuMemo = useMemo(() => {
    return memos.find((m) => m.id === activeMenuMemoId) || null;
  }, [memos, activeMenuMemoId]);

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const currentFolderName = useMemo(() => {
    if (activeFolderId === 'trash') return '휴지통'; // 🔥 추가
    if (activeFolderId === null) return '전체 메모';
    if (activeFolderId === 'uncategorized') return '폴더 미지정 메모';
    const folder = folders.find((f) => f.id === activeFolderId);
    return folder ? folder.name : '전체 메모';
  }, [activeFolderId, folders]);

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.folderSelector}
        onPress={() => setIsFolderSelectVisible(true)}
      >
        <AppText style={styles.folderTitle}>{currentFolderName}</AppText>
        <ArrowDownIcon
          width={24}
          height={24}
          color={isDark ? '#ffffff' : '#111111'}
        />
      </TouchableOpacity>

      {isSelectMode ? (
        <View style={styles.headerRight}>
          <AppText style={{ marginRight: 15 }}>
            {selectedIds.length}개 선택됨
          </AppText>
          <TouchableOpacity
            onPress={() => {
              setIsSelectMode(false);
              setSelectedIds([]);
            }}
          >
            <AppText>취소</AppText>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.headerRight}>
          <TouchableOpacity
            onPress={() => setIsSortModalVisible(true)}
            style={{ marginRight: 15 }}
          >
            <AppText>정렬</AppText>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setIsSelectMode(true)}>
            <AppText>선택</AppText>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  // 🔥 텅 빈 상태 UI
  const renderEmpty = () => (
    // <View style={styles.emptyContainer}>
    //   <AppText style={styles.emptyText}>작성된 메모가 없습니다.</AppText>
    // </View>

    <View style={styles.emptyContainer}>
      <EmptyEmotionIcon
        width={80}
        height={80}
        color={isDark ? '#888' : '#666'}
      />

      <AppText style={[styles.emptyText, isDark && styles.emptyTextDark]}>
        작성한 메모가 없어요{'\n'}
        지금 떠오르는 생각을 적어볼까요?
      </AppText>

      <AppTouchableOpacity
        style={[styles.emptyButton, isDark && styles.emptyButtonDark]}
        onPress={() => router.push('/memo-editor')}
      >
        <AppText
          style={[styles.emptyButtonText, isDark && styles.emptyButtonTextDark]}
        >
          메모 작성하기
        </AppText>
      </AppTouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <SectionList
        contentContainerStyle={[
          styles.listContainer,
          groupedMemos.length === 0 && { flex: 1 },
        ]}
        stickySectionHeadersEnabled={false}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        sections={groupedMemos}
        keyExtractor={(item) => item.id}
        renderSectionHeader={({ section: { title } }) => (
          <AppText style={styles.sectionTitle}>{title}</AppText>
        )}
        renderItem={({ item }) => {
          const formattedDate = formatMemoDate(item.updatedAt);
          const isAllMemos = activeFolderId === null;
          const parentFolder = folders.find((f) => f.id === item.folderId);

          const folderText = isAllMemos
            ? item.folderId && parentFolder
              ? ` 📁 ${parentFolder.name}`
              : ` 📝 폴더 미지정`
            : '';

          return (
            <TouchableOpacity
              style={[styles.memoCard, isDark && styles.memoCardDark]}
              onLongPress={() => setActiveMenuMemoId(item.id)}
              onPress={() => {
                if (isSelectMode) {
                  toggleSelection(item.id);
                } else if (isTrashMode) {
                  // 🔥 휴지통 메모 클릭 시 동작
                  Alert.alert('휴지통 메모', '이 메모를 복구하시겠습니까?', [
                    { text: '취소', style: 'cancel' },
                    {
                      text: '영구 삭제',
                      style: 'destructive',
                      onPress: () => deleteMemo(item.id),
                    },
                    { text: '복구', onPress: () => restoreMemo(item.id) },
                  ]);
                } else {
                  // 🔥 잠금 여부와 상관없이 무조건 에디터로 진입하게 변경!
                  router.push({
                    pathname: '/memo-editor',
                    params: { id: item.id },
                  });
                }
              }}
            >
              {isSelectMode && (
                <View style={styles.checkbox}>
                  {selectedIds.includes(item.id) && <AppText>✅</AppText>}
                </View>
              )}

              <View style={styles.memoTextContainer}>
                <View style={styles.memoMainContainer}>
                  <View style={styles.memoHeaderContainer}>
                    <View style={styles.memoTitleContainer}>
                      {item.isLocked && (
                        <LockIcon
                          width={20}
                          height={20}
                          color={isDark ? '#ffffff' : '#111111'}
                        />
                      )}

                      <AppText style={styles.memoTitle} numberOfLines={1}>
                        {item.title}
                      </AppText>
                    </View>

                    <AppText
                      numberOfLines={1}
                      style={[styles.memoPreview, isDark && styles.darkSubText]}
                    >
                      {item.preview}
                    </AppText>
                  </View>

                  {!isSelectMode &&
                    !isTrashMode && ( // 🔥 휴지통에서는 옵션 아이콘(점 3개) 숨김
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
                    )}
                </View>

                <View style={styles.memoMetaContainer}>
                  <AppText
                    style={[styles.memoMeta, isDark && styles.darkMetaText]}
                  >
                    {formattedDate}
                  </AppText>

                  <AppText
                    style={[styles.folderText, isDark && styles.darkMetaText]}
                  >
                    {folderText}
                  </AppText>
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
      />

      {isSelectMode && (
        <View style={styles.bottomBar}>
          {isTrashMode ? (
            // 🔥 휴지통 모드 하단바
            <>
              <TouchableOpacity
                onPress={() => {
                  restoreMultipleMemos(selectedIds);
                  setIsSelectMode(false);
                  setSelectedIds([]);
                  Toast.show({
                    type: 'success',
                    text1: '메모가 복구되었습니다.',
                  });
                }}
              >
                <AppText style={{ color: '#007AFF' }}>모두 복구</AppText>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  Alert.alert(
                    '영구 삭제',
                    '선택한 메모를 영구적으로 삭제하시겠습니까?',
                    [
                      { text: '취소', style: 'cancel' },
                      {
                        text: '삭제',
                        style: 'destructive',
                        onPress: () => {
                          deleteMultipleMemos(selectedIds);
                          setIsSelectMode(false);
                          setSelectedIds([]);
                        },
                      },
                    ],
                  );
                }}
              >
                <AppText style={{ color: 'red' }}>영구 삭제</AppText>
              </TouchableOpacity>
            </>
          ) : (
            // 🔥 일반 모드 하단바
            <>
              <TouchableOpacity onPress={() => setIsMoveModalVisible(true)}>
                <AppText>폴더 이동</AppText>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  // 🔥 선택된 메모 중 잠긴 메모가 있는지 확인
                  const hasLockedMemo = selectedIds.some((id) => {
                    const memo = memos.find((m) => m.id === id);
                    return memo?.isLocked;
                  });

                  if (hasLockedMemo) {
                    Toast.show({
                      type: 'error',
                      text1: '잠긴 메모가 포함되어 삭제할 수 없습니다.',
                      position: 'top',
                      topOffset: 60,
                    });
                    return; // 잠긴 메모가 있으면 삭제 진행 안 함
                  }

                  moveMultipleToTrash(selectedIds);
                  setIsSelectMode(false);
                  setSelectedIds([]);
                  Toast.show({
                    type: 'success',
                    text1: '휴지통으로 이동되었습니다.',
                  });
                }}
              >
                <AppText style={{ color: 'red' }}>삭제</AppText>
              </TouchableOpacity>
            </>
          )}
        </View>
      )}

      {!isSelectMode && !isTrashMode && (
        <LinearGradient
          style={styles.bottomBtnWrapper}
          colors={
            isDark
              ? ['rgba(17, 17, 17, 0)', 'rgba(17, 17, 17, 0.8)', '#111111']
              : [
                  'rgba(255, 255, 255, 0)',
                  'rgba(255, 255, 255, 0.8)',
                  '#FCFBFA',
                ]
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 0.7 }}
        >
          <AppTouchableOpacity
            style={[styles.nextBtn]}
            onPress={() => router.push('/memo-editor')}
          >
            <AddBigIcon
              width={60}
              height={60}
              color={isDark ? '#ffffff' : '#333333'}
            />
          </AppTouchableOpacity>
        </LinearGradient>
      )}

      {/* 🔥 분리된 모달들 적용 */}
      <SortMemoBottomSheet
        visible={isSortModalVisible}
        onClose={() => setIsSortModalVisible(false)}
        sortType={sortType}
        setSortType={setSortType}
        isDark={isDark}
      />

      <FolderSelectBottomSheet
        visible={isFolderSelectVisible}
        onClose={() => setIsFolderSelectVisible(false)}
        title="폴더 선택"
        selectedId={activeFolderId}
        options={[
          { id: null, name: '전체 메모', icon: '📚' },
          { id: 'uncategorized', name: '폴더 미지정 메모', icon: '📝' },
          { id: 'trash', name: '휴지통', icon: '🗑️' },
          ...folders.map((f) => ({ id: f.id, name: f.name, icon: '📁' })),
        ]}
        onSelect={setActiveFolderId}
        onCreateFolder={addFolder} // 🔥 추가
        isDark={isDark}
      />

      {/* 📁 이동할 폴더 선택 모달 (다중 선택 및 단일 이동 공용) */}
      <FolderSelectBottomSheet
        visible={isMoveModalVisible}
        onClose={() => {
          setIsMoveModalVisible(false);
          setMemoIdToMove(null); // 닫을 때 단일 이동 상태 초기화
        }}
        title="이동할 폴더 선택"
        selectedId={currentFolderIdForMove}
        options={[
          { id: null, name: '폴더 미지정으로 이동', icon: '📝' },
          ...folders.map((f) => ({ id: f.id, name: f.name, icon: '📁' })),
        ]}
        onSelect={(id) => {
          if (memoIdToMove) {
            // 🔥 단일 메모 이동인 경우
            moveMultipleMemos([memoIdToMove], id);
            setMemoIdToMove(null);
          } else {
            // 🔥 여러 메모 선택 이동인 경우
            moveMultipleMemos(selectedIds, id);
            setIsSelectMode(false);
            setSelectedIds([]);
          }
          setIsMoveModalVisible(false);
          Alert.alert('이동 완료', '메모가 성공적으로 이동되었습니다.');
        }}
        onCreateFolder={addFolder} // 🔥 추가
        isDark={isDark}
      />

      {/* ⚙️ 단일 메모 옵션 모달 */}
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
          // 🔥 이동 버튼 눌렀을 때 단일 이동 상태로 세팅하고 이동 모달 열기
          if (activeMenuMemoId) {
            setMemoIdToMove(activeMenuMemoId);
            setIsMoveModalVisible(true);
          }
          setActiveMenuMemoId(null); // 옵션 시트는 닫기
        }}
        onDuplicate={() => {
          if (activeMenuMemo) {
            duplicateMemo(activeMenuMemo.id);
          }
          setActiveMenuMemoId(null);
        }}
        onDelete={() => {
          // 🔥 잠긴 메모 삭제 방어 로직 추가
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  listContainer: {
    paddingTop: 30,
    paddingBottom: 150,
    paddingHorizontal: 20,
    gap: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    // marginBottom: 10,
  },
  folderSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  folderTitle: { fontSize: 24, fontWeight: 'bold' },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  sectionTitle: {
    paddingHorizontal: 4,
    fontSize: 16,
    fontWeight: 'bold',
    // marginBottom: 10,
    marginTop: 20,
  },
  memoCard: {
    flexDirection: 'row',
    gap: 15,
    // paddingBottom: 20,
    paddingLeft: 20,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 2,
  },
  memoCardDark: { backgroundColor: '#191919' },
  memoTextContainer: { flex: 1, justifyContent: 'flex-start', gap: 4 },
  memoMainContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 2,
  },
  memoHeaderContainer: {
    flex: 1,
    paddingTop: 20,
    marginBottom: 12,
  },
  memoTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  memoMetaContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 2,
    paddingRight: 20,
    marginBottom: 20,
    height: 20,
  },
  memoTitle: { fontSize: 16, fontWeight: 'bold', lineHeight: 24 },
  memoPreview: { fontSize: 14, color: '#666' },
  darkSubText: { color: '#aaa' },
  memoMeta: { fontSize: 12, color: '#999' },
  folderText: { fontSize: 12, color: '#999' },
  darkMetaText: { color: '#777' },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 1,
    borderRadius: 20,
    borderColor: '#ccc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotsBtn: { padding: 20 },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderColor: '#ccc',
  },

  // Empty State Styles
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
    gap: 10,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 14,
    lineHeight: 24,
    marginBottom: 10,
  },
  emptyTextDark: {
    color: '#aaa',
  },
  emptyButton: {
    backgroundColor: '#111111',
    height: 50,
    paddingHorizontal: 24,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    textAlign: 'center',
  },
  emptyButtonDark: {
    backgroundColor: '#ffffff',
  },
  emptyButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  emptyButtonTextDark: {
    color: '#111111',
  },

  bottomBtnWrapper: {
    position: 'absolute',
    bottom: 0,
    paddingTop: 30,
    paddingBottom: 60,
    width: '100%',
    backgroundColor: 'transparent',
  },
  nextBtn: {
    alignSelf: 'center',
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
