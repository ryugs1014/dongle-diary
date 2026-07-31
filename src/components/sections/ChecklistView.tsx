import React, {
  useState,
  useMemo,
  useCallback,
  useRef,
  useEffect,
} from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  PanResponder,
  findNodeHandle,
  Keyboard,
  Platform,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import Toast from 'react-native-toast-message';
import AppText from '@/components/atoms/AppText';
import AppTouchableOpacity from '@/components/atoms/AppTouchableOpacity';
import { useDiaryStore } from '../../store/useDiaryStore';
import { useChecklistStore } from '../../store/useChecklistStore';
import { isRoutineActiveOnDate } from '@/utils/routineUtils';

import {
  ClearCheckIcon,
  PrevIcon,
  NextIcon,
  AddListIcon,
  SettingIcon,
} from '@/assets/icons';
import AppTextInput from '@/components/atoms/AppTextInput';
import DatePickerModal from '@/components/modals/DatePickerModal';
import ChecklistSettingsModal from '@/components/modals/ChecklistSettingsModal';
import AppConfirmModal from '@/components/modals/AppConfirmModal';

// --- 유틸리티 함수 ---
const getLocalToday = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatDateStr = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const getWeekDays = (baseDateStr: string, startMonday: boolean) => {
  const baseDate = new Date(baseDateStr);
  const dayOfWeek = baseDate.getDay();
  const diff = startMonday ? (dayOfWeek === 0 ? 6 : dayOfWeek - 1) : dayOfWeek;

  const startOfWeek = new Date(baseDate);
  startOfWeek.setDate(baseDate.getDate() - diff);

  const weekDays = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    weekDays.push(formatDateStr(d));
  }
  return weekDays;
};

const getWeekOfMonth = (dateStr: string, startMonday: boolean) => {
  const d = new Date(dateStr);
  const date = d.getDate();
  const firstDayOfMonth = new Date(d.getFullYear(), d.getMonth(), 1);
  let firstDayWeekday = firstDayOfMonth.getDay();

  if (startMonday) {
    firstDayWeekday = firstDayWeekday === 0 ? 6 : firstDayWeekday - 1;
  }
  return Math.ceil((date + firstDayWeekday) / 7);
};

interface ChecklistViewProps {
  isDark: boolean;
  t: (ko: string, en: string) => string;
}

