import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Modal,
  Keyboard,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import AppText from '@/components/atoms/AppText';
import AppTouchableOpacity from '@/components/atoms/AppTouchableOpacity';
import AppTextInput from '@/components/atoms/AppTextInput';
import SvgDashedLine from '@/components/ui/SvgDashedLine';
import DatePickerModal from '@/components/modals/DatePickerModal';
import AppToast, { AppToastRef } from '@/components/common/CustomToast';

import { AlertInfoIcon, CloseIcon, DeleteIcon } from '@/assets/icons';
import {
  useChecklistStore,
  Routine,
  RepeatType,
} from '@/store/useChecklistStore';

const WEEK_DAYS = [
  { label: '일', value: 0 },
  { label: '월', value: 1 },
  { label: '화', value: 2 },
  { label: '수', value: 3 },
  { label: '목', value: 4 },
  { label: '금', value: 5 },
  { label: '토', value: 6 },
];
const MONTH_DAYS = Array.from({ length: 31 }, (_, i) => i + 1);

const ROUTINE_PLACEHOLDERS = [
  '매일 아침 물 한잔 마시기',
  '영양제 챙겨 먹기',
  '가벼운 10분 스트레칭',
  '잠들기 전 일기 쓰기',
  '오늘의 감사한 일 생각하기',
  '가족에게 안부 연락하기',
];

interface RoutineDetailModalProps {
  visible: boolean;
  onClose: () => void;
  initialRoutine: Routine | null;
  isDark: boolean;
}

