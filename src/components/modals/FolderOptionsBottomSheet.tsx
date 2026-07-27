import React, { useEffect, useRef } from 'react';
import { View, Modal, StyleSheet, Animated, Dimensions } from 'react-native';
import AppTouchableOpacity from '@/components/atoms/AppTouchableOpacity';
import AppText from '@/components/atoms/AppText';

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

            <AppTouchableOpacity
              style={styles.optionItem}
              onPress={() => handleAction(onRename)}
            >
              <AppText style={[styles.optionText, isDark && styles.darkText]}>
                이름 변경
              </AppText>
            </AppTouchableOpacity>

            <View style={[styles.divider, isDark && styles.darkDivider]} />

            <AppTouchableOpacity
              style={styles.optionItem}
              onPress={() => handleAction(onTogglePin)}
            >
              <AppText style={[styles.optionText, isDark && styles.darkText]}>
                {folder.isPinned ? '고정 해제' : '고정'}
              </AppText>
            </AppTouchableOpacity>

            {!folder.isPinned && (
              <>
                <View style={[styles.divider, isDark && styles.darkDivider]} />

                <AppTouchableOpacity
                  style={styles.optionItem}
                  onPress={() => handleAction(onEditMode)}
                >
                  <AppText
                    style={[styles.optionText, isDark && styles.darkText]}
                  >
                    순서 변경
                  </AppText>
                </AppTouchableOpacity>
              </>
            )}

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