export default function ChecklistView({ isDark, t }: ChecklistViewProps) {
  const localTodayStr = getLocalToday();
  const { calendarStartMonday } = useDiaryStore();

  // 🔥 키보드 오픈 여부 상태 추가
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  // 🔥 키보드 이벤트 리스너 등록
  useEffect(() => {
    const showSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setIsKeyboardOpen(true),
    );
    const hideSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setIsKeyboardOpen(false),
    );

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const {
    categories,
    checklistData,
    routines,
    addTodo,
    toggleTodo,
    updateTodoText,
    deleteTodo,
    showDateText,
    setShowDateText,
    isWeekView,
    setIsWeekView,
  } = useChecklistStore();

  const kasvRef = useRef<KeyboardAwareScrollView>(null);
  const newInputRef = useRef<TextInput>(null);
  const editInputRef = useRef<TextInput>(null);

  const isChangingDateRef = useRef(false);
  const isAddingBtnPressedRef = useRef(false);
  const activeInputValueRef = useRef('');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeInputCatId, setActiveInputCatId] = useState<string | null>(null);
  const [activeInputValue, setActiveInputValue] = useState('');

  // --- 날짜 상태 관리 ---
  const [selectedDate, setSelectedDate] = useState(localTodayStr);
  const [navDate, setNavDate] = useState(localTodayStr);
  const [isScrollEnabled, setIsScrollEnabled] = useState(true);
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);
  const [isSettingsVisible, setSettingsVisible] = useState(false);

  // 🔥 수정 모달 상태 관리
  const [editConfirmVisible, setEditConfirmVisible] = useState(false);
  const [editTarget, setEditTarget] = useState<{
    categoryId: string;
    id: string;
    text: string;
  } | null>(null);

  // --- 날짜 텍스트 렌더링 ---
  const todayObj = new Date();
  const dayNamesEnAbbr = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthNamesEn = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  const todayWeekStr = dayNamesEnAbbr[todayObj.getDay()];
  const todayMonthStr = monthNamesEn[todayObj.getMonth()];

  const navYear = navDate.split('-')[0];
  const navMonthNum = parseInt(navDate.split('-')[1], 10);
  const weekOfMonth = getWeekOfMonth(selectedDate, calendarStartMonday);

  const weekDayHeaders = calendarStartMonday
    ? ['월', '화', '수', '목', '금', '토', '일']
    : ['일', '월', '화', '수', '목', '금', '토'];

  const currentWeekDays = useMemo(
    () => getWeekDays(navDate, calendarStartMonday),
    [navDate, calendarStartMonday],
  );

  const changeDateAndCancelInput = useCallback((newDateStr: string) => {
    isChangingDateRef.current = true;
    Keyboard.dismiss();
    setEditingId(null);
    setActiveInputCatId(null);
    setActiveInputValue('');
    activeInputValueRef.current = '';

    setNavDate(newDateStr);
    setSelectedDate(newDateStr);

    setTimeout(() => {
      isChangingDateRef.current = false;
    }, 150);
  }, []);

  const navigateCalendar = useCallback(
    (direction: 'prev' | 'next') => {
      const d = new Date(navDate);
      const isForward = direction === 'next';

      if (isWeekView) {
        d.setDate(d.getDate() + (isForward ? 7 : -7));
        const dayOfWeek = d.getDay();
        const diffToStart = calendarStartMonday
          ? dayOfWeek === 0
            ? 6
            : dayOfWeek - 1
          : dayOfWeek;
        const startOfWeek = new Date(d);
        startOfWeek.setDate(d.getDate() - diffToStart);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        const targetDay = isForward ? startOfWeek : endOfWeek;
        changeDateAndCancelInput(formatDateStr(targetDay));
      } else {
        if (isForward) {
          d.setDate(1);
          d.setMonth(d.getMonth() + 1);
        } else {
          d.setDate(0);
        }
        changeDateAndCancelInput(formatDateStr(d));
      }
    },
    [navDate, isWeekView, calendarStartMonday, changeDateAndCancelInput],
  );

  const handlePrev = useCallback(
    () => navigateCalendar('prev'),
    [navigateCalendar],
  );
  const handleNext = useCallback(
    () => navigateCalendar('next'),
    [navigateCalendar],
  );

  const handleMonthChange = useCallback(
    (month: any) => {
      changeDateAndCancelInput(month.dateString);
    },
    [changeDateAndCancelInput],
  );

  const handleConfirmDate = useCallback(
    (year: number, month: number, day: number) => {
      const formattedMonth = String(month).padStart(2, '0');
      const formattedDay = String(day).padStart(2, '0');

      const newDateStr = `${year}-${formattedMonth}-${formattedDay}`;

      changeDateAndCancelInput(newDateStr);
      setDatePickerVisible(false);
    },
    [changeDateAndCancelInput],
  );

  const handleGoToToday = useCallback(() => {
    changeDateAndCancelInput(localTodayStr);
    setDatePickerVisible(false);

    Toast.show({
      type: 'info',
      text1: '오늘 날짜로 이동했어요',
      position: 'top',
      topOffset: 60,
    });
  }, [changeDateAndCancelInput, localTodayStr]);

  const getCombinedTodosForDate = useCallback(
    (targetDate: string) => {
      const dayTodosRaw = checklistData[targetDate] || {};
      const result: Record<string, (typeof categories)[0] & any> = {};

      categories.forEach((cat) => {
        const catTodos = [...(dayTodosRaw[cat.id] || [])];
        const activeRoutines = routines.filter(
          (r) =>
            r.categoryIds.includes(cat.id) &&
            isRoutineActiveOnDate(r, targetDate),
        );

        activeRoutines.forEach((routine) => {
          const routineTodoId = `routine-${routine.id}`;
          const existing = catTodos.find((t) => t.id === routineTodoId);
          if (!existing) {
            catTodos.push({
              id: routineTodoId,
              text: routine.text,
              isCompleted: false,
            });
          } else {
            existing.text = routine.text;
          }
        });

        const finalCatTodos = catTodos.filter((t) => {
          if (t.id.startsWith('routine-')) {
            const routineId = t.id.replace('routine-', '');
            const routineStillExistsAndActive = activeRoutines.some(
              (r) => r.id === routineId,
            );
            if (!routineStillExistsAndActive && !t.isCompleted) return false;
          }
          return true;
        });

        result[cat.id] = finalCatTodos;
      });
      return result;
    },
    [checklistData, routines, categories],
  );

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponderCapture: (_, gestureState) => {
          const { dx, dy } = gestureState;
          return Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy) * 2.5;
        },
        onMoveShouldSetPanResponder: (_, gestureState) => {
          const { dx, dy } = gestureState;
          return Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy) * 2.5;
        },
        onPanResponderGrant: () => {
          setIsScrollEnabled(false);
        },
        onPanResponderRelease: (_, gestureState) => {
          if (gestureState.dx > 10) handlePrev();
          else if (gestureState.dx < -10) handleNext();
          setIsScrollEnabled(true);
        },
        onPanResponderTerminate: () => {
          setIsScrollEnabled(true);
        },
      }),
    [handlePrev, handleNext],
  );

  const scrollToInput = (inputRef: React.RefObject<TextInput>) => {
    setTimeout(() => {
      const node = findNodeHandle(inputRef.current);
      if (node && kasvRef.current) {
        (kasvRef.current as any).scrollToFocusedInput(node);
      }
    }, 150);
  };

  const handleToggleTodo = (categoryId: string, todoId: string) => {
    toggleTodo(selectedDate, categoryId, todoId);
  };

  const handleUpdateExistingTodo = (
    categoryId: string,
    todoId: string,
    text: string,
  ) => {
    if (isChangingDateRef.current) {
      setEditingId(null);
      return;
    }

    if (text.trim() === '') {
      deleteTodo(selectedDate, categoryId, todoId);
      // 🔥 항목을 완전히 지웠을 때만 Toast 출력
      Toast.show({
        type: 'success',
        text1: '할 일을 삭제했어요',
        position: 'top',
        topOffset: 60,
      });
    } else {
      updateTodoText(selectedDate, categoryId, todoId, text);
    }
    setEditingId(null);
  };

  // 🔥 수정 모달 호출
  const confirmEdit = (
    categoryId: string,
    todoId: string,
    todoText: string,
  ) => {
    setEditTarget({ categoryId, id: todoId, text: todoText });
    setEditConfirmVisible(true);
  };

  // 🔥 수정 모달 확정 동작
  const handleConfirmEdit = () => {
    setEditConfirmVisible(false);
    if (editTarget) {
      setEditingId(editTarget.id);
      setActiveInputCatId(null);
      setTimeout(() => editInputRef.current?.focus(), 100);
      scrollToInput(editInputRef);
    }
  };

  // 🔥 수정 모달 취소 동작
  const handleCancelEdit = () => {
    setEditConfirmVisible(false);
    setEditTarget(null);
  };

  const handleAddNewSubmit = (categoryId: string) => {
    if (isChangingDateRef.current) return;

    const currentVal = activeInputValueRef.current.trim();

    if (currentVal !== '') {
      addTodo(selectedDate, categoryId, {
        id: Date.now().toString(),
        text: currentVal,
        isCompleted: false,
      });
      setActiveInputValue('');
      activeInputValueRef.current = '';
      scrollToInput(newInputRef);
    } else {
      setActiveInputCatId((prev) => (prev === categoryId ? null : prev));
    }
  };

  const handleStartAdding = (categoryId: string) => {
    isAddingBtnPressedRef.current = true;

    const currentVal = activeInputValueRef.current.trim();

    if (activeInputCatId === categoryId) {
      if (currentVal !== '') {
        handleAddNewSubmit(categoryId);
        setTimeout(() => newInputRef.current?.focus(), 100);
      } else {
        setActiveInputCatId(null);
        Keyboard.dismiss();
      }
      setTimeout(() => {
        isAddingBtnPressedRef.current = false;
      }, 50);
      return;
    }

    if (activeInputCatId && currentVal !== '') {
      handleAddNewSubmit(activeInputCatId);
    }

    setActiveInputCatId(categoryId);
    setActiveInputValue('');
    activeInputValueRef.current = '';
    setEditingId(null);

    setTimeout(() => {
      newInputRef.current?.focus();
      scrollToInput(newInputRef);
    }, 50);

    setTimeout(() => {
      isAddingBtnPressedRef.current = false;
    }, 50);
  };

  const renderCustomDay = useCallback(
    ({ date, state }: any) => {
      const dateStr = date.dateString;
      const isSelected = selectedDate === dateStr;
      const isToday = localTodayStr === dateStr;
      const isPast = dateStr < localTodayStr;
      const isFuture = dateStr > localTodayStr;

      const combinedDayTodos = getCombinedTodosForDate(dateStr);
      const allItems = Object.values(combinedDayTodos).flat();

      const totalCount = allItems.length;
      const incompleteCount = allItems.filter((t) => !t.isCompleted).length;
      const isAllDone = totalCount > 0 && incompleteCount === 0;

      let circleBgColor = 'transparent';
      let circleBorderColor = 'transparent';
      let contentColor = '#fff';

      if (isToday) {
        circleBgColor = '#FF5900';
        circleBorderColor = '#FF5900';
        contentColor = '#fff';
      } else if (isPast) {
        circleBgColor = isDark ? '#ffffff' : '#212529';
        circleBorderColor = isDark ? '#ffffff' : '#212529';
        contentColor = isDark ? '#111' : '#fff';
      } else if (isFuture) {
        circleBgColor = 'transparent';
        circleBorderColor = isDark ? '#444444' : '#e1e2e3';
        contentColor = isDark ? '#888888' : '#aaaaaa';
      }

      if (isSelected) {
        circleBorderColor = '#FF5900';
      }

      return (
        <AppTouchableOpacity
          activeOpacity={0.7}
          onPress={() => {
            if (selectedDate !== dateStr) {
              changeDateAndCancelInput(dateStr);
            }
          }}
          style={styles.dayCell}
        >
          <View
            style={[
              styles.baseCircle,
              {
                backgroundColor: circleBgColor,
                borderColor: circleBorderColor,
              },
            ]}
          >
            {totalCount > 0 &&
              (isAllDone ? (
                <ClearCheckIcon
                  width={24}
                  height={24}
                  color={isDark ? '#111111' : '#fcfbfa'}
                />
              ) : incompleteCount >= 100 ? (
                // 🔥 1. 100개 이상일 때 '99'와 '+'를 분리하여 렌더링
                <View style={styles.plusNumberWrapper}>
                  <AppText
                    style={[styles.statusNumberText, { color: contentColor }]}
                  >
                    99
                  </AppText>
                  <AppText style={[styles.plusText, { color: contentColor }]}>
                    +
                  </AppText>
                </View>
              ) : (
                <AppText
                  style={[styles.statusNumberText, { color: contentColor }]}
                >
                  {incompleteCount}
                </AppText>
              ))}
          </View>

          {showDateText && (
            <AppText
              style={[
                styles.dayText,
                isDark && styles.darkDayText,
                (isFuture || state === 'disabled') &&
                  (isDark ? styles.darkDisabledText : styles.disabledText),
                isToday && styles.todayText,
              ]}
            >
              {date.day}
            </AppText>
          )}
        </AppTouchableOpacity>
      );
    },
    [
      selectedDate,
      isDark,
      getCombinedTodosForDate,
      showDateText,
      localTodayStr,
      changeDateAndCancelInput,
    ],
  );

  return (
    <>
      <KeyboardAwareScrollView
        ref={kasvRef}
        style={[
          styles.container,
          { backgroundColor: isDark ? '#111' : '#fcfbfa' },
        ]}
        // contentContainerStyle={{ paddingBottom: 400 }}
        contentContainerStyle={{ paddingBottom: isKeyboardOpen ? 400 : 60 }}
        enableOnAndroid={true}
        enableAutomaticScroll={false}
        extraHeight={120}
        extraScrollHeight={120}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        scrollEnabled={isScrollEnabled}
      >
        <View style={styles.todayHeader}>
          <AppTouchableOpacity
            style={styles.todayDateRow}
            activeOpacity={0.7}
            onPress={() => {
              changeDateAndCancelInput(localTodayStr);

              Toast.show({
                type: 'info',
                text1: '오늘 날짜로 이동했어요',
                position: 'top',
                topOffset: 60,
              });
            }}
          >
            <AppText style={[styles.todayDay, isDark && styles.todayDayDark]}>
              {String(todayObj.getDate()).padStart(2, '0')}
            </AppText>

            <View style={styles.yearMonthRow}>
              <AppText
                style={[styles.todayYear, isDark && styles.todayYearDark]}
              >
                {todayObj.getFullYear()}
              </AppText>

              <View style={styles.monthWeekRow}>
                <AppText
                  style={[styles.todayMonth, isDark && styles.textWhite]}
                >
                  {todayMonthStr}
                </AppText>

                <AppText style={styles.todayWeekName}>{todayWeekStr}</AppText>
              </View>
            </View>
          </AppTouchableOpacity>
        </View>

        <View style={styles.calendarControls}>
          <View style={styles.navButtons}>
            <AppTouchableOpacity onPress={() => setDatePickerVisible(true)}>
              <AppText
                style={[styles.navMonthText, isDark && styles.textWhite]}
              >
                {navYear}년 {navMonthNum}월 {isWeekView && `${weekOfMonth}주차`}
              </AppText>
            </AppTouchableOpacity>
          </View>

          <View style={styles.actionButtons}>
            <AppTouchableOpacity
              onPress={() => setSettingsVisible(true)}
              style={[styles.iconBtn, styles.settingIcon]}
            >
              <SettingIcon
                width={28}
                height={28}
                color={isDark ? '#fff' : '#111'}
              />
            </AppTouchableOpacity>

            <AppTouchableOpacity
              activeOpacity={1}
              onPress={handlePrev}
              style={styles.iconBtn}
            >
              <PrevIcon
                width={28}
                height={28}
                color={isDark ? '#fff' : '#111'}
              />
            </AppTouchableOpacity>
            <AppTouchableOpacity
              activeOpacity={1}
              onPress={handleNext}
              style={styles.iconBtn}
            >
              <NextIcon
                width={28}
                height={28}
                color={isDark ? '#fff' : '#111'}
              />
            </AppTouchableOpacity>
          </View>
        </View>

        <View style={styles.calendarContainer} {...panResponder.panHandlers}>
          <View style={styles.weekDaysHeader}>
            {weekDayHeaders.map((day, idx) => (
              <AppText
                key={idx}
                style={[styles.weekDayText, isDark && styles.textWhite]}
              >
                {day}
              </AppText>
            ))}
          </View>

          {isWeekView ? (
            <View style={styles.weekRow}>
              {currentWeekDays.map((dateStr) => {
                const d = new Date(dateStr);
                return (
                  <View key={dateStr} style={styles.weekDayCell}>
                    {renderCustomDay({
                      date: { dateString: dateStr, day: d.getDate() },
                      state:
                        parseInt(dateStr.split('-')[1], 10) !== navMonthNum
                          ? 'disabled'
                          : '',
                    })}
                  </View>
                );
              })}
            </View>
          ) : (
            <Calendar
              key={`${navYear}-${navMonthNum}`}
              current={navDate}
              hideArrows={true}
              hideDayNames={true}
              hideExtraDays={true}
              enableSwipeMonths={false}
              onMonthChange={handleMonthChange}
              renderHeader={() => null}
              dayComponent={renderCustomDay}
              theme={{
                calendarBackground: 'transparent',
                'stylesheet.calendar.main': {
                  container: {
                    padding: 0,
                    margin: 0,
                  },
                  monthView: {
                    padding: 0,
                    marginTop: 5,
                    marginBottom: 0,
                  },
                  week: {
                    marginTop: 0,
                    marginBottom: 0,
                    flexDirection: 'row',
                    justifyContent: 'space-around',
                  },
                },
                'stylesheet.calendar.header': {
                  header: {
                    padding: 0,
                    margin: 0,
                    height: 0,
                  },
                },
              }}
            />
          )}
        </View>

        <View style={styles.checklistContainer}>
          {categories.map((cat) => {
            const combinedSelectedTodos = getCombinedTodosForDate(selectedDate);
            const categoryTodos = combinedSelectedTodos[cat.id] || [];
            const isAddingNew = activeInputCatId === cat.id;

            const todoCount = categoryTodos.length;
            const displayCount =
              todoCount >= 100 ? '99+' : todoCount.toString();

            return (
              <View key={cat.id} style={styles.categoryBlock}>
                <AppTouchableOpacity
                  style={[
                    styles.categoryHeader,
                    isDark && styles.categoryHeaderDark,
                  ]}
                  onPress={() => handleStartAdding(cat.id)}
                >
                  <View style={styles.categoryTitleWrapper}>
                    <AppText
                      style={[
                        styles.categoryCountText,
                        isDark && styles.categoryCountTextDark,
                      ]}
                    >
                      {displayCount}
                    </AppText>

                    <AppText
                      style={[styles.categoryTitle, isDark && styles.textWhite]}
                      numberOfLines={1}
                    >
                      {cat.name}
                    </AppText>
                  </View>

                  <AddListIcon
                    width={28}
                    height={28}
                    color={isDark ? '#fff' : '#111'}
                  />
                </AppTouchableOpacity>

                {categoryTodos.map((todo) => {
                  const isEditing = editingId === todo.id;

                  return (
                    <View key={todo.id} style={styles.todoRow}>
                      <AppTouchableOpacity
                        style={[
                          styles.checkbox,
                          todo.isCompleted && styles.checkboxCompleted,
                          isDark && styles.checkboxDark,
                          isDark &&
                            todo.isCompleted &&
                            styles.checkboxCompletedDark,
                        ]}
                        onPress={() => handleToggleTodo(cat.id, todo.id)}
                      >
                        {todo.isCompleted && (
                          <ClearCheckIcon
                            width={20}
                            height={20}
                            color={isDark ? '#111111' : '#ffffff'}
                          />
                        )}
                      </AppTouchableOpacity>

                      {isEditing ? (
                        <AppTextInput
                          ref={editInputRef}
                          style={[styles.todoInput, isDark && styles.textWhite]}
                          autoFocus
                          placeholderTextColor={isDark ? '#666' : '#999'}
                          defaultValue={todo.text}
                          onBlur={(e) =>
                            handleUpdateExistingTodo(
                              cat.id,
                              todo.id,
                              e.nativeEvent.text,
                            )
                          }
                          onSubmitEditing={(e) =>
                            handleUpdateExistingTodo(
                              cat.id,
                              todo.id,
                              e.nativeEvent.text,
                            )
                          }
                        />
                      ) : (
                        <AppText
                          suppressHighlighting={true}
                          style={[
                            styles.todoText,
                            todo.isCompleted && styles.todoTextCompleted,
                            isDark && styles.textWhite,
                            todo.isCompleted &&
                              isDark &&
                              styles.todoTextCompletedDark,
                          ]}
                          onPress={() =>
                            confirmEdit(cat.id, todo.id, todo.text)
                          }
                        >
                          {todo.text}
                        </AppText>
                      )}
                    </View>
                  );
                })}

                {isAddingNew && (
                  <View style={styles.todoRow}>
                    <View
                      style={[
                        styles.checkbox,
                        isDark && styles.checkboxDark,
                        { borderColor: isDark ? '#444' : '#eee' },
                      ]}
                    />
                    <TextInput
                      ref={newInputRef}
                      style={[styles.todoInput, isDark && styles.textWhite]}
                      autoFocus
                      blurOnSubmit={false}
                      placeholder="무엇을 할까요?"
                      placeholderTextColor={isDark ? '#666' : '#999'}
                      value={activeInputValue}
                      onChangeText={(text) => {
                        setActiveInputValue(text);
                        activeInputValueRef.current = text;
                      }}
                      onSubmitEditing={() => handleAddNewSubmit(cat.id)}
                      onBlur={() => {
                        if (isAddingBtnPressedRef.current) return;

                        handleAddNewSubmit(cat.id);
                        setActiveInputCatId((prev) =>
                          prev === cat.id ? null : prev,
                        );
                      }}
                    />
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </KeyboardAwareScrollView>

      <DatePickerModal
        visible={isDatePickerVisible}
        onClose={() => setDatePickerVisible(false)}
        onConfirm={handleConfirmDate}
        onGoToToday={handleGoToToday}
        initialYear={parseInt(selectedDate.split('-')[0], 10)}
        initialMonth={parseInt(selectedDate.split('-')[1], 10)}
        initialDay={parseInt(selectedDate.split('-')[2], 10)}
        isDark={isDark}
      />

      <ChecklistSettingsModal
        visible={isSettingsVisible}
        onClose={() => setSettingsVisible(false)}
        isDark={isDark}
      />

      {/* 🔥 Alert.alert 대체용 커스텀 모달 */}
      <AppConfirmModal
        visible={editConfirmVisible}
        title="할 일 수정"
        message={editTarget ? `"${editTarget.text}" 항목을 수정할까요?` : ''}
        // 👇 여기서부터 추가
        topBtnText="삭제하기"
        topBtnColor="#FF6262"
        onTopBtnPress={() => {
          if (editTarget) {
            deleteTodo(selectedDate, editTarget.categoryId, editTarget.id);
            Toast.show({
              type: 'success',
              text1: '할 일을 삭제했어요',
              position: 'top',
              topOffset: 60,
            });
          }
          setEditConfirmVisible(false);
          setEditTarget(null);
        }}
        // 👆 여기까지 추가
        cancelText="취소"
        confirmText="수정"
        onCancel={handleCancelEdit}
        onConfirm={handleConfirmEdit}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  textWhite: { color: '#fff' },
  todayHeader: {
    paddingLeft: 20,
    paddingRight: 30,
    paddingTop: 60,
    paddingBottom: 30,
  },
  todayDateRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  yearMonthRow: {
    flex: 1,
    gap: 4,
    marginBottom: 4,
  },
  monthWeekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 5,
  },
  todayDay: {
    fontSize: 80,
    fontWeight: 'bold',
    letterSpacing: -2,
    color: '#FF5900',
  },
  todayDayDark: {
    color: '#FF5900',
  },
  todayYear: {
    fontSize: 24,
    color: '#ccc',
    fontWeight: 'bold',
  },
  todayYearDark: {
    color: '#888',
  },
  todayMonth: {
    fontSize: 24,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  todayWeekName: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'right',
  },

  calendarControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 25,
    marginBottom: 10,
  },
  navButtons: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  navMonthText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111',
    marginTop: 3,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  settingIcon: { marginRight: 4 },
  iconBtn: {},
  calendarContainer: { paddingHorizontal: 20, marginBottom: 10 },
  weekDaysHeader: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    height: 50,
    marginBottom: 5,
  },
  weekDayText: {
    fontSize: 13,
    color: '#111',
    fontWeight: '500',
    width: 40,
    textAlign: 'center',
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 5,
  },
  weekDayCell: { width: 40, alignItems: 'center' },
  dayCell: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginBottom: 15,
  },
  baseCircle: {
    width: 40,
    height: 40,
    borderRadius: 50,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayText: {
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 10,
  },
  darkDayText: { color: '#d9e1e8' },
  disabledText: { color: 'rgba(0,0,0,0.2)' },
  darkDisabledText: { color: 'rgba(255,255,255,0.2)' },
  todayText: { color: '#FF5900' },
  plusNumberWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 1,
  },
  plusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  statusNumberText: { fontSize: 16, textAlign: 'center', fontWeight: 'bold' },
  checklistContainer: {
    paddingHorizontal: 20,
    paddingTop: 15,
  },
  categoryBlock: { marginBottom: 16 },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    // elevation: 16,
    marginBottom: 16,
    gap: 4,
  },
  categoryHeaderDark: {
    backgroundColor: '#191919',
  },
  categoryTitleWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryCountText: {
    fontSize: 12,
    fontWeight: 'bold',
    padding: 5,
    borderRadius: 6,
    backgroundColor: '#f1f2f3',
    textAlign: 'center',
    minWidth: 20,
  },
  categoryCountTextDark: {
    backgroundColor: '#333',
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111',
    flexShrink: 1,
  },
  todoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 10,
    paddingHorizontal: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxDark: { borderColor: '#555' },
  checkboxCompleted: { backgroundColor: '#212529', borderColor: '#212529' },
  checkboxCompletedDark: { backgroundColor: '#ffffff', borderColor: '#ffffff' },
  todoText: { flex: 1, fontSize: 16, color: '#111' },
  todoTextCompleted: { color: '#999', textDecorationLine: 'line-through' },
  todoTextCompletedDark: { color: '#555' },
  todoInput: { flex: 1, fontSize: 16, color: '#111', padding: 0, margin: 0 },
});
