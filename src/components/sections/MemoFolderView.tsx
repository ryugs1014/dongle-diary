import React, { useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import AppText from '@/components/atoms/AppText';
import { useMemoStore } from '@/store/useMemoStore';

export default function MemoFolderView({
  onGoToList,
}: {
  onGoToList: () => void;
}) {
  const {
    folders,
    memos,
    addFolder,
    updateFolder,
    deleteFolder,
    moveMultipleMemos,
    setActiveFolderId,
  } = useMemoStore();

  // 상태 관리
  const [activeMenuFolderId, setActiveMenuFolderId] = useState<string | null>(
    null,
  );

  // 모달 상태 관리
  const [isPromptVisible, setIsPromptVisible] = useState(false);
  const [promptMode, setPromptMode] = useState<'add' | 'rename'>('add');
  const [folderNameInput, setFolderNameInput] = useState('');

  // 그룹에 넣을 메모 선택용 모달 상태
  const [isSelectMemosVisible, setIsSelectMemosVisible] = useState(false);
  const [selectedFolderIdForMemos, setSelectedFolderIdForMemos] = useState<
    string | null
  >(null);
  const [tempSelectedMemoIds, setTempSelectedMemoIds] = useState<string[]>([]);

  // 🟢 고정된 폴더를 상단에 배치하도록 정렬
  const sortedFolders = useMemo(() => {
    return [...folders].sort((a, b) => {
      if (a.isPinned === b.isPinned) return b.createdAt - a.createdAt;
      return a.isPinned ? -1 : 1;
    });
  }, [folders]);

  // 폴더 생성 및 이름 변경 저장
  const handleSaveFolder = () => {
    if (!folderNameInput.trim()) return;
    if (promptMode === 'add') {
      addFolder(folderNameInput.trim());
    } else if (promptMode === 'rename' && activeMenuFolderId) {
      updateFolder(activeMenuFolderId, { name: folderNameInput.trim() });
    }
    setIsPromptVisible(false);
    setFolderNameInput('');
    setActiveMenuFolderId(null);
  };

  // 메모 선택 모달에서 저장
  const handleSaveAssignedMemos = () => {
    if (selectedFolderIdForMemos) {
      // 선택된 메모들을 해당 폴더로 이동 (이전 폴더에서 빼는 것은 추후 로직 보강 가능)
      moveMultipleMemos(tempSelectedMemoIds, selectedFolderIdForMemos);
    }
    setIsSelectMemosVisible(false);
    setActiveMenuFolderId(null);
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <AppText style={styles.headerTitle}>폴더 (그룹)</AppText>
      <TouchableOpacity onPress={onGoToList}>
        <AppText>📝 메모 목록</AppText>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {renderHeader()}

      <FlatList
        data={sortedFolders}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        renderItem={({ item }) => {
          // 해당 폴더에 속한 메모 개수 계산
          const memoCount = memos.filter((m) => m.folderId === item.id).length;

          return (
            <TouchableOpacity
              style={styles.folderCard}
              onPress={() => {
                // 🟢 폴더 탭 시 활성화된 폴더를 변경하고 리스트 화면으로 넘어감
                setActiveFolderId(item.id);
                onGoToList();
              }}
            >
              <View style={{ flex: 1 }}>
                <AppText style={styles.folderName}>
                  {item.isPinned ? '📌 ' : '📁 '}
                  {item.name}
                </AppText>
                <AppText style={styles.memoCount}>메모 {memoCount}개</AppText>
              </View>

              {/* 추가 메뉴 버튼 [...] */}
              <TouchableOpacity
                style={styles.dotsBtn}
                onPress={() => setActiveMenuFolderId(item.id)}
              >
                <AppText style={{ fontWeight: 'bold' }}>•••</AppText>
              </TouchableOpacity>

              {/* 폴더 옵션 모달/팝업 */}
              {activeMenuFolderId === item.id && (
                <View style={styles.menuPopup}>
                  <TouchableOpacity
                    onPress={() => {
                      setPromptMode('rename');
                      setFolderNameInput(item.name);
                      setIsPromptVisible(true);
                    }}
                  >
                    <AppText>이름 변경</AppText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      updateFolder(item.id, { isPinned: !item.isPinned });
                      setActiveMenuFolderId(null);
                    }}
                  >
                    <AppText>{item.isPinned ? '고정 해제' : '고정'}</AppText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      setSelectedFolderIdForMemos(item.id);
                      // 현재 폴더에 속한 메모들만 미리 체크해두기
                      setTempSelectedMemoIds(
                        memos
                          .filter((m) => m.folderId === item.id)
                          .map((m) => m.id),
                      );
                      setIsSelectMemosVisible(true);
                    }}
                  >
                    <AppText>메모 할당하기</AppText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      deleteFolder(item.id);
                      setActiveMenuFolderId(null);
                    }}
                  >
                    <AppText style={{ color: 'red' }}>삭제</AppText>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setActiveMenuFolderId(null)}>
                    <AppText>닫기</AppText>
                  </TouchableOpacity>
                </View>
              )}
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <AppText style={{ color: '#999' }}>생성된 폴더가 없습니다.</AppText>
          </View>
        }
      />

      {/* 1. 폴더 생성 버튼 (글쓰기 버튼 위치) */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => {
          setPromptMode('add');
          setFolderNameInput('');
          setIsPromptVisible(true);
        }}
      >
        <AppText style={{ fontSize: 24, color: '#fff' }}>+</AppText>
      </TouchableOpacity>

      {/* 이름 입력 프롬프트 모달 (React Native 기본 제공 Modal 사용) */}
      <Modal visible={isPromptVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <AppText style={{ marginBottom: 10, fontWeight: 'bold' }}>
              {promptMode === 'add' ? '새 폴더 생성' : '폴더 이름 변경'}
            </AppText>
            <TextInput
              style={styles.textInput}
              value={folderNameInput}
              onChangeText={setFolderNameInput}
              placeholder="폴더 이름을 입력하세요"
              autoFocus
            />
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'flex-end',
                marginTop: 15,
                gap: 15,
              }}
            >
              <TouchableOpacity onPress={() => setIsPromptVisible(false)}>
                <AppText>취소</AppText>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSaveFolder}>
                <AppText style={{ color: '#007AFF', fontWeight: 'bold' }}>
                  저장
                </AppText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 3. 그룹에 넣을 메모 선택 모달 */}
      <Modal visible={isSelectMemosVisible} animationType="slide">
        <View style={styles.fullModalContainer}>
          <View style={styles.fullModalHeader}>
            <TouchableOpacity onPress={() => setIsSelectMemosVisible(false)}>
              <AppText>취소</AppText>
            </TouchableOpacity>
            <AppText style={{ fontWeight: 'bold' }}>메모 선택</AppText>
            <TouchableOpacity onPress={handleSaveAssignedMemos}>
              <AppText style={{ color: '#007AFF' }}>완료</AppText>
            </TouchableOpacity>
          </View>
          <FlatList
            data={memos}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.selectMemoCard}
                onPress={() => {
                  if (tempSelectedMemoIds.includes(item.id)) {
                    setTempSelectedMemoIds((prev) =>
                      prev.filter((id) => id !== item.id),
                    );
                  } else {
                    setTempSelectedMemoIds((prev) => [...prev, item.id]);
                  }
                }}
              >
                <View style={styles.checkbox}>
                  {tempSelectedMemoIds.includes(item.id) && (
                    <AppText>✅</AppText>
                  )}
                </View>
                <AppText style={{ flex: 1 }} numberOfLines={1}>
                  {item.title || item.preview}
                </AppText>
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 15,
    alignItems: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  listContainer: { padding: 15, paddingBottom: 100 },
  folderCard: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  folderName: { fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  memoCount: { fontSize: 13, color: '#888' },
  dotsBtn: { padding: 10 },
  menuPopup: {
    position: 'absolute',
    right: 40,
    top: 10,
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    elevation: 5,
    gap: 15,
    zIndex: 10,
  },
  emptyContainer: { alignItems: 'center', marginTop: 100 },
  fab: {
    position: 'absolute',
    bottom: 40,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },

  // 모달 스타일
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    width: '80%',
    padding: 20,
    borderRadius: 12,
  },
  textInput: {
    borderBottomWidth: 1,
    borderColor: '#ccc',
    paddingVertical: 5,
    fontSize: 16,
  },

  fullModalContainer: {
    flex: 1,
    backgroundColor: 'white',
    marginTop: 50,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  fullModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  selectMemoCard: {
    flexDirection: 'row',
    padding: 15,
    borderBottomWidth: 1,
    borderColor: '#f1f1f1',
    alignItems: 'center',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 1,
    borderColor: '#ccc',
    marginRight: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 4,
  },
});
