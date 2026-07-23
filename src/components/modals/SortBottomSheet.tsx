import React from 'react';
import { View, Modal, StyleSheet } from 'react-native';
import AppTouchableOpacity from '@/components/atoms/AppTouchableOpacity';
import AppText from '@/components/atoms/AppText';
import { Ionicons } from '@expo/vector-icons';

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

          <AppTouchableOpacity
            style={styles.sortOptionBtn}
            onPress={() => {
              setSortOrder('desc');
              onClose();
            }}
          >
            <AppText
              style={[
                styles.sortOptionText,
                isDark && styles.darkText,
                sortOrder === 'desc' && styles.selectedSortText,
              ]}
            >
              최신순
            </AppText>
            {sortOrder === 'desc' && (
              <View style={styles.checkIconWrapper}>
                <Ionicons name="checkmark" size={24} color="#FF6262" />
              </View>
            )}
          </AppTouchableOpacity>

          <View
            style={[styles.sortDivider, isDark && styles.darkSortDivider]}
          />

          <AppTouchableOpacity
            style={styles.sortOptionBtn}
            onPress={() => {
              setSortOrder('asc');
              onClose();
            }}
          >
            <AppText
              style={[
                styles.sortOptionText,
                isDark && styles.darkText,
                sortOrder === 'asc' && styles.selectedSortText,
              ]}
            >
              과거순
            </AppText>
            {sortOrder === 'asc' && (
              <View style={styles.checkIconWrapper}>
                <Ionicons name="checkmark" size={24} color="#FF6262" />
              </View>
            )}
          </AppTouchableOpacity>
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
  sortOptionBtn: {
    paddingVertical: 18,
    paddingHorizontal: 20,
    position: 'relative',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexDirection: 'row',
  },
  sortOptionText: {
    fontSize: 14,
    color: '#333',
  },
  darkText: {
    color: '#ffffff',
  },
  selectedSortText: {
    color: '#FF6262',
    fontWeight: 'bold',
  },
  checkIconWrapper: {
    position: 'absolute',
    right: 20,
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
