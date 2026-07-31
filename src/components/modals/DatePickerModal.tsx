import React, { useState, useRef, useEffect, useMemo } from 'react';
import { View, StyleSheet, Modal, Pressable } from 'react-native';
import AppText from '@/components/atoms/AppText';
import AppTouchableOpacity from '@/components/atoms/AppTouchableOpacity';
import WheelPicker from 'react-native-wheel-picker-expo';

interface DatePickerModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (year: number, month: number, day: number) => void;
  onGoToToday: () => void;
  initialYear: number;
  initialMonth: number;
  initialDay: number;
  isDark: boolean;
  hideYear?: boolean;
}

const ITEM_HEIGHT = 60;

// 현재 연도를 기준으로 과거 5년, 미래 1년 생성
const currentYear = new Date().getFullYear();
const MIN_YEAR = currentYear - 5;
const MAX_YEAR = currentYear + 1;

const yearItems = Array.from({ length: MAX_YEAR - MIN_YEAR + 1 }, (_, i) => ({
  label: String(MIN_YEAR + i),
  value: String(MIN_YEAR + i),
}));

const monthItems = Array.from({ length: 12 }, (_, i) => ({
  label: String(i + 1),
  value: String(i + 1),
}));

export default function DatePickerModal({
  visible,
  onClose,
  onConfirm,
  onGoToToday,
  initialYear,
  initialMonth,
  initialDay,
  isDark,
  hideYear = false,
}: DatePickerModalProps) {
  const yearRef = useRef<any>(null);
  const monthRef = useRef<any>(null);
  const dayRef = useRef<any>(null);

  // 💡 [핵심] 모달이 닫히는 애니메이션 도중에 UI가 변하는 것을 막기 위해
  // visible이 true일 때의 상태를 기억하고, 닫힐 때(false)는 기억해둔 상태를 사용합니다.
  const prevHideYearRef = useRef(hideYear);
  if (visible) {
    prevHideYearRef.current = hideYear;
  }
  const displayHideYear = visible ? hideYear : prevHideYearRef.current;

  const [pickerKey, setPickerKey] = useState(Date.now());
  const [tempYear, setTempYear] = useState(String(initialYear));
  const [tempMonth, setTempMonth] = useState(String(initialMonth));
  const [tempDay, setTempDay] = useState(String(initialDay));

  const [interacting, setInteracting] = useState({
    year: false,
    month: false,
    day: false,
  });

  // 선택된 연, 월에 따라 '일' 리스트를 동적으로 계산
  const dayItems = useMemo(() => {
    // 💡 화면에 표시할 displayHideYear 기준으로 윤년 보정
    const y = displayHideYear ? 2024 : parseInt(tempYear, 10) || initialYear;
    const m = parseInt(tempMonth, 10) || initialMonth;
    const daysInMonth = new Date(y, m, 0).getDate();

    return Array.from({ length: daysInMonth }, (_, i) => ({
      label: String(i + 1),
      value: String(i + 1),
    }));
  }, [tempYear, tempMonth, initialYear, initialMonth, displayHideYear]);

  // 연/월이 바뀌어서 일이 최대 범위를 벗어날 경우 보정
  useEffect(() => {
    const maxDay = dayItems.length;
    if (parseInt(tempDay, 10) > maxDay) {
      setTempDay(String(maxDay));
    }
  }, [dayItems.length, tempDay]);

  useEffect(() => {
    if (visible) {
      const boundedYear = Math.max(MIN_YEAR, Math.min(MAX_YEAR, initialYear));
      const daysInMonth = new Date(boundedYear, initialMonth, 0).getDate();
      const boundedDay = Math.min(initialDay, daysInMonth);

      setTempYear(String(boundedYear));
      setTempMonth(String(initialMonth));
      setTempDay(String(boundedDay));
      setPickerKey(Date.now());

      const targetYearIndex = boundedYear - MIN_YEAR;
      const targetMonthIndex = initialMonth - 1;
      const targetDayIndex = boundedDay - 1;

      if (!displayHideYear) {
        setTimeout(() => {
          yearRef.current?.flatListRef?.current?.scrollToOffset({
            offset: targetYearIndex * ITEM_HEIGHT,
            animated: true,
          });
        }, 200);
      }

      setTimeout(() => {
        monthRef.current?.flatListRef?.current?.scrollToOffset({
          offset: targetMonthIndex * ITEM_HEIGHT,
          animated: true,
        });
      }, 200);

      setTimeout(() => {
        dayRef.current?.flatListRef?.current?.scrollToOffset({
          offset: targetDayIndex * ITEM_HEIGHT,
          animated: true,
        });
      }, 200);
    }
  }, [visible, initialYear, initialMonth, initialDay, displayHideYear]);

  const handleConfirm = () => {
    onConfirm(
      parseInt(tempYear, 10),
      parseInt(tempMonth, 10),
      parseInt(tempDay, 10),
    );
  };

  const createScrollProps = (key: 'year' | 'month' | 'day') => ({
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
          style={[
            styles.alertBox,
            isDark && styles.darkMenuBox,
            displayHideYear && { width: 280 }, // 👈 displayHideYear 사용
          ]}
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

            {/* 연도 피커 (displayHideYear가 false일 때만 렌더링) */}
            {!displayHideYear && (
              <View style={styles.wheelWrapper}>
                <WheelPicker
                  ref={yearRef}
                  initialSelectedIndex={0}
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
            )}

            {/* 월 피커 */}
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

            {/* 일 피커 */}
            <View style={styles.wheelWrapper}>
              <WheelPicker
                ref={dayRef}
                initialSelectedIndex={0}
                items={dayItems}
                onChange={({ item }) => setTempDay(item.value)}
                height={ITEM_HEIGHT * 5}
                itemHeight={ITEM_HEIGHT}
                backgroundColor={isDark ? '#1e1e1e' : '#ffffff'}
                selectedStyle={{ borderWidth: 0 }}
                haptics={true}
                flatListProps={createScrollProps('day')}
                renderItem={(props) => {
                  const isSelected =
                    !interacting.day && props.label === tempDay;
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
                      {props.label ? `${props.label}일` : ''}
                    </AppText>
                  );
                }}
              />
            </View>
          </View>

          {/* 오늘 날짜로 이동 버튼 (displayHideYear가 false일 때만 렌더링) */}
          {!displayHideYear && (
            <AppTouchableOpacity
              style={styles.todayActionBtn}
              onPress={onGoToToday}
            >
              <AppText style={[styles.todayActionBtnText]}>
                오늘 날짜로 이동
              </AppText>
            </AppTouchableOpacity>
          )}

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
    width: 320,
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
    height: ITEM_HEIGHT * 3,
    position: 'relative',
    marginBottom: 10,
    paddingHorizontal: 10,
    overflow: 'hidden',
  },
  pickerHighlight: {
    position: 'absolute',
    top: ITEM_HEIGHT,
    left: 10,
    right: 10,
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
