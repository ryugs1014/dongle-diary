import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import AppText from '@/components/atoms/AppText';
import { useMemoStore } from '@/store/useMemoStore';
import AppTouchableOpacity from '@/components/atoms/AppTouchableOpacity';
import { AddBigIcon, OptionIcon } from '@/assets/icons';
import FolderOptionsBottomSheet from '@/components/modals/FolderOptionsBottomSheet';
import AppPromptModal from '@/components/modals/AppPromptModal';
import { LinearGradient } from 'expo-linear-gradient';
import DraggableFlatList, {
  ScaleDecorator,
  RenderItemParams,
} from 'react-native-draggable-flatlist';
import {
  GestureHandlerRootView,
  TouchableOpacity as RNGHTouchableOpacity,
} from 'react-native-gesture-handler';
import Toast from 'react-native-toast-message';

interface MemoFolderViewProps {
  isDark: boolean;
  t: (ko: string, en: string) => string;
  onGoToList: () => void;
}

const DragHandleIcon = ({ color }: { color: string }) => (
  <View style={{ gap: 4, paddingHorizontal: 10, paddingVertical: 4 }}>
    <View
      style={{ width: 18, height: 2, backgroundColor: color, borderRadius: 1 }}
    />
    <View
      style={{ width: 18, height: 2, backgroundColor: color, borderRadius: 1 }}
    />
    <View
      style={{ width: 18, height: 2, backgroundColor: color, borderRadius: 1 }}
    />
  </View>
);

