import React, { useEffect, useRef } from 'react';
import { View, Modal, StyleSheet, Animated, Dimensions } from 'react-native';
import { router } from 'expo-router'; // 🔥 라우팅을 위해 추가
import AppTouchableOpacity from '@/components/atoms/AppTouchableOpacity';
import AppText from '@/components/atoms/AppText';
import CustomSwitch from '@/components/common/CustomSwitch';
import {
  DayOnIcon,
  ZoomInIcon,
  FolderIcon, // 카테고리 관리용 임의 아이콘
  SettingIcon,
  ClockIcon,
  ZoomOutIcon,
  CalendarIcon, // 루틴 관리용 임의 아이콘
} from '@/assets/icons';

// 스토어 임포트
import { useChecklistStore } from '@/store/useChecklistStore';

interface ChecklistSettingsModalProps {
  visible: boolean;
  onClose: () => void;
  isDark: boolean;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function ChecklistSettingsModal({
  visible,
  onClose,
  isDark,
}: ChecklistSettingsModalProps) {
  const slideY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  // 스토어에서 직접 설정값과 변경 함수를 가져옵니다.
  const { showDateText, setShowDateText, isWeekView, setIsWeekView } =
    useChecklistStore();

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

  // 🔥 모달 닫기 애니메이션 후 특정 액션(페이지 이동 등)을 실행하는 함수
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

            {/* 🔥 최상단 가로형 메뉴 (카테고리 관리, 루틴 관리) */}
            <View style={styles.topActionsContainer}>
              <AppTouchableOpacity
                style={styles.topActionBtn}
                onPress={() =>
                  handleAction(() => router.push('/category-settings'))
                }
              >
                <FolderIcon
                  width={24}
                  height={24}
                  color={isDark ? '#ffffff' : '#111111'}
                />
                <AppText
                  style={[styles.topActionText, isDark && styles.darkText]}
                >
                  카테고리 관리
                </AppText>
              </AppTouchableOpacity>

              {/* 세로 구분선 */}
              <View
                style={[styles.verticalDivider, isDark && styles.darkDivider]}
              />

              <AppTouchableOpacity
                style={styles.topActionBtn}
                onPress={() =>
                  handleAction(() => router.push('/routine-settings'))
                }
              >
                <ClockIcon
                  width={24}
                  height={24}
                  color={isDark ? '#ffffff' : '#111111'}
                />
                <AppText
                  style={[styles.topActionText, isDark && styles.darkText]}
                >
                  루틴 관리
                </AppText>
              </AppTouchableOpacity>
            </View>

            {/* 상단 메뉴 아래 가로 구분선 */}
            <View style={[styles.divider, isDark && styles.darkDivider]} />

            {/* 1. 날짜 표시하기 설정 (기존) */}
            <AppTouchableOpacity
              style={styles.settingItem}
              activeOpacity={0.7}
              onPress={() => setShowDateText(!showDateText)}
            >
              <View style={styles.settingLeft}>
                <View style={styles.iconWrapper}>
                  <CalendarIcon
                    width={24}
                    height={24}
                    color={isDark ? '#777' : '#999'}
                  />
                </View>
                <AppText
                  style={[styles.settingTitle, isDark && styles.darkText]}
                >
                  날짜 표시
                </AppText>
              </View>
              <CustomSwitch
                value={showDateText}
                onValueChange={(val) => setShowDateText(val)}
                isDark={isDark}
              />
            </AppTouchableOpacity>

            {/* 2. 주간 달력 보기 설정 (기존) */}
            <AppTouchableOpacity
              style={styles.settingItem}
              activeOpacity={0.7}
              onPress={() => setIsWeekView(!isWeekView)}
            >
              <View style={styles.settingLeft}>
                <View style={styles.iconWrapper}>
                  {isWeekView ? (
                    <ZoomOutIcon
                      width={24}
                      height={24}
                      color={isDark ? '#777' : '#999'}
                    />
                  ) : (
                    <ZoomInIcon
                      width={24}
                      height={24}
                      color={isDark ? '#777' : '#999'}
                    />
                  )}
                </View>
                <AppText
                  style={[styles.settingTitle, isDark && styles.darkText]}
                >
                  간략한 달력 보기
                </AppText>
              </View>
              <CustomSwitch
                value={isWeekView}
                onValueChange={(val) => setIsWeekView(val)}
                isDark={isDark}
              />
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

  // 🔥 추가된 최상단 가로형 메뉴 스타일
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
  verticalDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#eee',
  },

  // 기존 설정 아이템 레이아웃 스타일
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    height: 52,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 24,
  },
  settingTitle: {
    fontSize: 16,
    color: '#333',
  },
  darkText: {
    color: '#fff',
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginHorizontal: 20,
    marginBottom: 8,
  },
  darkDivider: {
    backgroundColor: '#333',
  },
});
