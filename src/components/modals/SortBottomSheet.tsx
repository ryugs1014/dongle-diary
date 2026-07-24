import React from 'react';
import { View, Modal, StyleSheet } from 'react-native';
import AppTouchableOpacity from '@/components/atoms/AppTouchableOpacity';
import RadioSettingItem from '@/components/common/RadioSettingItem';

interface SortBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  sortOrder: 'desc' | 'asc';
  setSortOrder: (order: 'desc' | 'asc') => void;
  isDark: boolean;
}

export default function SortBottomSheet({
  visible,
  onClose,
  sortOrder,
  setSortOrder,
  isDark,
}: SortBottomSheetProps) {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <AppTouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View
          style={[styles.sortBottomSheet, isDark && styles.darkSortBottomSheet]}
        >
          <View style={styles.dragHandle} />

          <RadioSettingItem
            title="최신순"
            isSelected={sortOrder === 'desc'}
            isDark={isDark}
            onPress={() => {
              setSortOrder('desc');
              onClose();
            }}
          />

          <View
            style={[styles.sortDivider, isDark && styles.darkSortDivider]}
          />

          <RadioSettingItem
            title="과거순"
            isSelected={sortOrder === 'asc'}
            isDark={isDark}
            onPress={() => {
              setSortOrder('asc');
              onClose();
            }}
          />
        </View>
      </AppTouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sortBottomSheet: {
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
  darkSortBottomSheet: {
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
  sortDivider: {
    height: 1,
    backgroundColor: '#eee',
    marginHorizontal: 20,
  },
  darkSortDivider: {
    backgroundColor: '#333',
  },
});
