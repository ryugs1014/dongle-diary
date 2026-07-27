import React, { useEffect, useRef } from 'react';
import { View, Modal, StyleSheet, Animated, Dimensions } from 'react-native';
import AppTouchableOpacity from '@/components/atoms/AppTouchableOpacity';
import RadioSettingItem from '@/components/common/RadioSettingItem';

interface SortBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  sortOrder: 'desc' | 'asc';
  setSortOrder: (order: 'desc' | 'asc') => void;
  isDark: boolean;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function SortBottomSheet({
  visible,
  onClose,
  sortOrder,
  setSortOrder,
  isDark,
}: SortBottomSheetProps) {
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

  const handleSort = (order: 'desc' | 'asc') => {
    Animated.timing(slideY, {
      toValue: SCREEN_HEIGHT,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setSortOrder(order);
      onClose();
    });
  };

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
            styles.sortBottomSheet,
            isDark && styles.darkSortBottomSheet,
            { transform: [{ translateY: slideY }] },
          ]}
        >
          {/* 하단 시트 클릭 시 모달이 닫히지 않도록 이벤트 전파 차단 */}
          <AppTouchableOpacity activeOpacity={1} style={{ width: '100%' }}>
            <View style={styles.dragHandle} />

            <RadioSettingItem
              title="최근 날짜순"
              isSelected={sortOrder === 'desc'}
              isDark={isDark}
              onPress={() => handleSort('desc')}
            />

            <View
              style={[styles.sortDivider, isDark && styles.darkSortDivider]}
            />

            <RadioSettingItem
              title="오래된 날짜순"
              isSelected={sortOrder === 'asc'}
              isDark={isDark}
              onPress={() => handleSort('asc')}
            />
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
    backgroundColor: 'rgba(0,0,0,0.4)', // 다른 모달과 통일감을 위해 추가
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
