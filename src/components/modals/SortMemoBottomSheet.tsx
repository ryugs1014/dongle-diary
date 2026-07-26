import React, { useEffect, useRef } from 'react';
import { View, Modal, StyleSheet, Animated, Dimensions } from 'react-native';
import AppTouchableOpacity from '@/components/atoms/AppTouchableOpacity';
import RadioSettingItem from '@/components/common/RadioSettingItem';

export type MemoSortType = 'dateDesc' | 'nameAsc' | 'nameDesc';

interface SortMemoBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  sortType: MemoSortType;
  setSortType: (type: MemoSortType) => void;
  isDark: boolean;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function SortMemoBottomSheet({
  visible,
  onClose,
  sortType,
  setSortType,
  isDark,
}: SortMemoBottomSheetProps) {
  // 바텀시트의 Y축 위치를 관리하는 Animated.Value
  const slideY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  // 열고 닫힐 때 하얀 시트만 애니메이션 처리
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

  // 닫기 버튼(또는 배경)을 눌렀을 때 자연스럽게 내려가고 모달 종료
  const handleClose = () => {
    Animated.timing(slideY, {
      toValue: SCREEN_HEIGHT,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
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
        {/* 🔥 하얀 시트 영역만 Animated.View로 감싸서 슬라이드 애니메이션 적용 */}
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
              isSelected={sortType === 'dateDesc'}
              isDark={isDark}
              onPress={() => {
                setSortType('dateDesc');
                handleClose();
              }}
            />

            <View
              style={[styles.sortDivider, isDark && styles.darkSortDivider]}
            />

            <RadioSettingItem
              title="이름순 (오름차순)"
              isSelected={sortType === 'nameAsc'}
              isDark={isDark}
              onPress={() => {
                setSortType('nameAsc');
                handleClose();
              }}
            />

            <View
              style={[styles.sortDivider, isDark && styles.darkSortDivider]}
            />

            <RadioSettingItem
              title="이름순 (내림차순)"
              isSelected={sortType === 'nameDesc'}
              isDark={isDark}
              onPress={() => {
                setSortType('nameDesc');
                handleClose();
              }}
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
