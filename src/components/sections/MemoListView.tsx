import React, { useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  SectionList,
  TextInput,
  Alert,
  TouchableOpacity,
  FlatList,
  Modal,
} from 'react-native';
import { router } from 'expo-router';
import AppText from '@/components/atoms/AppText';
import { useMemoStore } from '@/store/useMemoStore';
import { AddBigIcon } from '@/assets/icons';

export default function MemoListView({
  onGoToFolders,
}: {
  onGoToFolders: () => void;
}) {
  const {
    memos,
    folders,
    activeFolderId,
    setActiveFolderId,
    updateMemo,
    deleteMemo,
    duplicateMemo,
    deleteMultipleMemos,
    moveMultipleMemos,
  } = useMemoStore();

  // 상태 관리
  const [searchQuery, setSearchQuery] = useState('');
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeMenuMemoId, setActiveMenuMemoId] = useState<string | null>(null);
  const [isFolderDropdownVisible, setIsFolderDropdownVisible] = useState(false);
  const [isMoveModalVisible, setIsMoveModalVisible] = useState(false); // 💡 폴더 이동 모달 상태

  // 🟢 메모 날짜별 그룹화 로직
  const groupedMemos = useMemo(() => {
    let filtered = memos;

    // 1. 선택된 폴더가 있으면 해당 폴더의 메모만 필터링
    if (activeFolderId) {
      filtered = filtered.filter((m) => m.folderId === activeFolderId);
    }

    // 2. 검색어가 있으면 검색어로 필터링
    if (searchQuery) {
      filtered = filtered.filter(
        (m) => m.title.includes(searchQuery) || m.content.includes(searchQuery),
      );
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
      sections.push({ title: '📌 고정된 메모', data: pinned });
    if (today.length > 0) sections.push({ title: '오늘', data: today });
    if (yesterday.length > 0) sections.push({ title: '어제', data: yesterday });
    if (last7Days.length > 0)
      sections.push({ title: '최근 7일', data: last7Days });

    Object.keys(olderMap).forEach((key) => {
      sections.push({ title: key, data: olderMap[key] });
    });

    return sections;
  }, [memos, folders, searchQuery, activeFolderId]); // 의존성 배열에 activeFolderId 추가

  // 다중 선택 토글
  const toggleSelection = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  // 🟢 헤더 렌더링
  // 현재 활성화된 폴더 이름 찾기
  const currentFolderName = activeFolderId
    ? folders.find((f) => f.id === activeFolderId)?.name || '알 수 없는 폴더'
    : '전체 메모';

  const renderHeader = () => (
    <View style={styles.header}>
      {/* 🟢 폴더 선택 드롭다운 버튼 */}
      <TouchableOpacity
        style={{ flexDirection: 'row', alignItems: 'center' }}
        onPress={() => setIsFolderDropdownVisible(true)}
      >
        <AppText style={styles.headerTitle}>{currentFolderName} ▾</AppText>
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
            onPress={() => setIsSelectMode(true)}
            style={{ marginRight: 15 }}
          >
            <AppText>✔️ 선택</AppText>
          </TouchableOpacity>
          <TouchableOpacity onPress={onGoToFolders}>
            <AppText>⚙️ 폴더 관리</AppText>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {renderHeader()}

      {/* 검색 바 */}
      <TextInput
        style={styles.searchBar}
        placeholder="메모 검색..."
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      <SectionList
        sections={groupedMemos}
        keyExtractor={(item) => item.id}
        renderSectionHeader={({ section: { title } }) => (
          <AppText style={styles.sectionTitle}>{title}</AppText>
        )}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.memoCard}
            onLongPress={() => setActiveMenuMemoId(item.id)} // 꾹 누르면 메뉴 등장
            onPress={() => {
              if (isSelectMode) {
                toggleSelection(item.id);
              } else if (!item.isLocked) {
                router.push({
                  pathname: '/memo-editor',
                  params: { id: item.id },
                });
              } else {
                Alert.alert('잠금된 메모', '이 메모는 읽기 전용입니다.');
              }
            }}
          >
            {isSelectMode && (
              <View style={styles.checkbox}>
                {selectedIds.includes(item.id) && <AppText>✅</AppText>}
              </View>
            )}
            <View style={{ flex: 1 }}>
              <AppText style={styles.memoTitle}>
                {item.isLocked ? '🔒 ' : ''}
                {item.title}
              </AppText>
              <AppText numberOfLines={1}>{item.preview}</AppText>
            </View>

            {/* 개별 아이템 메뉴 버튼 [...] */}
            {!isSelectMode && (
              <TouchableOpacity onPress={() => setActiveMenuMemoId(item.id)}>
                <AppText style={styles.dotsBtn}>•••</AppText>
              </TouchableOpacity>
            )}

            {/* 임시 모달 (실제 구현 시 ActionSheet나 Modal 컴포넌트로 교체 추천) */}
            {activeMenuMemoId === item.id && (
              <View style={styles.menuPopup}>
                <TouchableOpacity
                  onPress={() => {
                    updateMemo(item.id, { isPinned: !item.isPinned });
                    setActiveMenuMemoId(null);
                  }}
                >
                  <AppText>{item.isPinned ? '고정 해제' : '고정'}</AppText>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    updateMemo(item.id, { isLocked: !item.isLocked });
                    setActiveMenuMemoId(null);
                  }}
                >
                  <AppText>{item.isLocked ? '잠금 해제' : '잠금'}</AppText>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    duplicateMemo(item.id);
                    setActiveMenuMemoId(null);
                  }}
                >
                  <AppText>복제</AppText>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    deleteMemo(item.id);
                    setActiveMenuMemoId(null);
                  }}
                >
                  <AppText style={{ color: 'red' }}>삭제</AppText>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setActiveMenuMemoId(null)}>
                  <AppText>닫기</AppText>
                </TouchableOpacity>
              </View>
            )}
          </TouchableOpacity>
        )}
      />

      {/* 하단 다중 선택 액션 바 */}
      {isSelectMode && (
        <View style={styles.bottomBar}>
          <TouchableOpacity
            onPress={() => {
              /* 폴더 이동 모달 띄우기 로직 */
            }}
          >
            <AppText>폴더 이동</AppText>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              deleteMultipleMemos(selectedIds);
              setIsSelectMode(false);
              setSelectedIds([]);
            }}
          >
            <AppText style={{ color: 'red' }}>삭제</AppText>
          </TouchableOpacity>
        </View>
      )}

      {/* 💡 추가됨: 메모 생성 버튼 (선택 모드가 아닐 때만 표시) */}
      {!isSelectMode && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => router.push('/memo-editor')}
        >
          <AddBigIcon width={60} height={60} color="#111111" />
        </TouchableOpacity>
      )}

      <Modal visible={isFolderDropdownVisible} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsFolderDropdownVisible(false)}
        >
          <View style={styles.dropdownMenu}>
            <TouchableOpacity
              style={styles.dropdownItem}
              onPress={() => {
                setActiveFolderId(null);
                setIsFolderDropdownVisible(false);
              }}
            >
              <AppText
                style={{
                  fontWeight: activeFolderId === null ? 'bold' : 'normal',
                }}
              >
                📝 전체 메모
              </AppText>
            </TouchableOpacity>

            <FlatList
              data={folders}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.dropdownItem}
                  onPress={() => {
                    setActiveFolderId(item.id);
                    setIsFolderDropdownVisible(false);
                  }}
                >
                  <AppText
                    style={{
                      fontWeight:
                        activeFolderId === item.id ? 'bold' : 'normal',
                    }}
                  >
                    📁 {item.name}
                  </AppText>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={isMoveModalVisible} animationType="slide">
        <View style={styles.fullModalContainer}>
          <View style={styles.fullModalHeader}>
            <TouchableOpacity onPress={() => setIsMoveModalVisible(false)}>
              <AppText>취소</AppText>
            </TouchableOpacity>
            <AppText style={{ fontWeight: 'bold', fontSize: 16 }}>
              이동할 폴더 선택
            </AppText>
            <View style={{ width: 30 }} />
          </View>

          <FlatList
            data={[{ id: null, name: '📝 전체 메모 (폴더 없음)' }, ...folders]}
            keyExtractor={(item) => item.id || 'null'}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.selectFolderCard}
                onPress={() => {
                  moveMultipleMemos(selectedIds, item.id);
                  setIsMoveModalVisible(false);
                  setIsSelectMode(false);
                  setSelectedIds([]);
                  Alert.alert('이동 완료', '선택한 메모가 이동되었습니다.');
                }}
              >
                <AppText>{item.name}</AppText>
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 15,
    alignItems: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  searchBar: {
    margin: 15,
    padding: 10,
    backgroundColor: '#e9ecef',
    borderRadius: 8,
  },

  sectionTitle: {
    paddingHorizontal: 15,
    paddingTop: 15,
    paddingBottom: 5,
    fontWeight: 'bold',
    color: '#666',
  },
  memoCard: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f1f1',
    alignItems: 'center',
  },
  memoTitle: { fontWeight: 'bold', marginBottom: 4 },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 1,
    borderColor: '#ccc',
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotsBtn: { padding: 10, fontWeight: 'bold', fontSize: 18 },
  menuPopup: {
    position: 'absolute',
    right: 40,
    top: 10,
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 8,
    elevation: 5,
    gap: 10,
  },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderColor: '#ccc',
  },

  // 모달 스타일
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'flex-start',
  },
  dropdownMenu: {
    backgroundColor: 'white',
    marginTop: 50,
    marginLeft: 15,
    width: 200,
    borderRadius: 12,
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    maxHeight: 300,
  },
  dropdownItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f1f1',
  },

  // 폴더 이동 모달용 스타일
  fullModalContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    marginTop: 50,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  fullModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderColor: '#eee',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  selectFolderCard: {
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderColor: '#f1f1f1',
  },

  fab: {
    position: 'absolute',
    bottom: 40,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
    backgroundColor: '#ffffff', // 필요에 따라 앱 테마색으로 변경 가능
  },
});
