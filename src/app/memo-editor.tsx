import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  View,
  Keyboard,
  AppState,
  Modal,
  TextInput,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { RichText, Toolbar, useEditorBridge } from '@10play/tentap-editor';
import AppTouchableOpacity from '@/components/atoms/AppTouchableOpacity';
import AppText from '@/components/atoms/AppText';
import { AddBigIcon } from '@/assets/icons';
import { useMemoStore } from '../store/useMemoStore';

export default function MemoEditorScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const { memos, addMemo, updateMemo, deleteMemo } = useMemoStore();
  const existingMemo = memos.find((m) => m.id === id);

  // 상태 관리
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const [isMenuVisible, setMenuVisible] = useState(false);
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [searchText, setSearchText] = useState('');

  // 자동 저장을 위한 Ref
  const currentIdRef = useRef(id || Date.now().toString());
  const isNewRef = useRef(!id);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const editor = useEditorBridge({
    autofocus: !existingMemo,
    avoidIosKeyboard: true,
    // 💡 첫 줄 제목화: 새 메모일 경우 처음부터 <h1> 태그(제목 양식)로 시작하도록 설정합니다.
    initialContent: existingMemo ? existingMemo.content : '<h1></h1>',
    onChange: () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        performSave();
      }, 1000);
    },
  });

  // 실제 저장 로직
  const performSave = async () => {
    if (!editor) return;
    const htmlContent = await editor.getHTML();
    const plainText = htmlContent
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // 💡 내용이 완전히 비어있다면 저장하지 않거나 기존 메모를 삭제합니다 (애플 메모장 방식)
    if (!plainText) {
      if (!isNewRef.current) {
        deleteMemo(currentIdRef.current);
      }
      return;
    }

    const title =
      plainText.substring(0, 15) + (plainText.length > 15 ? '...' : '');
    const preview = plainText.length > 15 ? plainText.substring(15, 80) : '';

    if (isNewRef.current) {
      addMemo({
        id: currentIdRef.current,
        title,
        content: htmlContent,
        preview,
      });
      isNewRef.current = false;
    } else {
      updateMemo(currentIdRef.current, {
        title,
        content: htmlContent,
        preview,
      });
    }
  };

  // 키보드 및 앱 종료 감지
  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setKeyboardVisible(true),
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardVisible(false),
    );

    const appStateSub = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState.match(/inactive|background/)) {
        performSave();
      }
    });

    return () => {
      showSub.remove();
      hideSub.remove();
      appStateSub.remove();
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [editor]);

  // 💡 완료 버튼 클릭 시: 키보드를 내리면 자연스럽게 읽기 모드처럼 보입니다.
  const handleDone = () => {
    performSave();
    Keyboard.dismiss(); // 1. 네이티브 앱의 키보드를 숨깁니다.
    editor?.blur(); // 💡 2. 에디터 내부의 포커스(커서)를 강제로 해제합니다.
  };

  // 💡 뒤로가기 버튼 클릭 시: 저장이 '완료될 때까지 기다린 후(await)' 화면을 닫습니다.
  const handleBack = async () => {
    await performSave();
    router.back();
  };

  const renderHeader = () => {
    if (isSearchVisible) {
      return (
        <View style={styles.header}>
          <TextInput
            style={styles.searchInput}
            placeholder="메모 내에서 찾기..."
            value={searchText}
            onChangeText={setSearchText}
            autoFocus
          />
          <AppTouchableOpacity onPress={() => setIsSearchVisible(false)}>
            <AppText style={styles.headerBtnText}>닫기</AppText>
          </AppTouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.header}>
        <AppTouchableOpacity onPress={handleBack}>
          <AppText style={styles.headerBtnText}>&lt; 뒤로</AppText>
        </AppTouchableOpacity>

        <View style={styles.headerRight}>
          {/* 실행 취소 (Undo) */}
          <AppTouchableOpacity
            onPress={() => editor?.undo()}
            style={{ marginRight: 15 }}
          >
            <AppText style={{ fontSize: 20, color: '#666' }}>↺</AppText>
          </AppTouchableOpacity>

          {/* 실행 복귀 (Redo) */}
          <AppTouchableOpacity
            onPress={() => editor?.redo()}
            style={{ marginRight: 20 }}
          >
            <AppText style={{ fontSize: 20, color: '#666' }}>↻</AppText>
          </AppTouchableOpacity>

          <AppTouchableOpacity onPress={() => setMenuVisible(true)}>
            <AppText style={styles.headerBtnText}>•••</AppText>
          </AppTouchableOpacity>

          {isKeyboardVisible && (
            <AppTouchableOpacity
              onPress={handleDone}
              style={{ marginRight: 15 }}
            >
              <AppText style={[styles.headerBtnText, styles.saveBtnText]}>
                완료
              </AppText>
            </AppTouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const currentMemoState =
    memos.find((m) => m.id === currentIdRef.current) || existingMemo;

  return (
    <View style={styles.container}>
      {renderHeader()}

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardContainer}
      >
        <RichText editor={editor} />
        {/* 💡 읽기 모드 구현: 키보드가 켜져 있을 때만 툴바를 렌더링합니다. */}
        {isKeyboardVisible && <Toolbar editor={editor} />}
      </KeyboardAvoidingView>

      {!isKeyboardVisible && (
        <View style={styles.footer}>
          <View style={{ flex: 1 }} />
          <AppTouchableOpacity
            onPress={async () => {
              await performSave();
              router.push('/memo-editor');
            }}
          >
            <AddBigIcon width={40} height={40} color="#007AFF" />
          </AppTouchableOpacity>
        </View>
      )}

      <Modal visible={isMenuVisible} transparent animationType="fade">
        <AppTouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setMenuVisible(false)}
        >
          <View style={styles.menuPopup}>
            <AppTouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                updateMemo(currentIdRef.current, {
                  isPinned: !currentMemoState?.isPinned,
                });
                setMenuVisible(false);
              }}
            >
              <AppText>
                {currentMemoState?.isPinned ? '고정 해제' : '메모 고정'}
              </AppText>
            </AppTouchableOpacity>

            <AppTouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                updateMemo(currentIdRef.current, {
                  isLocked: !currentMemoState?.isLocked,
                });
                setMenuVisible(false);
              }}
            >
              <AppText>
                {currentMemoState?.isLocked ? '잠금 해제' : '메모 잠금'}
              </AppText>
            </AppTouchableOpacity>

            <AppTouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setMenuVisible(false);
                setIsSearchVisible(true);
              }}
            >
              <AppText>메모 안에서 찾기</AppText>
            </AppTouchableOpacity>

            <AppTouchableOpacity
              style={[styles.menuItem, { borderBottomWidth: 0 }]}
              onPress={() => {
                setMenuVisible(false);
                deleteMemo(currentIdRef.current);
                router.back();
              }}
            >
              <AppText style={{ color: 'red' }}>삭제</AppText>
            </AppTouchableOpacity>
          </View>
        </AppTouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    height: 50,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f2f3',
  },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  headerBtnText: { fontSize: 16, color: '#666' },
  saveBtnText: { color: '#007AFF', fontWeight: 'bold' },
  searchInput: { flex: 1, marginRight: 10, fontSize: 16, paddingVertical: 5 },
  keyboardContainer: { flex: 1 },

  footer: {
    flexDirection: 'row',
    padding: 15,
    borderTopWidth: 1,
    borderColor: '#f1f1f1',
    backgroundColor: '#fff',
    justifyContent: 'flex-end',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.1)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
  },
  menuPopup: {
    backgroundColor: 'white',
    marginTop: 55,
    marginRight: 15,
    width: 200,
    borderRadius: 12,
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  menuItem: { padding: 15, borderBottomWidth: 1, borderBottomColor: '#f1f1f1' },
});
