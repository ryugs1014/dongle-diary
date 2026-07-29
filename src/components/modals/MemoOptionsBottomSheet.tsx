import React, { useEffect, useRef } from 'react';
import { View, Modal, StyleSheet, Animated, Dimensions } from 'react-native';
import AppTouchableOpacity from '@/components/atoms/AppTouchableOpacity';
import AppText from '@/components/atoms/AppText';
// 💡 BackIcon 임포트 추가 (경로는 기존 설정에 맞게 유지)
import {
  FolderIcon,
  TrashIcon,
  PinIcon,
  PinUnsetIcon,
  LockIcon,
  CopyIcon,
} from '@/assets/icons';

interface MemoOptionsBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  memo: {
    id: string;
    title: string;
    isPinned: boolean;
    isLocked: boolean;
  } | null;
  onTogglePin: () => void;
  onToggleLock: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onMove: () => void;
  isDark: boolean;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function MemoOptionsBottomSheet({
  visible,
  onClose,
  memo,
  onTogglePin,
  onToggleLock,
  onDuplicate,
  onDelete,
  onMove,
  isDark,
}: MemoOptionsBottomSheetProps) {
  const slideY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideY, {
        toValue: 0,
        tension: 60,
        friction: 10,
        useNativeDriver: true,
      }).start();
    } else {
      slideY.setValue(SCREEN_HEIGHT);
    }
  }, [visible, slideY]);

  const handleClose = () => {
    Animated.timing(slideY, {
      toValue: SCREEN_HEIGHT,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      onClose();
    });
  };

  const handleAction = (action: () => void) => {
    Animated.timing(slideY, {
      toValue: SCREEN_HEIGHT,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      action();
      onClose();
    });
  };

  if (!memo) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <AppTouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={handleClose}
      >
        <Animated.View
          style={[
            styles.bottomSheet,
            isDark && styles.darkBottomSheet,
            { transform: [{ translateY: slideY }] },
          ]}
        >
          <AppTouchableOpacity activeOpacity={1} style={{ width: '100%' }}>
            <View style={styles.dragHandle} />

            {/* 🔥 최상단 가로형 메뉴 (이동, 삭제) */}
            <View style={styles.topActionsContainer}>
              <AppTouchableOpacity
                style={styles.topActionBtn}
                onPress={() => handleAction(onMove)}
              >
                <FolderIcon
                  width={24}
                  height={24}
                  color={isDark ? '#ffffff' : '#111111'}
                />
                <AppText
                  style={[styles.topActionText, isDark && styles.darkText]}
                >
                  이동
                </AppText>
              </AppTouchableOpacity>

              {/* 세로 구분선 (선택사항, 깔끔한 구분을 위해 추가) */}
              <View
                style={[styles.verticalDivider, isDark && styles.darkDivider]}
              />

              <AppTouchableOpacity
                style={styles.topActionBtn}
                onPress={() => handleAction(onDelete)}
              >
                <TrashIcon width={24} height={24} color="#FF3B30" />
                <AppText style={styles.deleteText}>삭제</AppText>
              </AppTouchableOpacity>
            </View>

            {/* 🔥 상단 메뉴 아래 구분선 */}
            <View style={[styles.divider, isDark && styles.darkDivider]} />

            {/* 나머지 세로형 메뉴들 */}
            <AppTouchableOpacity
              style={styles.optionItem}
              onPress={() => handleAction(onTogglePin)}
            >
              {memo.isPinned ? (
                <PinIcon
                  width={24}
                  height={24}
                  color={isDark ? '#ffffff' : '#111111'}
                />
              ) : (
                <PinUnsetIcon
                  width={24}
                  height={24}
                  color={isDark ? '#ffffff' : '#111111'}
                />
              )}

              <AppText style={[styles.optionText, isDark && styles.darkText]}>
                {memo.isPinned ? '고정 해제' : '메모 고정'}
              </AppText>
            </AppTouchableOpacity>

            <AppTouchableOpacity
              style={styles.optionItem}
              onPress={() => handleAction(onToggleLock)}
            >
              <LockIcon
                width={24}
                height={24}
                color={isDark ? '#ffffff' : '#111111'}
              />

              <AppText style={[styles.optionText, isDark && styles.darkText]}>
                {memo.isLocked ? '잠금 해제' : '메모 잠금'}
              </AppText>
            </AppTouchableOpacity>

            <AppTouchableOpacity
              style={styles.optionItem}
              onPress={() => handleAction(onDuplicate)}
            >
              <CopyIcon
                width={24}
                height={24}
                color={isDark ? '#ffffff' : '#111111'}
              />
              <AppText style={[styles.optionText, isDark && styles.darkText]}>
                메모 복제
              </AppText>
            </AppTouchableOpacity>
          </AppTouchableOpacity>
        </Animated.View>
      </AppTouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  bottomSheet: {
    width: '100%',
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingBottom: 40,
    elevation: 10,
    shadowColor: '#191919',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  darkBottomSheet: {
    backgroundColor: '#191919',
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#ddd',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 10,
  },
  /* 🔥 상단 가로형 메뉴 스타일 */
  topActionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  topActionBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  topActionText: {
    fontSize: 14,
    color: '#111',
    fontWeight: '500',
  },
  /* 🔥 세로형 메뉴 스타일 (아이콘과 텍스트 정렬) */
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 16,
  },
  optionText: {
    fontSize: 14,
    color: '#111',
  },
  darkText: {
    color: '#fff',
  },
  deleteText: {
    fontSize: 14,
    color: '#FF3B30',
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginHorizontal: 20,
    marginBottom: 8,
  },
  verticalDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#eee',
  },
  darkDivider: {
    backgroundColor: '#333',
  },
});
