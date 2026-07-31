import React, { useEffect, useRef } from 'react';
import { View, Modal, StyleSheet, Animated, Dimensions } from 'react-native';
import AppTouchableOpacity from '@/components/atoms/AppTouchableOpacity';
import AppText from '@/components/atoms/AppText';
import {
  DragIcon,
  TrashIcon,
  FolderIcon,
  PinIcon,
  PinUnsetIcon,
} from '@/assets/icons';
import Toast from 'react-native-toast-message';

interface FolderOptionsBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  folder: { id: string; name: string; isPinned: boolean } | null;
  onRename: () => void;
  onTogglePin: () => void;
  onEditMode: () => void;
  onDelete: () => void;
  isDark: boolean;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function FolderOptionsBottomSheet({
  visible,
  onClose,
  folder,
  onRename,
  onTogglePin,
  onEditMode,
  onDelete,
  isDark,
}: FolderOptionsBottomSheetProps) {
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

  if (!folder) return null;

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

            {/* 🔥 최상단 가로형 메뉴 (순서 변경, 삭제) */}
            <View style={styles.topActionsContainer}>
              <AppTouchableOpacity
                style={[
                  styles.topActionBtn,
                  folder.isPinned && { opacity: 0.2 },
                ]}
                onPress={() => {
                  if (folder.isPinned) {
                    // 💡 모달을 먼저 닫고 전역 토스트를 호출하여 원래 디자인 유지
                    Animated.timing(slideY, {
                      toValue: SCREEN_HEIGHT,
                      duration: 250,
                      useNativeDriver: true,
                    }).start(() => {
                      onClose();
                      Toast.show({
                        type: 'error',
                        text1: '고정된 항목은 순서 변경이 안 됩니다.',
                        position: 'top',
                        topOffset: 60,
                      });
                    });
                    return;
                  }
                  handleAction(onEditMode);
                }}
              >
                <DragIcon
                  width={24}
                  height={24}
                  color={isDark ? '#ffffff' : '#111111'}
                />
                <AppText
                  style={[styles.topActionText, isDark && styles.darkText]}
                >
                  순서 변경
                </AppText>
              </AppTouchableOpacity>

              {/* 세로 구분선 */}
              <View
                style={[styles.verticalDivider, isDark && styles.darkDivider]}
              />

              <AppTouchableOpacity
                style={styles.topActionBtn}
                onPress={() => handleAction(onDelete)}
              >
                <TrashIcon width={24} height={24} color="#FF6262" />
                <AppText style={styles.deleteText}>삭제</AppText>
              </AppTouchableOpacity>
            </View>

            {/* 🔥 상단 메뉴 아래 구분선 */}
            <View style={[styles.divider, isDark && styles.darkDivider]} />

            {/* 나머지 세로형 메뉴들 */}
            <AppTouchableOpacity
              style={styles.optionItem}
              onPress={() => handleAction(onRename)}
            >
              <FolderIcon
                width={24}
                height={24}
                color={isDark ? '#ffffff' : '#111111'}
              />
              <AppText style={[styles.optionText, isDark && styles.darkText]}>
                폴더 이름 변경
              </AppText>
            </AppTouchableOpacity>

            <AppTouchableOpacity
              style={styles.optionItem}
              onPress={() => handleAction(onTogglePin)}
            >
              {folder.isPinned ? (
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
                {folder.isPinned ? '고정 해제' : '폴더 고정'}
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
    // elevation: 10,
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
    fontSize: 16,
    color: '#111',
    fontWeight: '500',
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 16,
  },
  optionText: {
    fontSize: 16,
    color: '#111',
  },
  darkText: {
    color: '#fff',
  },
  deleteText: {
    fontSize: 16,
    color: '#FF6262',
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
