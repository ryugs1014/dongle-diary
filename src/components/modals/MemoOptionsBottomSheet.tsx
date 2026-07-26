import React, { useEffect, useRef } from 'react';
import { View, Modal, StyleSheet, Animated, Dimensions } from 'react-native';
import AppTouchableOpacity from '@/components/atoms/AppTouchableOpacity';
import AppText from '@/components/atoms/AppText';

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
  onMove: () => void; // 🔥 이동(Move) 프롭스 추가
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
  onMove, // 🔥
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

            <AppTouchableOpacity
              style={styles.optionItem}
              onPress={() => handleAction(onTogglePin)}
            >
              <AppText style={[styles.optionText, isDark && styles.darkText]}>
                {memo.isPinned ? '고정 해제' : '고정'}
              </AppText>
            </AppTouchableOpacity>

            <View style={[styles.divider, isDark && styles.darkDivider]} />

            <AppTouchableOpacity
              style={styles.optionItem}
              onPress={() => handleAction(onToggleLock)}
            >
              <AppText style={[styles.optionText, isDark && styles.darkText]}>
                {memo.isLocked ? '잠금 해제' : '잠금'}
              </AppText>
            </AppTouchableOpacity>

            {/* 🔥 이동 버튼 추가 */}
            <View style={[styles.divider, isDark && styles.darkDivider]} />
            <AppTouchableOpacity
              style={styles.optionItem}
              onPress={() => handleAction(onMove)}
            >
              <AppText style={[styles.optionText, isDark && styles.darkText]}>
                이동
              </AppText>
            </AppTouchableOpacity>

            <View style={[styles.divider, isDark && styles.darkDivider]} />

            <AppTouchableOpacity
              style={styles.optionItem}
              onPress={() => handleAction(onDuplicate)}
            >
              <AppText style={[styles.optionText, isDark && styles.darkText]}>
                복제
              </AppText>
            </AppTouchableOpacity>

            <View style={[styles.divider, isDark && styles.darkDivider]} />

            <AppTouchableOpacity
              style={styles.optionItem}
              onPress={() => handleAction(onDelete)}
            >
              <AppText style={styles.deleteText}>삭제</AppText>
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
    marginBottom: 20,
  },
  optionItem: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
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
    color: '#FF3B30',
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginHorizontal: 20,
  },
  darkDivider: {
    backgroundColor: '#333',
  },
});