export default function MemoFolderView({
  isDark,
  t,
  onGoToList,
}: MemoFolderViewProps) {
  const {
    folders,
    memos,
    addFolder,
    updateFolder,
    deleteFolder,
    moveMultipleMemos,
    setActiveFolderId,
    reorderFolders,
    cleanupTrash,
  } = useMemoStore();

  // 🔥 마운트 시 30일 지난 휴지통 데이터 자동 삭제 실행
  useEffect(() => {
    cleanupTrash();
  }, [cleanupTrash]);

  const [isEditMode, setIsEditMode] = useState(false);
  const [activeMenuFolderId, setActiveMenuFolderId] = useState<string | null>(
    null,
  );

  const [isPromptVisible, setIsPromptVisible] = useState(false);
  const [promptMode, setPromptMode] = useState<'add' | 'rename'>('add');
  const [folderNameInput, setFolderNameInput] = useState('');
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);

  const [isSelectMemosVisible, setIsSelectMemosVisible] = useState(false);
  const [selectedFolderIdForMemos, setSelectedFolderIdForMemos] = useState<
    string | null
  >(null);
  const [tempSelectedMemoIds, setTempSelectedMemoIds] = useState<string[]>([]);

  // 🔥 삭제되지 않은 진짜 미지정 메모만 카운트
  const uncategorizedMemosCount = useMemo(() => {
    return memos.filter((m) => !m.folderId && !m.deletedAt).length;
  }, [memos]);

  // 🔥 휴지통 메모 카운트
  const trashedMemosCount = useMemo(() => {
    return memos.filter((m) => m.deletedAt).length;
  }, [memos]);

  const { virtualFolders, pinnedFolders, unpinnedFolders } = useMemo(() => {
    const virtual: any[] = [
      { id: 'all', name: '전체 메모', isPinned: false, createdAt: 0 },
    ];
    if (uncategorizedMemosCount > 0) {
      virtual.push({
        id: 'uncategorized',
        name: '폴더 미지정 메모',
        isPinned: false,
        createdAt: 0,
      });
    }

    // 🔥 휴지통 폴더 추가 (휴지통에 메모가 있을 때만 보이거나 항상 보이게. 여기선 항상 보이게 처리)
    virtual.push({
      id: 'trash',
      name: '휴지통',
      isPinned: false,
      createdAt: 0,
    });

    const pinned = folders
      .filter((f) => f.isPinned)
      .sort((a, b) => b.createdAt - a.createdAt);
    const unpinned = folders.filter((f) => !f.isPinned);

    return {
      virtualFolders: virtual,
      pinnedFolders: pinned,
      unpinnedFolders: unpinned,
    };
  }, [folders, uncategorizedMemosCount]);

  const activeMenuFolder = useMemo(() => {
    return folders.find((f) => f.id === activeMenuFolderId) || null;
  }, [folders, activeMenuFolderId]);

  const handleSaveFolder = () => {
    const trimmedName = folderNameInput.trim();
    if (!trimmedName) return;

    // 🔥 중복 이름 검사 로직 추가
    const isDuplicate = folders.some((f) => {
      if (f.name === trimmedName) {
        // '새 폴더 생성'일 때는 이름이 같으면 무조건 중복
        if (promptMode === 'add') return true;
        // '이름 변경'일 때는 내 원래 이름(editingFolderId)이 아닌데 같은 이름이 있으면 중복
        if (promptMode === 'rename' && f.id !== editingFolderId) return true;
      }
      return false;
    });

    if (isDuplicate) {
      Toast.show({
        type: 'info',
        text1: '같은 이름의 폴더가 있어요',
        position: 'top',
        topOffset: 60,
      });
      return; // ❌ 중복이면 여기서 멈추고 모달을 닫지 않음
    }

    if (promptMode === 'add') {
      addFolder(folderNameInput.trim());
    } else if (promptMode === 'rename' && editingFolderId) {
      updateFolder(editingFolderId, { name: folderNameInput.trim() });
    }
    setIsPromptVisible(false);
    setFolderNameInput('');
    setEditingFolderId(null);
  };

  const handleSaveAssignedMemos = () => {
    if (selectedFolderIdForMemos) {
      moveMultipleMemos(tempSelectedMemoIds, selectedFolderIdForMemos);
    }
    setIsSelectMemosVisible(false);
    setActiveMenuFolderId(null);
  };

  const renderFolderCard = useCallback(
    (item: any, isVirtual: boolean, drag?: () => void, isActive?: boolean) => {
      const isAll = item.id === 'all';
      const isUncategorized = item.id === 'uncategorized';
      const isTrash = item.id === 'trash'; // 🔥 휴지통 체크

      // 🔥 메모 개수 계산 로직 변경 (삭제된 건 제외)
      const memoCount = isAll
        ? memos.filter((m) => !m.deletedAt).length
        : isUncategorized
          ? uncategorizedMemosCount
          : isTrash
            ? trashedMemosCount
            : memos.filter((m) => m.folderId === item.id && !m.deletedAt)
                .length;

      const TouchableComponent = isEditMode
        ? RNGHTouchableOpacity
        : TouchableOpacity;

      return (
        <TouchableComponent
          onLongPress={isEditMode && drag ? drag : undefined}
          delayLongPress={150}
          activeOpacity={isEditMode ? 0.9 : 0.7}
          style={[
            styles.folderCard,
            isDark && styles.folderCardDark,
            isActive && styles.activeDragCard,
          ]}
          onPress={() => {
            if (isEditMode) return;
            if (isAll) setActiveFolderId(null);
            else if (isUncategorized) setActiveFolderId('uncategorized');
            else if (isTrash)
              setActiveFolderId('trash'); // 🔥 휴지통 탭 이동
            else setActiveFolderId(item.id);
            onGoToList();
          }}
        >
          <View style={styles.folderInfo}>
            <AppText style={styles.folderName}>
              {isAll
                ? '📚 '
                : isUncategorized
                  ? '📝 '
                  : isTrash
                    ? '🗑️ '
                    : item.isPinned
                      ? '📌 '
                      : '📁 '}
              {item.name}
            </AppText>
            <View
              style={[styles.folderCount, isDark && styles.folderCountDark]}
            >
              <AppText
                style={[styles.countText, isDark && styles.countTextDark]}
              >
                {memoCount}
              </AppText>
            </View>
          </View>

          {!isVirtual && (
            <View style={styles.dotsBtn}>
              {isEditMode ? (
                drag ? (
                  <DragHandleIcon color={isDark ? '#ffffff' : '#111111'} />
                ) : null
              ) : (
                <TouchableOpacity
                  onPress={() => setActiveMenuFolderId(item.id)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <OptionIcon
                    width={28}
                    height={28}
                    color={isDark ? '#ffffff' : '#111111'}
                  />
                </TouchableOpacity>
              )}
            </View>
          )}
        </TouchableComponent>
      );
    },
    [
      isEditMode,
      isDark,
      memos,
      uncategorizedMemosCount,
      onGoToList,
      setActiveFolderId,
    ],
  );

  // 헤더와 빈 화면(Empty) 컴포넌트는 두 리스트에서 공통으로 사용하므로 분리
  const ListHeader = (
    <>
      <View style={styles.folderHeader}>
        <AppText style={styles.headerTitle}>폴더 목록 (그룹)</AppText>
        <TouchableOpacity
          style={styles.editBtn}
          onPress={() => setIsEditMode(!isEditMode)}
        >
          <AppText style={styles.editBtnText}>
            {isEditMode ? '완료' : '편집'}
          </AppText>
        </TouchableOpacity>
      </View>

      <View style={{ gap: 10, marginBottom: 10 }}>
        {virtualFolders.map((f) => (
          <View key={f.id}>{renderFolderCard(f, true)}</View>
        ))}
        {pinnedFolders.map((f) => (
          <View key={f.id}>{renderFolderCard(f, false)}</View>
        ))}
      </View>
    </>
  );

  const ListEmpty =
    pinnedFolders.length === 0 && unpinnedFolders.length === 0 ? (
      <View style={styles.emptyContainer}>
        <AppText style={{ color: '#999' }}>생성된 폴더가 없습니다.</AppText>
      </View>
    ) : null;

  return (
    <View style={styles.container}>
      {/* 🔥 핵심 최적화: 모드에 따라 아예 다른 리스트 컴포넌트를 그립니다. */}
      {isEditMode ? (
        <DraggableFlatList
          data={unpinnedFolders}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          animationConfig={{ stiffness: 300, damping: 20, mass: 0.1 }}
          onDragEnd={({ data }) => {
            if (reorderFolders) {
              reorderFolders([...folders.filter((f) => f.isPinned), ...data]);
            }
          }}
          renderItem={({ item, drag, isActive }) => (
            <ScaleDecorator>
              <View style={{ paddingBottom: 10 }}>
                {renderFolderCard(item, false, drag, isActive)}
              </View>
            </ScaleDecorator>
          )}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={5}
          ListHeaderComponent={ListHeader}
          ListEmptyComponent={ListEmpty}
        />
      ) : (
        <FlatList
          data={unpinnedFolders}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          // 평상시엔 쾌적한 속도를 위해 ScaleDecorator나 drag 기능 없이 렌더링
          renderItem={({ item }) => (
            <View style={{ paddingBottom: 10 }}>
              {renderFolderCard(item, false)}
            </View>
          )}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={5}
          ListHeaderComponent={ListHeader}
          ListEmptyComponent={ListEmpty}
        />
      )}

      {!isEditMode && (
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
            style={styles.nextBtn}
            onPress={() => {
              setPromptMode('add');
              setFolderNameInput('');
              setIsPromptVisible(true);
            }}
          >
            <AddBigIcon
              width={60}
              height={60}
              color={isDark ? '#ffffff' : '#333333'}
            />
          </AppTouchableOpacity>
        </LinearGradient>
      )}

      <AppPromptModal
        visible={isPromptVisible}
        title={promptMode === 'add' ? '새 폴더 생성' : '폴더 이름 변경'}
        value={folderNameInput}
        onChangeText={setFolderNameInput}
        placeholder="폴더 이름을 입력하세요"
        onCancel={() => {
          setIsPromptVisible(false);
          setEditingFolderId(null);
        }}
        onConfirm={handleSaveFolder}
      />

      <FolderOptionsBottomSheet
        visible={!!activeMenuFolderId}
        onClose={() => setActiveMenuFolderId(null)}
        folder={activeMenuFolder}
        isDark={isDark}
        onRename={() => {
          if (activeMenuFolder) {
            setPromptMode('rename');
            setFolderNameInput(activeMenuFolder.name);
            setEditingFolderId(activeMenuFolder.id);
            setIsPromptVisible(true);
          }
          setActiveMenuFolderId(null);
        }}
        onTogglePin={() => {
          if (activeMenuFolder) {
            updateFolder(activeMenuFolder.id, {
              isPinned: !activeMenuFolder.isPinned,
            });
          }
          setActiveMenuFolderId(null);
        }}
        onEditMode={() => setIsEditMode(!isEditMode)}

        onAssignMemos={() => {
          if (activeMenuFolder) {
            setSelectedFolderIdForMemos(activeMenuFolder.id);
            setTempSelectedMemoIds(
              memos
                .filter((m) => m.folderId === activeMenuFolder.id)
                .map((m) => m.id),
            );
            setIsSelectMemosVisible(true);
          }
          setActiveMenuFolderId(null);
        }}
        onDelete={() => {
          if (activeMenuFolder) {
            deleteFolder(activeMenuFolder.id);
          }
          setActiveMenuFolderId(null);
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
  },
  folderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    lineHeight: 24,
  },
  editBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#eee',
    borderRadius: 8,
  },
  editBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  folderCard: {
    flexDirection: 'row',
    minHeight: 68,
    gap: 20,
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
  folderCardDark: {
    backgroundColor: '#191919',
  },
  activeDragCard: {
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
    transform: [{ scale: 1.02 }],
  },
  folderInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  folderName: { fontSize: 16, fontWeight: 'bold', lineHeight: 20 },
  folderCount: {
    paddingVertical: 3,
    paddingHorizontal: 5,
    borderRadius: 6,
    backgroundColor: '#ccc',
  },
  folderCountDark: {
    backgroundColor: '#666',
  },
  countText: { fontSize: 12, fontWeight: 'bold', textAlign: 'center' },
  dotsBtn: { padding: 20, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { alignItems: 'center', marginTop: 100 },
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
