import React, { useEffect, useRef } from 'react';
import { View, Modal, StyleSheet, Animated, Dimensions } from 'react-native';
import AppTouchableOpacity from '@/components/atoms/AppTouchableOpacity';
import RadioSettingItem from '@/components/common/RadioSettingItem';

export type MemoSearchSortType =
  'dateDesc' | 'dateAsc' | 'nameAsc' | 'nameDesc';

interface SortMemoSearchBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  sortType: MemoSearchSortType;
  setSortType: (type: MemoSearchSortType) => void;
  isDark: boolean;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function SortMemoSearchBottomSheet({
  visible,
  onClose,
  sortType,
  setSortType,
  isDark,
}: SortMemoSearchBottomSheetProps) {
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

  const handleSort = (type: MemoSearchSortType) => {
    Animated.timing(slideY, {
      toValue: SCREEN_HEIGHT,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setSortType(type);
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
          <AppTouchableOpacity activeOpacity={1} style={{ width: '100%' }}>
            <View style={styles.dragHandle} />

            <RadioSettingItem
              title="최근 날짜순"
              isSelected={sortType === 'dateDesc'}
              isDark={isDark}
              onPress={() => handleSort('dateDesc')}
            />
            <View
              style={[styles.sortDivider, isDark && styles.darkSortDivider]}
            />

            <RadioSettingItem
              title="오래된 날짜순"
              isSelected={sortType === 'dateAsc'}
              isDark={isDark}
              onPress={() => handleSort('dateAsc')}
            />
            <View
              style={[styles.sortDivider, isDark && styles.darkSortDivider]}
            />

            <RadioSettingItem
              title="이름순 (오름차순)"
              isSelected={sortType === 'nameAsc'}
              isDark={isDark}
              onPress={() => handleSort('nameAsc')}
            />
            <View
              style={[styles.sortDivider, isDark && styles.darkSortDivider]}
            />

            <RadioSettingItem
              title="이름순 (내림차순)"
              isSelected={sortType === 'nameDesc'}
              isDark={isDark}
              onPress={() => handleSort('nameDesc')}
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
    backgroundColor: 'rgba(0,0,0,0.4)',
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
