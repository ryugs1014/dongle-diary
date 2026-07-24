import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, Modal, Pressable } from 'react-native';
import AppText from '@/components/atoms/AppText';
import AppTouchableOpacity from '@/components/atoms/AppTouchableOpacity';
import WheelPicker from 'react-native-wheel-picker-expo';

interface YearMonthPickerModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (year: number, month: number) => void;
  onGoToToday: () => void;
  initialYear: number;
  initialMonth: number;
  isDark: boolean;
}

const ITEM_HEIGHT = 60;

//  현재 연도를 기준으로 과거 5년(60개월), 미래 1년(12개월) 범위 생성
const currentYear = new Date().getFullYear();
const MIN_YEAR = currentYear - 5;
const MAX_YEAR = currentYear + 1;

const yearItems = Array.from({ length: MAX_YEAR - MIN_YEAR + 1 }, (_, i) => ({
  label: String(MIN_YEAR + i),
  value: String(MIN_YEAR + i),
}));

// 월은 1부터 12까지 생성합니다.
const monthItems = Array.from({ length: 12 }, (_, i) => ({
  label: String(i + 1),
  value: String(i + 1),
}));

export default function YearMonthPickerModal({
  visible,
  onClose,
  onConfirm,
  onGoToToday,
  initialYear,
  initialMonth,
  isDark,
}: YearMonthPickerModalProps) {
  const yearRef = useRef<any>(null);
  const monthRef = useRef<any>(null);

  const [pickerKey, setPickerKey] = useState(Date.now());
  const [tempYear, setTempYear] = useState(String(initialYear));
  const [tempMonth, setTempMonth] = useState(String(initialMonth));

  const [interacting, setInteracting] = useState({
    year: false,
    month: false,
  });

  useEffect(() => {
    if (visible) {
      // 혹시라도 범위를 벗어난 연도가 들어올 경우를 대비해 최소/최대값 내로 안전하게 보정
      const boundedYear = Math.max(MIN_YEAR, Math.min(MAX_YEAR, initialYear));

      setTempYear(String(boundedYear));
      setTempMonth(String(initialMonth));
      setPickerKey(Date.now());

      // 보정된 연도를 기준으로 목표 인덱스 계산
      const targetYearIndex = boundedYear - MIN_YEAR;
      const targetMonthIndex = initialMonth - 1;

      setTimeout(() => {
        yearRef.current?.flatListRef?.current?.scrollToOffset({
          offset: targetYearIndex * ITEM_HEIGHT,
          animated: true,
        });
      }, 200);

      setTimeout(() => {
        monthRef.current?.flatListRef?.current?.scrollToOffset({
          offset: targetMonthIndex * ITEM_HEIGHT,
          animated: true,
        });
      }, 200);
    }
  }, [visible, initialYear, initialMonth]);

  const handleConfirm = () => {
    onConfirm(parseInt(tempYear, 10), parseInt(tempMonth, 10));
  };

  const createScrollProps = (key: 'year' | 'month') => ({
    onScrollBeginDrag: () =>
      setInteracting((prev) => ({ ...prev, [key]: true })),
    onMomentumScrollBegin: () =>
      setInteracting((prev) => ({ ...prev, [key]: true })),
    onMomentumScrollEnd: () =>
      setInteracting((prev) => ({ ...prev, [key]: false })),
    onScrollEndDrag: (e: any) => {
      const velocity = e.nativeEvent.velocity?.y ?? 0;
      if (Math.abs(velocity) < 0.2) {
        setInteracting((prev) => ({ ...prev, [key]: false }));
      }
    },
  });

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.alertOverlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        <View
          style={[styles.alertBox, isDark && styles.darkMenuBox]}
          key={pickerKey}
        >
          <View style={styles.pickerContainer}>
            <View
              style={[
                styles.pickerHighlight,
                isDark
                  ? styles.darkPickerHighlight
                  : styles.lightPickerHighlight,
              ]}
              pointerEvents="none"
            />

            {/* 연도 피커 (숫자만 표시) */}
            <View style={styles.wheelWrapper}>
              <WheelPicker
                ref={yearRef}
                initialSelectedIndex={0} // 애니메이션을 위해 0부터 시작
                items={yearItems}
                onChange={({ item }) => setTempYear(item.value)}
                height={ITEM_HEIGHT * 5}
                itemHeight={ITEM_HEIGHT}
                backgroundColor={isDark ? '#1e1e1e' : '#ffffff'}
                selectedStyle={{ borderWidth: 0 }}
                haptics={true}
                flatListProps={createScrollProps('year')}
                renderItem={(props) => {
                  const isSelected =
                    !interacting.year && props.label === tempYear;
                  return (
                    <AppText
                      style={[
                        styles.pickerText,
                        {
                          color: isDark
                            ? isSelected
                              ? '#FFFFFF'
                              : '#666666'
                            : isSelected
                              ? '#333333'
                              : '#999999',
                        },
                      ]}
                    >
                      {props.label}
                    </AppText>
                  );
                }}
              />
            </View>

            {/* 월 피커 (숫자 + 월 표시) */}
            <View style={styles.wheelWrapper}>
              <WheelPicker
                ref={monthRef}
                initialSelectedIndex={0}
                items={monthItems}
                onChange={({ item }) => setTempMonth(item.value)}
                height={ITEM_HEIGHT * 5}
                itemHeight={ITEM_HEIGHT}
                backgroundColor={isDark ? '#1e1e1e' : '#ffffff'}
                selectedStyle={{ borderWidth: 0 }}
                haptics={true}
                flatListProps={createScrollProps('month')}
                renderItem={(props) => {
                  const isSelected =
                    !interacting.month && props.label === tempMonth;
                  return (
                    <AppText
                      style={[
                        styles.pickerText,
                        {
                          color: isDark
                            ? isSelected
                              ? '#FFFFFF'
                              : '#666666'
                            : isSelected
                              ? '#333333'
                              : '#999999',
                        },
                      ]}
                    >
                      {props.label ? `${props.label}월` : ''}
                    </AppText>
                  );
                }}
              />
            </View>
          </View>

          <AppTouchableOpacity
            style={styles.todayActionBtn}
            onPress={onGoToToday}
          >
            <AppText style={[styles.todayActionBtnText]}>
              오늘 날짜로 이동
            </AppText>
          </AppTouchableOpacity>

          <View style={[styles.alertButtons, isDark && styles.darkMenuItem]}>
            <AppTouchableOpacity style={styles.alertBtn} onPress={onClose}>
              <AppText
                style={[
                  styles.alertBtnText,
                  { color: isDark ? '#ffffff' : '#666666' },
                ]}
              >
                취소
              </AppText>
            </AppTouchableOpacity>

            <AppTouchableOpacity
              style={[
                styles.alertBtn,
                {
                  borderLeftWidth: 1,
                  borderColor: isDark ? '#333333' : '#eeeeee',
                },
              ]}
              onPress={handleConfirm}
            >
              <AppText style={[styles.alertBtnText, { color: '#FF6262' }]}>
                확인
              </AppText>
            </AppTouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  alertOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertBox: {
    width: 300,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    overflow: 'hidden',
    paddingTop: 24,
  },
  darkMenuBox: { backgroundColor: '#1e1e1e' },
  pickerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    height: ITEM_HEIGHT * 3, // 화면에 보여줄 높이 조정
    position: 'relative',
    marginBottom: 10,
    paddingHorizontal: 20,
    overflow: 'hidden',
  },
  pickerHighlight: {
    position: 'absolute',
    top: ITEM_HEIGHT, // 중간 아이템 하이라이트 위치
    left: 20,
    right: 20,
    height: ITEM_HEIGHT,
    borderRadius: 100,
    zIndex: 10,
  },
  lightPickerHighlight: { backgroundColor: 'rgba(0,0,0,0.05)' },
  darkPickerHighlight: { backgroundColor: 'rgba(255,255,255,0.08)' },
  wheelWrapper: {
    flex: 1,
    alignItems: 'center',
  },
  pickerText: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  alertButtons: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderColor: '#eeeeee',
    marginTop: 10,
  },
  darkMenuItem: { borderTopColor: '#333333' },
  alertBtn: { flex: 1, paddingVertical: 20, alignItems: 'center' },
  alertBtnText: { fontSize: 16, fontWeight: 'bold' },
  todayActionBtn: {
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 5,
  },
  todayActionBtnText: {
    color: '#555',
    fontSize: 13,
    fontWeight: 'bold',
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderColor: '#555',
  },
});
