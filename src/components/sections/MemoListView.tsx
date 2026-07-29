import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  SectionList,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { router } from 'expo-router';
import AppText from '@/components/atoms/AppText';
import { useMemoStore } from '@/store/useMemoStore';
import {
  AddBigIcon,
  ArrowDownIcon,
  FolderEmptyIcon,
  FolderIcon,
  LockTitleIcon,
  MemoEmptyIcon,
  OptionIcon,
  PinIcon,
  SelectCheckIcon,
  TrashIcon,
} from '@/assets/icons';
import AppTouchableOpacity from '@/components/atoms/AppTouchableOpacity';
import { LinearGradient } from 'expo-linear-gradient';
import MemoOptionsBottomSheet from '@/components/modals/MemoOptionsBottomSheet';
import SortMemoBottomSheet, {
  MemoSortType,
} from '@/components/modals/SortMemoBottomSheet';
import FolderSelectBottomSheet from '@/components/modals/FolderSelectBottomSheet';
import Toast from 'react-native-toast-message';
// 💡 모달 컴포넌트 임포트
import AppConfirmModal from '@/components/modals/AppConfirmModal';

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

const getRemainingDaysText = (
  deletedAt?: number,
  autoDeleteDays: number = 30,
) => {
  if (!deletedAt) return null;
  if (autoDeleteDays === 0) return '자동 삭제 안 함';

  const interval = autoDeleteDays * 24 * 60 * 60 * 1000;
  const expirationDate = deletedAt + interval;
  const now = Date.now();
  const diffDays = Math.ceil((expirationDate - now) / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return '곧 삭제됨';
  return `${diffDays}일 후 삭제`;
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
    deleteMemo,
    moveToTrash,
    moveMultipleToTrash,
    restoreMemo,
    restoreMultipleMemos,
    deleteMultipleMemos,
    duplicateMemo,
    moveMultipleMemos,
    addFolder,
    autoDeleteDays,
  } = useMemoStore();

  const isTrashMode = activeFolderId === 'trash';

  const [searchQuery, setSearchQuery] = useState('');
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeMenuMemoId, setActiveMenuMemoId] = useState<string | null>(null);
  const [isFolderSelectVisible, setIsFolderSelectVisible] = useState(false);
  const [isMoveModalVisible, setIsMoveModalVisible] = useState(false);
  const [memoIdToMove, setMemoIdToMove] = useState<string | null>(null);

  // 💡 새롭게 추가된 모달 가시성 상태 관리
  const [emptyTrashModalVisible, setEmptyTrashModalVisible] = useState(false);
  const [deleteMultipleModalVisible, setDeleteMultipleModalVisible] =
    useState(false);
  const [trashMemoModalVisible, setTrashMemoModalVisible] = useState(false);
  const [selectedTrashMemoId, setSelectedTrashMemoId] = useState<string | null>(
    null,
  );

  const sectionListRef = useRef<SectionList>(null);

  const scrollToTop = () => {
    sectionListRef.current
      ?.getScrollResponder()
      ?.scrollTo({ y: 0, animated: true });
  };

  const currentFolderIdForMove = useMemo(() => {
    if (isTrashMode) return undefined;
    if (memoIdToMove) {
      const memo = memos.find((m) => m.id === memoIdToMove);
      return memo?.folderId || null;
    }
    if (activeFolderId === null) return undefined;
    if (activeFolderId === 'uncategorized') return null;
    return activeFolderId;
  }, [memoIdToMove, memos, activeFolderId, isTrashMode]);

  const [sortType, setSortType] = useState<MemoSortType>('dateDesc');
  const [isSortModalVisible, setIsSortModalVisible] = useState(false);

  const slideAnim = useRef(new Animated.Value(200)).current;
  const showBottomBar = isSelectMode && selectedIds.length > 0;

  useEffect(() => {
    if (showBottomBar) {
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 60,
        useNativeDriver: true,
      }).start();
    } else {
      if (!isSelectMode) {
        slideAnim.setValue(200);
      } else {
        Animated.timing(slideAnim, {
          toValue: 200,
          duration: 250,
          useNativeDriver: true,
        }).start();
      }
    }
  }, [showBottomBar, isSelectMode, slideAnim]);

  // 💡 앱을 켜거나 화면에 처음 진입했을 때 마지막 위치가 '휴지통'이면 '전체 메모'로 초기화
  useEffect(() => {
    if (activeFolderId === 'trash') {
      setActiveFolderId(null);
    }
  }, []);

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

    if (isTrashMode) {
      filtered = filtered.filter((m) => m.deletedAt);
    } else {
      filtered = filtered.filter((m) => !m.deletedAt);

      if (activeFolderId === 'uncategorized') {
        filtered = filtered.filter((m) => !m.folderId);
      } else if (activeFolderId) {
        filtered = filtered.filter((m) => m.folderId === activeFolderId);
      }
    }

    if (searchQuery) {
      filtered = filtered.filter(
        (m) => m.title.includes(searchQuery) || m.content.includes(searchQuery),
      );
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
      sections.push({ title: '고정된 메모', data: pinned });
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
    if (activeFolderId === 'trash') return '휴지통';
    if (activeFolderId === null) return '전체 메모';
    if (activeFolderId === 'uncategorized') return '미분류 메모';
    const folder = folders.find((f) => f.id === activeFolderId);
    return folder ? folder.name : '전체 메모';
  }, [activeFolderId, folders]);

  const handleEmptyTrash = () => {
    const trashedIds = memos.filter((m) => m.deletedAt).map((m) => m.id);
    if (trashedIds.length === 0) {
      Toast.show({
        type: 'info',
        text1: '비울 메모가 없습니다.',
        position: 'top',
        topOffset: 60,
      });
      return;
    }
    setEmptyTrashModalVisible(true);
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.folderSelector}
        onPress={() => setIsFolderSelectVisible(true)}
      >
        <AppText style={styles.folderTitle} numberOfLines={1}>
          {currentFolderName}
        </AppText>
        <ArrowDownIcon
          width={24}
          height={24}
          color={isDark ? '#ffffff' : '#111111'}
          style={{ marginBottom: 2 }}
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
          {isTrashMode && (
            <TouchableOpacity
              onPress={handleEmptyTrash}
              style={{ marginRight: 15 }}
            >
              <AppText style={{ color: 'red' }}>비우기</AppText>
            </TouchableOpacity>
          )}
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

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      {isTrashMode ? (
        <TrashIcon width={80} height={80} color={isDark ? '#333' : '#ccc'} />
      ) : (
        <MemoEmptyIcon
          width={80}
          height={80}
          color={isDark ? '#333' : '#ccc'}
        />
      )}

      <AppText style={[styles.emptyText, isDark && styles.emptyTextDark]}>
        {isTrashMode ? (
          <>
            휴지통이 비었어요{'\n'}
            {autoDeleteDays === 0
              ? '삭제된 메모는 수동으로 비우기 전까지 보관돼요'
              : `삭제된 메모는 ${autoDeleteDays}일 동안 보관돼요`}
          </>
        ) : (
          <>
            작성한 메모가 없어요{'\n'}
            지금 떠오르는 생각을 적어볼까요?
          </>
        )}
      </AppText>

      <AppTouchableOpacity
        style={[styles.emptyButton, isDark && styles.emptyButtonDark]}
        onPress={() => {
          if (isTrashMode) {
            setActiveFolderId(null);
          } else {
            router.push('/memo-editor');
          }
        }}
      >
        <AppText
          style={[styles.emptyButtonText, isDark && styles.emptyButtonTextDark]}
        >
          {isTrashMode ? '전체 메모 보기' : '메모 작성하기'}
        </AppText>
      </AppTouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <SectionList
        ref={sectionListRef}
        contentContainerStyle={[
          styles.listContainer,
          groupedMemos.length === 0 && { flexGrow: 1 },
        ]}
        stickySectionHeadersEnabled={false}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        sections={groupedMemos}
        keyExtractor={(item) => item.id}
        renderSectionHeader={({ section: { title } }) => (
          <View style={styles.sectionTitleWrapper}>
            {title === '고정된 메모' && (
              <PinIcon
                width={20}
                height={20}
                color={isDark ? '#ffffff' : '#111111'}
              />
            )}
            <AppText style={styles.sectionTitle}>{title}</AppText>
          </View>
        )}
        renderItem={({ item }) => {
          const formattedDate = formatMemoDate(item.updatedAt);
          const isAllMemos = activeFolderId === null;
          const parentFolder = folders.find((f) => f.id === item.folderId);

          const folderText = isAllMemos
            ? item.folderId && parentFolder
              ? ` ${parentFolder.name}`
              : ` 미분류`
            : '';

          const remainingDaysText = isTrashMode
            ? getRemainingDaysText(item.deletedAt, autoDeleteDays)
            : null;

          return (
            <TouchableOpacity
              style={[styles.memoCard, isDark && styles.memoCardDark]}
              onLongPress={() => setActiveMenuMemoId(item.id)}
              onPress={() => {
                if (isSelectMode) {
                  toggleSelection(item.id);
                } else if (isTrashMode) {
                  // 💡 휴지통 메모 선택 시 3버튼 커스텀 모달 호출
                  setSelectedTrashMemoId(item.id);
                  setTrashMemoModalVisible(true);
                } else {
                  router.push({
                    pathname: '/memo-editor',
                    params: { id: item.id },
                  });
                }
              }}
            >
              {isSelectMode && (
                <View
                  style={[
                    styles.checkbox,
                    selectedIds.includes(item.id) && styles.checked,
                    isDark && styles.checkboxDark,
                    isDark &&
                      selectedIds.includes(item.id) &&
                      styles.checkedDark,
                  ]}
                >
                  {selectedIds.includes(item.id) && (
                    <SelectCheckIcon
                      width={20}
                      height={20}
                      color={isDark ? '#111111' : '#ffffff'}
                    />
                  )}
                </View>
              )}

              <View style={styles.memoTextContainer}>
                <View style={styles.memoMainContainer}>
                  <View style={styles.memoHeaderContainer}>
                    <View style={styles.memoTitleContainer}>
                      {item.isLocked && (
                        <LockTitleIcon
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

                  {!isSelectMode && !isTrashMode && (
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

                  {isTrashMode && remainingDaysText ? (
                    <AppText
                      style={[
                        styles.remainingDaysText,
                        isDark && styles.remainingDaysTextDark,
                      ]}
                    >
                      {remainingDaysText}
                    </AppText>
                  ) : (
                    !!folderText && (
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
                    )
                  )}
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
      />

      {isSelectMode && (
        <LinearGradient
          pointerEvents="box-none"
          style={styles.bottomBarWrapper}
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
          <Animated.View
            pointerEvents={showBottomBar ? 'auto' : 'none'}
            style={[
              styles.bottomBar,
              isDark && styles.bottomBarDark,
              { transform: [{ translateY: slideAnim }] },
            ]}
          >
            {isTrashMode ? (
              <>
                <TouchableOpacity
                  style={[styles.actionBtn, isDark && styles.actionBtnDark]}
                  onPress={() => {
                    restoreMultipleMemos(selectedIds);
                    setIsSelectMode(false);
                    setSelectedIds([]);
                    Toast.show({
                      type: 'success',
                      text1: '메모가 복구되었어요',
                      position: 'top',
                      topOffset: 60,
                    });
                  }}
                >
                  <AppText
                    style={[
                      { color: '#007AFF', fontWeight: 'bold' },
                      isDark && { color: '#4A90E2' },
                    ]}
                  >
                    복구
                  </AppText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionBtn, isDark && styles.actionBtnDark]}
                  onPress={() => setDeleteMultipleModalVisible(true)}
                >
                  <AppText
                    style={[
                      { color: 'red', fontWeight: 'bold' },
                      isDark && { color: '#FF6B6B' },
                    ]}
                  >
                    영구 삭제
                  </AppText>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity
                  style={[styles.actionBtn, isDark && styles.actionBtnDark]}
                  onPress={() => setIsMoveModalVisible(true)}
                >
                  <AppText style={{ fontWeight: 'bold' }}>이동</AppText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionBtn, isDark && styles.actionBtnDark]}
                  onPress={() => {
                    const hasLockedMemo = selectedIds.some((id) => {
                      const memo = memos.find((m) => m.id === id);
                      return memo?.isLocked;
                    });

                    if (hasLockedMemo) {
                      Toast.show({
                        type: 'error',
                        text1: '잠긴 메모가 있어 삭제할 수 없어요.',
                        position: 'top',
                        topOffset: 60,
                      });
                      return;
                    }

                    moveMultipleToTrash(selectedIds);
                    scrollToTop();
                    setIsSelectMode(false);
                    setSelectedIds([]);
                    Toast.show({
                      type: 'success',
                      text1: '휴지통으로 이동되었어요',
                      position: 'top',
                      topOffset: 60,
                    });
                  }}
                >
                  <AppText
                    style={[
                      { color: 'red', fontWeight: 'bold' },
                      isDark && { color: '#FF6B6B' },
                    ]}
                  >
                    삭제
                  </AppText>
                </TouchableOpacity>
              </>
            )}
          </Animated.View>
        </LinearGradient>
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

      {/* 💡 1. 휴지통 전체 비우기 모달 */}
      <AppConfirmModal
        visible={emptyTrashModalVisible}
        title="휴지통 전체 비우기"
        message="휴지통에 있는 모든 메모를 영구 삭제하시겠습니까?"
        cancelText="취소"
        confirmText="비우기"
        confirmColor="#FF3B30"
        onCancel={() => setEmptyTrashModalVisible(false)}
        onConfirm={() => {
          const trashedIds = memos.filter((m) => m.deletedAt).map((m) => m.id);
          deleteMultipleMemos(trashedIds);
          scrollToTop();
          Toast.show({
            type: 'success',
            text1: '휴지통을 모두 비웠어요',
            position: 'top',
            topOffset: 60,
          });
          setEmptyTrashModalVisible(false);
        }}
      />

      {/* 💡 2. 다중 영구 삭제 모달 */}
      <AppConfirmModal
        visible={deleteMultipleModalVisible}
        title="영구 삭제"
        message="선택한 메모를 영구적으로 삭제하시겠습니까?"
        cancelText="취소"
        confirmText="삭제"
        confirmColor="#FF3B30"
        onCancel={() => setDeleteMultipleModalVisible(false)}
        onConfirm={() => {
          deleteMultipleMemos(selectedIds);
          scrollToTop();
          setIsSelectMode(false);
          setSelectedIds([]);
          setDeleteMultipleModalVisible(false);
        }}
      />

      {/* 💡 3. 휴지통 개별 메모 선택 모달 (3버튼 커스텀) */}
      <AppConfirmModal
        visible={trashMemoModalVisible}
        title="휴지통 메모"
        message="이 메모를 복구하시겠습니까?"
        topBtnText="영구 삭제"
        topBtnColor="#FF3B30"
        onTopBtnPress={() => {
          if (selectedTrashMemoId) {
            deleteMemo(selectedTrashMemoId);
            scrollToTop();
          }
          setTrashMemoModalVisible(false);
          setSelectedTrashMemoId(null);
        }}
        cancelText="취소"
        confirmText="복구"
        confirmColor="#007AFF"
        onCancel={() => {
          setTrashMemoModalVisible(false);
          setSelectedTrashMemoId(null);
        }}
        onConfirm={() => {
          if (selectedTrashMemoId) {
            restoreMemo(selectedTrashMemoId);
            Toast.show({
              type: 'success',
              text1: '메모가 복구되었어요',
              position: 'top',
              topOffset: 60,
            });
          }
          setTrashMemoModalVisible(false);
          setSelectedTrashMemoId(null);
        }}
      />

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
          { id: null, name: '전체 메모', icon: FolderIcon },
          { id: 'uncategorized', name: '미분류 메모', icon: FolderEmptyIcon },
          ...folders.map((f) => ({ id: f.id, name: f.name, icon: FolderIcon })),
          { id: 'trash', name: '휴지통', icon: TrashIcon },
        ]}
        onSelect={setActiveFolderId}
        onCreateFolder={addFolder}
        isDark={isDark}
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
          } else {
            moveMultipleMemos(selectedIds, id);
            setIsSelectMode(false);
            setSelectedIds([]);
          }
          setIsMoveModalVisible(false);
          // 💡 질문형 알림이 아닌 이동 완료 알림은 일관성을 위해 Toast 메시지로 대체
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
          if (activeMenuMemo) duplicateMemo(activeMenuMemo.id);
          setActiveMenuMemoId(null);
        }}
        onDelete={() => {
          if (activeMenuMemo?.isLocked) {
            Toast.show({
              type: 'error',
              text1: '잠긴 메모는 삭제할 수 없어요',
              position: 'top',
              topOffset: 60,
            });
            setActiveMenuMemoId(null);
            return;
          }

          if (activeMenuMemo) {
            moveToTrash(activeMenuMemo.id);
            scrollToTop();
            Toast.show({
              type: 'success',
              text1: '휴지통으로 이동되었어요',
              position: 'top',
              topOffset: 60,
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
    gap: 60,
    paddingLeft: 4,
    paddingRight: 8,
  },
  folderSelector: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  folderTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    flexShrink: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
  },
  sectionTitleWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
  },
  sectionTitle: {
    paddingHorizontal: 4,
    fontSize: 16,
    fontWeight: 'bold',
  },
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
  darkSubText: { color: '#aaa' },

  folderWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
  },
  memoMeta: { fontSize: 12, color: '#999' },
  remainingDaysText: {
    fontSize: 12,
    color: '#FF3B30',
  },
  remainingDaysTextDark: {
    color: '#FF6B6B',
  },
  folderText: { fontSize: 12, color: '#999', flexShrink: 1 },
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
  checkboxDark: {
    borderColor: '#ffffff',
  },
  checked: {
    borderColor: '#111111',
    backgroundColor: '#111111',
  },
  checkedDark: {
    backgroundColor: '#ffffff',
  },

  dotsBtn: { padding: 20 },

  bottomBarWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 40,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
    padding: 10,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 16,
  },
  bottomBarDark: {
    backgroundColor: '#2A2A2A',
    shadowColor: '#000',
    shadowOpacity: 0.5,
  },
  actionBtn: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnDark: {
    backgroundColor: '#3a3a3a',
  },

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