export default function RoutineDetailModal({
  visible,
  onClose,
  initialRoutine,
  isDark,
}: RoutineDetailModalProps) {
  const { categories, addRoutine, updateRoutine } = useChecklistStore();

  // 폼 상태
  const [text, setText] = useState('');
  const [selectedCatIds, setSelectedCatIds] = useState<string[]>([]);
  const [repeatType, setRepeatType] = useState<RepeatType>('daily');
  const [startDate, setStartDate] = useState(
    new Date().toISOString().split('T')[0],
  );
  const [endDate, setEndDate] = useState<string | null>(null);
  const [repeatDaysOfWeek, setRepeatDaysOfWeek] = useState<number[]>([]);
  const [repeatDaysOfMonth, setRepeatDaysOfMonth] = useState<number[]>([]);
  const [repeatDatesOfYear, setRepeatDatesOfYear] = useState<
    { month: number; day: number }[]
  >([]);

  const [randomPlaceholder, setRandomPlaceholder] = useState(
    ROUTINE_PLACEHOLDERS[0],
  );

  // DatePicker 상태
  const [datePickerTarget, setDatePickerTarget] = useState<
    'start' | 'end' | 'yearly' | null
  >(null);

  const toastRef = useRef<AppToastRef>(null);

  useEffect(() => {
    if (visible) {
      const randomIndex = Math.floor(
        Math.random() * ROUTINE_PLACEHOLDERS.length,
      );
      setRandomPlaceholder(ROUTINE_PLACEHOLDERS[randomIndex]);

      if (initialRoutine) {
        setText(initialRoutine.text);
        setSelectedCatIds(initialRoutine.categoryIds);
        setRepeatType(initialRoutine.repeatType);
        setStartDate(initialRoutine.startDate);
        setEndDate(initialRoutine.endDate);
        setRepeatDaysOfWeek(initialRoutine.repeatDaysOfWeek || []);
        setRepeatDaysOfMonth(initialRoutine.repeatDaysOfMonth || []);
        setRepeatDatesOfYear(initialRoutine.repeatDatesOfYear || []);
      } else {
        setText('');
        setSelectedCatIds(categories.length > 0 ? [categories[0].id] : []);
        setRepeatType('daily');
        setStartDate(new Date().toISOString().split('T')[0]);
        setEndDate(null);
        setRepeatDaysOfWeek([]);
        setRepeatDaysOfMonth([]);
        setRepeatDatesOfYear([]);
      }
    }
  }, [visible, initialRoutine, categories]);

  const toggleArrayItem = (
    arr: any[],
    val: any,
    setArr: (val: any[]) => void,
  ) => {
    if (arr.includes(val)) setArr(arr.filter((x) => x !== val));
    else setArr([...arr, val]);
  };

  const removeYearlyDate = (month: number, day: number) => {
    setRepeatDatesOfYear(
      repeatDatesOfYear.filter((x) => x.month !== month || x.day !== day),
    );
  };

  const handleConfirmDate = (year: number, month: number, day: number) => {
    const formatted = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    if (datePickerTarget === 'start') setStartDate(formatted);
    if (datePickerTarget === 'end') setEndDate(formatted);
    if (datePickerTarget === 'yearly') {
      const exists = repeatDatesOfYear.some(
        (x) => x.month === month && x.day === day,
      );
      if (!exists) setRepeatDatesOfYear([...repeatDatesOfYear, { month, day }]);
    }
    setDatePickerTarget(null);
  };

  const getInitialDatePickerValues = () => {
    const defaultDate = new Date().toISOString().split('T')[0];
    const targetDateStr =
      datePickerTarget === 'start'
        ? startDate
        : datePickerTarget === 'end' && endDate
          ? endDate
          : defaultDate;

    return {
      year: parseInt(targetDateStr.split('-')[0], 10),
      month: parseInt(targetDateStr.split('-')[1], 10),
      day: parseInt(targetDateStr.split('-')[2], 10),
    };
  };

  const handleSaveModal = () => {
    const trimmed = text.trim();
    if (!trimmed) {
      toastRef.current?.show('루틴 내용이 없어요');
      return;
    }
    if (selectedCatIds.length === 0) {
      toastRef.current?.show('카테고리를 하나 이상 선택해주세요');
      return;
    }

    const routineData: Routine = {
      id: initialRoutine ? initialRoutine.id : Date.now().toString(),
      text: trimmed,
      categoryIds: selectedCatIds,
      startDate,
      endDate,
      repeatType,
      repeatDaysOfWeek: repeatType === 'weekly' ? repeatDaysOfWeek : undefined,
      repeatDaysOfMonth:
        repeatType === 'monthly' ? repeatDaysOfMonth : undefined,
      repeatDatesOfYear:
        repeatType === 'yearly' ? repeatDatesOfYear : undefined,
      isActive: true,
    };

    if (initialRoutine) updateRoutine(initialRoutine.id, routineData);
    else addRoutine(routineData);

    onClose();

    // 부모 화면(혹은 다음 화면)에서 필요하다면 유지하되 모달 내부에서는 수작업 토스트 완료
  };

  const pickerInitVals = getInitialDatePickerValues();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView
        style={{ flex: 1, backgroundColor: isDark ? '#111' : '#FCFBFA' }}
      >
        <View style={styles.modalHeader}>
          <AppTouchableOpacity onPress={onClose}>
            <CloseIcon
              width={28}
              height={28}
              color={isDark ? '#ffffff' : '#111111'}
            />
          </AppTouchableOpacity>
          <AppText style={[styles.modalTitle, isDark && styles.darkText]}>
            {initialRoutine ? '루틴 수정' : '새 루틴 추가'}
          </AppText>
          <View style={styles.rightWrapper}></View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 150 }}
        >
          <AppText style={[styles.label, isDark && styles.darkText]}>
            루틴 제목
          </AppText>
          <AppTextInput
            style={[styles.textInput, isDark && styles.darkTextInput]}
            value={text}
            onChangeText={setText}
            placeholder={randomPlaceholder}
            placeholderTextColor={isDark ? '#666' : '#999'}
          />

          <AppText style={[styles.label, isDark && styles.darkText]}>
            카테고리 (복수)
          </AppText>
          <View style={styles.chipsContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryFilterScroll}
            >
              {categories.map((cat) => {
                const isSelected = selectedCatIds.includes(cat.id);
                return (
                  <AppTouchableOpacity
                    key={cat.id}
                    style={[
                      styles.chip,
                      isDark && styles.chipDark,
                      isSelected && styles.chipSelected,
                    ]}
                    onPress={() => {
                      Keyboard.dismiss();
                      toggleArrayItem(
                        selectedCatIds,
                        cat.id,
                        setSelectedCatIds,
                      );
                    }}
                  >
                    <AppText
                      style={[
                        styles.chipText,
                        isSelected && styles.chipTextSelected,
                      ]}
                      numberOfLines={1}
                    >
                      {cat.name}
                    </AppText>
                  </AppTouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          <View style={styles.dateRow}>
            <View style={{ flex: 1 }}>
              <AppText style={[styles.dateLabel, isDark && styles.darkText]}>
                시작 날짜
              </AppText>
              <AppTouchableOpacity
                style={[styles.dateBox, isDark && styles.dateBoxDark]}
                onPress={() => {
                  Keyboard.dismiss();
                  setDatePickerTarget('start');
                }}
              >
                <AppText style={[styles.dateText, isDark && styles.darkText]}>
                  {startDate}
                </AppText>
              </AppTouchableOpacity>
            </View>
            <View style={{ flex: 1 }}>
              <AppText style={[styles.dateLabel, isDark && styles.darkText]}>
                종료 날짜
              </AppText>
              <AppTouchableOpacity
                style={[styles.dateBox, isDark && styles.dateBoxDark]}
                onPress={() => {
                  Keyboard.dismiss();
                  setDatePickerTarget('end');
                }}
              >
                <AppText
                  style={[
                    styles.dateText,
                    isDark && styles.darkText,
                    !endDate && { color: '#999' },
                  ]}
                >
                  {endDate || '종료 없음'}
                </AppText>
              </AppTouchableOpacity>
              {endDate && (
                <AppTouchableOpacity
                  style={styles.clearDateBtn}
                  onPress={() => setEndDate(null)}
                >
                  <DeleteIcon
                    width={24}
                    height={24}
                    color={isDark ? '#333' : '#ccc'}
                  />
                </AppTouchableOpacity>
              )}
            </View>
          </View>

          <AppText style={[styles.label, isDark && styles.darkText]}>
            반복
          </AppText>
          <View style={styles.dateChipsContainer}>
            {['daily', 'weekly', 'monthly', 'yearly'].map((type) => (
              <AppTouchableOpacity
                key={type}
                style={[
                  styles.chip,
                  isDark && styles.chipDark,
                  repeatType === type && styles.chipSelected,
                ]}
                onPress={() => {
                  Keyboard.dismiss();
                  setRepeatType(type as RepeatType);
                }}
              >
                <AppText
                  style={[
                    styles.chipText,
                    repeatType === type && styles.chipTextSelected,
                  ]}
                >
                  {type === 'daily'
                    ? '매일'
                    : type === 'weekly'
                      ? '매주'
                      : type === 'monthly'
                        ? '매월'
                        : '매년'}
                </AppText>
              </AppTouchableOpacity>
            ))}
          </View>

          {repeatType !== 'daily' && (
            <View style={styles.dividerWrapper}>
              <SvgDashedLine />
            </View>
          )}

          {/* 주간 반복 옵션 */}
          {repeatType === 'weekly' && (
            <View style={[styles.gridContainer]}>
              {WEEK_DAYS.map((d) => {
                const isSelected = repeatDaysOfWeek.includes(d.value);
                return (
                  <View key={d.value} style={styles.dateCell}>
                    <AppTouchableOpacity
                      style={[
                        styles.dateChip,
                        isDark && styles.dateChipDark,
                        isSelected && styles.chipSelected,
                      ]}
                      onPress={() =>
                        toggleArrayItem(
                          repeatDaysOfWeek,
                          d.value,
                          setRepeatDaysOfWeek,
                        )
                      }
                    >
                      <AppText
                        style={[
                          styles.chipText,
                          isSelected && styles.chipTextSelected,
                        ]}
                      >
                        {d.label}
                      </AppText>
                    </AppTouchableOpacity>
                  </View>
                );
              })}
            </View>
          )}

          {/* 월간 반복 옵션 */}
          {repeatType === 'monthly' && (
            <View style={styles.gridContainer}>
              {MONTH_DAYS.map((d) => {
                const isSelected = repeatDaysOfMonth.includes(d);
                return (
                  <View key={d} style={styles.dateCell}>
                    <AppTouchableOpacity
                      style={[
                        styles.dateChip,
                        isDark && styles.dateChipDark,
                        isSelected && styles.chipSelected,
                      ]}
                      onPress={() =>
                        toggleArrayItem(
                          repeatDaysOfMonth,
                          d,
                          setRepeatDaysOfMonth,
                        )
                      }
                    >
                      <AppText
                        style={[
                          styles.chipText,
                          isSelected && styles.chipTextSelected,
                        ]}
                      >
                        {d}
                      </AppText>
                    </AppTouchableOpacity>
                  </View>
                );
              })}
            </View>
          )}

          {/* 연간 반복 옵션 */}
          {repeatType === 'yearly' && (
            <View style={[styles.yearChipsContainer]}>
              {repeatDatesOfYear.map((d, i) => (
                <AppTouchableOpacity
                  key={i}
                  style={[
                    styles.chip,
                    styles.chipSelected,
                    { flexDirection: 'row', gap: 6 },
                  ]}
                  onPress={() => removeYearlyDate(d.month, d.day)}
                >
                  <AppText
                    style={styles.chipTextSelected}
                  >{`${d.month}월 ${d.day}일`}</AppText>
                  <AppText style={styles.chipTextSelected}>✕</AppText>
                </AppTouchableOpacity>
              ))}
              <AppTouchableOpacity
                style={[styles.chip, isDark && styles.chipDark]}
                onPress={() => {
                  Keyboard.dismiss();
                  setDatePickerTarget('yearly');
                }}
              >
                <AppText style={styles.chipText}>+ 날짜 추가</AppText>
              </AppTouchableOpacity>
            </View>
          )}
        </ScrollView>

        <LinearGradient
          pointerEvents="box-none"
          style={styles.bottomBarWrapper}
          colors={
            isDark
              ? ['rgba(17, 17, 17, 0)', 'rgba(17, 17, 17, 0.8)', '#111111']
              : [
                  'rgba(255, 255, 255, 0)',
                  'rgba(255, 255, 255, 0.8)',
                  '#FCFBFA',
                ]
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 0.7 }}
        >
          <View
            style={[styles.modalButtons, isDark && styles.modalButtonsDark]}
          >
            <AppTouchableOpacity
              style={[styles.modalBtn, isDark && styles.modalBtnDark]}
              onPress={onClose}
            >
              <AppText
                style={[
                  styles.modalBtnText,
                  { color: isDark ? '#ccc' : '#666' },
                ]}
              >
                취소
              </AppText>
            </AppTouchableOpacity>
            <AppTouchableOpacity
              style={[
                styles.modalBtn,
                isDark && styles.modalBtnDark,
                styles.modalConfirm,
              ]}
              onPress={handleSaveModal}
            >
              <AppText style={[styles.modalBtnText, { color: '#ffffff' }]}>
                저장
              </AppText>
            </AppTouchableOpacity>
          </View>
        </LinearGradient>

        <AppToast ref={toastRef} />
      </SafeAreaView>

      <DatePickerModal
        visible={datePickerTarget !== null}
        onClose={() => setDatePickerTarget(null)}
        onConfirm={handleConfirmDate}
        onGoToToday={() => {
          const today = new Date();
          handleConfirmDate(
            today.getFullYear(),
            today.getMonth() + 1,
            today.getDate(),
          );
        }}
        initialYear={pickerInitVals.year}
        initialMonth={pickerInitVals.month}
        initialDay={pickerInitVals.day}
        isDark={isDark}
        hideYear={datePickerTarget === 'yearly'}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  darkText: { color: '#ffffff' },
  modalHeader: {
    paddingVertical: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#333',
  },
  rightWrapper: {
    width: 28,
    height: 28,
  },
  label: {
    fontSize: 14,
    marginBottom: 10,
    marginTop: 30,
    paddingHorizontal: 20,
  },
  dateLabel: {
    fontSize: 14,
    marginBottom: 10,
    marginTop: 30,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111',
    backgroundColor: '#fafafa',
    height: 50,
    marginHorizontal: 20,
  },
  darkTextInput: {
    borderColor: '#333',
    color: '#fff',
    backgroundColor: '#121212',
  },
  dateRow: { flexDirection: 'row', gap: 16, paddingHorizontal: 20 },
  dateBox: {
    height: 50,
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    justifyContent: 'center',
    backgroundColor: '#fafafa',
  },
  dateBoxDark: {
    borderColor: '#333',
    backgroundColor: '#121212',
  },
  dateText: { fontSize: 14, color: '#111' },
  clearDateBtn: { position: 'absolute', right: 12, bottom: 14 },
  dividerWrapper: {
    flex: 1,
    paddingHorizontal: 30,
    paddingTop: 15,
    paddingBottom: 11,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryFilterScroll: {
    paddingHorizontal: 20,
    gap: 4,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: 'transparent',
    maxWidth: 200,
  },
  chipDark: {
    backgroundColor: '#202020',
  },
  chipSelected: { backgroundColor: '#FF5900', borderColor: '#FF5900' },
  chipText: { fontSize: 14, color: '#666' },
  chipTextSelected: { color: '#fff', fontWeight: 'bold' },
  dateChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 20,
  },
  yearChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 20,
    paddingTop: 4,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
  },
  dateCell: {
    width: '14.28%',
    aspectRatio: 1,
    padding: 4,
  },
  dateChip: {
    flex: 1,
    borderRadius: 100,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  dateChipDark: {
    backgroundColor: '#202020',
  },
  bottomBarWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 40,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  modalBtn: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtnDark: {
    backgroundColor: '#202020',
  },
  modalConfirm: {
    backgroundColor: '#FF5900',
  },
  modalBtnText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
});
