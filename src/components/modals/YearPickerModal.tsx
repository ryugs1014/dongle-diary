import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, Modal, Pressable } from 'react-native';
import AppText from '@/components/atoms/AppText';
import AppTouchableOpacity from '@/components/atoms/AppTouchableOpacity';
import WheelPicker from 'react-native-wheel-picker-expo';

interface YearPickerModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (year: string) => void;
  availableYears: string[];
  initialYear: string;
  isDark: boolean;
}

const ITEM_HEIGHT = 60;

export default function YearPickerModal({
  visible,
  onClose,
  onConfirm,
  availableYears,
  initialYear,
  isDark,
}: YearPickerModalProps) {
  const yearRef = useRef<any>(null);

  const [pickerKey, setPickerKey] = useState(Date.now());
  const [tempYear, setTempYear] = useState(initialYear);
  const [interacting, setInteracting] = useState(false);

  // 전달받은 연도 배열을 WheelPicker 포맷으로 변환
  const yearItems = availableYears.map((year) => ({
    label: year,
    value: year,
  }));

  useEffect(() => {
    if (visible && availableYears.length > 0) {
      // 초기 연도가 배열에 없으면 가장 첫 번째 연도로 안전하게 보정
      const safeYear = availableYears.includes(initialYear)
        ? initialYear
        : availableYears[0];

      setTempYear(safeYear);
      setPickerKey(Date.now());

      const targetIndex = availableYears.indexOf(safeYear);

      if (targetIndex !== -1) {
        setTimeout(() => {
          yearRef.current?.flatListRef?.current?.scrollToOffset({
            offset: targetIndex * ITEM_HEIGHT,
            animated: true,
          });
        }, 200);
      }
    }
  }, [visible, initialYear, availableYears]);

  const handleConfirm = () => {
    onConfirm(tempYear);
  };

  const scrollProps = {
    onScrollBeginDrag: () => setInteracting(true),
    onMomentumScrollBegin: () => setInteracting(true),
    onMomentumScrollEnd: () => setInteracting(false),
    onScrollEndDrag: (e: any) => {
      const velocity = e.nativeEvent.velocity?.y ?? 0;
      if (Math.abs(velocity) < 0.2) {
        setInteracting(false);
      }
    },
  };

  if (availableYears.length === 0) return null;

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
                flatListProps={scrollProps}
                renderItem={(props) => {
                  const isSelected = !interacting && props.label === tempYear;
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
          </View>

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
    width: 280, // 단일 휠이므로 넓이를 약간 줄였습니다
    backgroundColor: '#ffffff',
    borderRadius: 16,
    overflow: 'hidden',
    paddingTop: 24,
  },
  darkMenuBox: { backgroundColor: '#1e1e1e' },
  pickerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: ITEM_HEIGHT * 3,
    position: 'relative',
    marginBottom: 10,
    paddingHorizontal: 20,
    overflow: 'hidden',
  },
  pickerHighlight: {
    position: 'absolute',
    top: ITEM_HEIGHT,
    left: 20,
    right: 20,
    height: ITEM_HEIGHT,
    borderRadius: 100,
    zIndex: 10,
  },
  lightPickerHighlight: { backgroundColor: 'rgba(0,0,0,0.05)' },
  darkPickerHighlight: { backgroundColor: 'rgba(255,255,255,0.08)' },
  wheelWrapper: {
    width: '100%',
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
});
