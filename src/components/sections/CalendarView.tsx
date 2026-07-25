import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Text,
  Modal,
  Pressable,
  useWindowDimensions,
} from 'react-native';
import AppTouchableOpacity from '@/components/atoms/AppTouchableOpacity';
import { Image } from 'expo-image';
import AppText from '@/components/atoms/AppText';
import { router } from 'expo-router';
import { CalendarList, LocaleConfig } from 'react-native-calendars';
import { useDiaryStore } from '../../store/useDiaryStore';
import {
  CalandarIcon,
  SelectArrowIcon,
  SearchIcon,
  MenuIcon,
  AddBigIcon,
  DraftPanIcon,
  DocumentIcon,
} from '@/assets/icons';
import {
  EMOTION_IMAGE_MAP,
  ANIMATED_EMOTION_IMAGE_MAP,
} from '@/constants/emotions';
import {
  setupCalendarLocales,
  EN_CALENDAR_LOCALE,
  KR_CALENDAR_LOCALE,
} from '@/constants/calendar';
import Toast from 'react-native-toast-message';
import YearMonthPickerModal from '@/components/modals/YearMonthPickerModal';

setupCalendarLocales();

// (LocaleConfig 설정은 index.tsx나 RootLayout 등 최상단에서 한 번만 해주는 것이 좋지만 편의상 유지합니다)
const getLocalToday = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
const localTodayStr = getLocalToday();

// 현재 월을 기준으로 올해 남은 개월 수 + 내년 12개월을 계산합니다.
// 예: 현재 1월(1)이면 (12 - 1) + 12 = 23개월 추가
const nowForRange = new Date();
const currentMonthNumber = nowForRange.getMonth() + 1;
const DYNAMIC_PAST_RANGE = 60 + (currentMonthNumber - 1);
const DYNAMIC_FUTURE_RANGE = 12 - currentMonthNumber + 12;

interface CalendarViewProps {
  isDark: boolean;
  t: (ko: string, en: string) => string;
  onGoToList: () => void;
}

export default function CalendarView({ isDark, t }: CalendarViewProps) {
  const { width: windowWidth } = useWindowDimensions();

  const {
    selectedDate,
    setSelectedDate,
    diaries,
    draft,
    calendarStartMonday,
    alwaysShowDate,
    clearDraft,
  } = useDiaryStore();
  const [displayedMonth, setDisplayedMonth] = useState(localTodayStr);
  const [datePickerVisible, setDatePickerVisible] = useState(false);

  const [menuVisible, setMenuVisible] = useState(false);
  // const [pickerYear, setPickerYear] = useState(
  //   parseInt(localTodayStr.split('-')[0], 10),
  // );

  useEffect(() => {
    setSelectedDate(localTodayStr);
  }, []);

  const dispYear = displayedMonth.split('-')[0];
  const dispMonth = displayedMonth.split('-')[1];

  const monthIndex = parseInt(dispMonth, 10) - 1;

  const headerYear = t(`${dispYear}`, `${dispYear}`);

  const headerMonth = t(
    // `${KR_CALENDAR_LOCALE.monthNames[monthIndex]}`,
    `${EN_CALENDAR_LOCALE.monthNames[monthIndex].toUpperCase()}`,
    `${EN_CALENDAR_LOCALE.monthNames[monthIndex].toUpperCase()}`,
  );

  const diariesMap = useMemo(() => {
    const map: Record<string, any> = {};
    diaries.forEach((d) => {
      map[d.date] = d;
    });
    return map;
  }, [diaries]);

  // 작성된 일기가 있는 날짜에 임시저장이 겹쳐있다면 자동으로 지우는 로직 추가
  useEffect(() => {
    if (draft && draft.date && diariesMap[draft.date]) {
      clearDraft();
    }
  }, [draft, diariesMap, clearDraft]);

  const markedDates = useMemo(() => {
    const marks: Record<string, any> = {};

    Object.keys(diariesMap).forEach((dateStr) => {
      const d = diariesMap[dateStr];
      marks[dateStr] = {
        hasDiary: true,
        emotion:
          d.emotions && d.emotions.length > 0 ? d.emotions[0] : d.emotion || '',
      };
    });

    if (draft && draft.date) {
      marks[draft.date] = {
        ...marks[draft.date],
        hasDraft: true,
      };
    }

    if (marks[selectedDate]) {
      marks[selectedDate] = { ...marks[selectedDate], selected: true };
    } else {
      marks[selectedDate] = { selected: true };
    }

    return marks;
  }, [diariesMap, selectedDate, draft]);

  const handleMonthSelect = (year: number, month: number) => {
    const newDateStr = `${year}-${String(month).padStart(2, '0')}-01`;
    setSelectedDate(newDateStr);
    setDisplayedMonth(newDateStr);
    setDatePickerVisible(false);
  };

  const handleDayPress = useCallback(
    (dateStr: string, hasDiary: boolean) => {
      setSelectedDate(dateStr);
      if (hasDiary) router.push('/diary-list');
    },
    [setSelectedDate],
  );

  const renderDay = useCallback(
    ({ date, state, marking }: any) => {
      const dateStr = date?.dateString || '';
      const hasDiary = !!marking?.hasDiary;
      const isSelected = !!marking?.selected;
      const hasDraft = !!marking?.hasDraft;
      const displayEmotion = marking?.emotion || '';

      const dateObj = new Date(
        date?.year || 2024,
        (date?.month || 1) - 1,
        date?.day || 1,
      );
      const isSunday = dateObj.getDay() === 0;
      const isFuture = dateStr > localTodayStr;

      const showEmotion =
        hasDiary && displayEmotion && EMOTION_IMAGE_MAP[displayEmotion];

      const showDraftIcon = hasDraft;

      const showDate = (!hasDiary && !showDraftIcon) || alwaysShowDate;

      return (
        <AppTouchableOpacity
          activeOpacity={1}
          disabled={state === 'disabled' || isFuture}
          onPress={() => handleDayPress(dateStr, hasDiary)}
          style={[
            styles.dayCell,
            isSelected &&
              !isFuture &&
              !hasDiary &&
              !showDraftIcon &&
              styles.selectedCell,
            isDark &&
              isSelected &&
              !isFuture &&
              !hasDiary &&
              !showDraftIcon &&
              styles.selectedCellDark,
            isSelected &&
              (showEmotion || showDraftIcon) &&
              alwaysShowDate &&
              styles.overlaySelectedCell,
            isDark &&
              isSelected &&
              (showEmotion || showDraftIcon) &&
              alwaysShowDate &&
              styles.overlaySelectedCellDark,
          ]}
        >
          {/* 1. 날짜 텍스트 (조건에 따라 렌더링) */}
          {showDate && (
            <AppText
              style={[
                styles.dayText,
                isDark && styles.darkDayText,
                isSunday && styles.sundayText,
                hasDraft && (isDark ? styles.darkDraftText : styles.draftText),
                isFuture &&
                  (isDark ? styles.darkDisabledText : styles.disabledText),
                isSelected && !isFuture && styles.selectedText,
                // 아이콘과 함께 켜질 때는 좌측 상단으로 작게 밀어냅니다.
                (showEmotion || showDraftIcon) &&
                  alwaysShowDate &&
                  styles.overlayDateText,
              ]}
            >
              {date?.day}
            </AppText>
          )}

          {/* 2. 임시저장 아이콘 또는 감정 이미지 */}
          {showDraftIcon ? (
            <View
              style={[
                isSelected && styles.selectedEmotionImage,
                alwaysShowDate && styles.emotionImageShifted,
              ]}
            >
              <DraftPanIcon
                width={alwaysShowDate ? 28 : 40}
                height={alwaysShowDate ? 28 : 40}
                color={isDark ? '#ffffff' : '#111111'} // 임시저장 텍스트 색상과 통일
              />
            </View>
          ) : showEmotion ? (
            <Image
              source={
                isSelected && ANIMATED_EMOTION_IMAGE_MAP[displayEmotion]
                  ? ANIMATED_EMOTION_IMAGE_MAP[displayEmotion]
                  : EMOTION_IMAGE_MAP[displayEmotion]
              }
              style={[
                styles.emotionImage,
                isSelected && styles.selectedEmotionImage,
                // 날짜와 함께 표시될 경우 이미지를 조금 축소하고 아래로 밀어냅니다.
                alwaysShowDate && styles.emotionImageShifted,
              ]}
              contentFit="contain"
              transition={200}
            />
          ) : null}
        </AppTouchableOpacity>
      );
    },
    [isDark, handleDayPress, alwaysShowDate],
  );

  return (
    <View style={styles.container}>
      <View style={[styles.customHeader]}>
        <AppTouchableOpacity
          style={styles.contentSelect}
          onPress={() => setMenuVisible(true)}
        >
          <CalandarIcon
            width={28}
            height={28}
            color={isDark ? '#ffffff' : '#111111'}
          />
          <SelectArrowIcon
            width={16}
            height={16}
            color={isDark ? '#ffffff' : '#111111'}
          />
        </AppTouchableOpacity>

        <View style={styles.rightIconsWrapper}>
          <AppTouchableOpacity onPress={() => router.push('/search')}>
            <SearchIcon
              width={28}
              height={28}
              color={isDark ? '#ffffff' : '#111111'}
            />
          </AppTouchableOpacity>

          <AppTouchableOpacity onPress={() => router.push('/settings')}>
            <MenuIcon
              width={28}
              height={28}
              color={isDark ? '#ffffff' : '#111111'}
            />
          </AppTouchableOpacity>
        </View>
      </View>

      <View style={[styles.fixedHeader, isDark && styles.darkFixedHeader]}>
        <AppTouchableOpacity
          style={styles.headerTitleBtn}
          onPress={() => setDatePickerVisible(true)}
        >
          <AppText style={[styles.fixedYearText]}>{headerYear}</AppText>

          <AppText style={[styles.fixedMonthText]}>{headerMonth}</AppText>
        </AppTouchableOpacity>
      </View>

      <View style={styles.calendarWrapper}>
        <CalendarList
          calendarWidth={windowWidth}
          firstDay={calendarStartMonday ? 1 : 0}
          current={selectedDate}
          pastScrollRange={DYNAMIC_PAST_RANGE}
          futureScrollRange={DYNAMIC_FUTURE_RANGE}
          // futureScrollRange={12}

          horizontal={false}
          pagingEnabled={true}
          calendarHeight={330}
          hideDayNames={true}

          // [최적화 1] 화면 밖으로 벗어난 달력 컴포넌트들은 메모리에서 해제합니다. (안드로이드에서 성능 향상 큼)
          removeClippedSubviews={true}

          // [최적화 2] 한 번에 렌더링할 최대 항목(월) 개수를 줄여서 렉을 방지합니다. (기본값 10 -> 3으로 감소)
          maxToRenderPerBatch={3}

          // [최적화 3] 처음에 렌더링할 달력 개수 (기본값 10 -> 2로 감소)
          initialNumToRender={3}

          // [최적화 4] 위아래로 렌더링해둘 여유 화면 비율 (기본값 21 -> 7로 감소하여 메모리 절약)
          windowSize={7}

          renderHeader={() => <View style={{ height: 0 }} />}
          onVisibleMonthsChange={(months) => {
            if (months && months.length > 0)
              setDisplayedMonth(months[0].dateString);
          }}
          markedDates={markedDates}
          dayComponent={renderDay}
          theme={{
            calendarBackground: 'transparent',
            dayTextColor: isDark ? '#ffffff' : '#111111',
            textDisabledColor: isDark
              ? 'rgba(255, 255, 255, 0.2)'
              : 'rgba(0, 0, 0, 0.2)',

            'stylesheet.calendar-list.main': {
              placeholderText: {
                color: isDark ? '#111111' : '#ffffff',
              },
            },
          }}
        />
      </View>

      <AppTouchableOpacity
        style={styles.fab}
        onPress={() => {
          if (selectedDate > localTodayStr) return;
          const hasDiary = diaries.some((d) => d.date === selectedDate);
          if (hasDiary) {
            Toast.show({
              type: 'info',
              text1: '이미 일기를 작성한 날짜에요',
              position: 'top',
              topOffset: 60,
            });
            return;
          }
          router.push('/emotion-select');
        }}
      >
        <AddBigIcon
          width={60}
          height={60}
          color={isDark ? '#ffffff' : '#333333'}
        />
      </AppTouchableOpacity>

      <YearMonthPickerModal
        visible={datePickerVisible}
        onClose={() => setDatePickerVisible(false)}
        initialYear={parseInt(dispYear, 10)}
        initialMonth={parseInt(dispMonth, 10)}
        isDark={isDark}
        onConfirm={(y, m) => {
          handleMonthSelect(y, m);
        }}
        // 모달 안에서 오늘 버튼을 눌렀을 때의 동작 연결
        onGoToToday={() => {
          setSelectedDate(localTodayStr);
          setDisplayedMonth(localTodayStr);
          setDatePickerVisible(false);
        }}
      />

      <Modal visible={menuVisible} transparent animationType="fade">
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setMenuVisible(false)} // 여백 누르면 닫힘
        >
          <View style={[styles.menuBox, isDark && styles.darkMenuBox]}>
            <AppTouchableOpacity
              style={[styles.menuItem, isDark && styles.darkMenuItem]}
              onPress={() => {
                setMenuVisible(false);
                // 현재 달력 화면이므로 창만 닫습니다.
              }}
            >
              <CalandarIcon
                width={24}
                height={24}
                color={isDark ? '#ffffff' : '#111111'}
              />
              <AppText style={[styles.menuText, isDark && styles.darkText]}>
                일기장
              </AppText>
            </AppTouchableOpacity>

            {/* 3. 🟢 새로 추가: 메모 보기 */}
            <AppTouchableOpacity
              style={[styles.menuItem, styles.lastMenuItem]} // 💡 여기에 lastMenuItem 적용
              onPress={() => {
                setMenuVisible(false);

                // 메모 목록 페이지를 거쳐서 작성하게 하려면:
                // router.push('/memo-list');

                // 지금 당장 메모 작성 에디터로 바로 가려면:
                // router.push('/memo-list');
              }}
            >
              <DocumentIcon
                width={24}
                height={24}
                color={isDark ? '#ffffff' : '#111111'}
              />
              <AppText style={[styles.menuText, isDark && styles.darkText]}>
                메모장
              </AppText>
            </AppTouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  customHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    height: 50,
  },
  contentSelect: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    gap: 2,
  },
  rightIconsWrapper: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 10,
  },

  fixedHeader: {
    paddingTop: 50,
    paddingBottom: 30,
    alignItems: 'center',
  },
  headerTitleBtn: {
    alignItems: 'center',
    gap: 2,
  },
  fixedYearText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  fixedMonthText: {
    fontSize: 36,
  },

  calendarWrapper: {
    height: 330,
    width: '100%',
  },
  emotionImage: {
    width: 40,
    height: 40,
  },
  selectedEmotionImage: {
    transform: [{ scale: 1.25 }],
  },
  dayText: { fontSize: 12, color: '#2d4150' },
  darkDayText: { color: '#d9e1e8' },
  disabledText: { color: '#d9e1e8' },
  darkDisabledText: { color: '#444' },
  sundayText: { color: '#FF6262' },
  // draftText: { color: '#007AFF' },
  // darkDraftText: { color: '#007AFF' },
  dayCell: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 100,
    position: 'relative',
  },

  overlayDateText: {
    position: 'absolute',
    top: 0,
    left: 2,
    fontSize: 9, // 날짜를 작게
    fontWeight: 'bold',
    zIndex: 2,
  },
  emotionImageShifted: {
    width: 28, // 기존 40에서 축소
    height: 28,
    // marginTop: 8, // 위쪽에 있는 날짜를 피하기 위해 밀어냄
  },
  selectedCell: { backgroundColor: 'rgba(0, 0, 0, 0.1)' },
  selectedCellDark: { backgroundColor: 'rgba(255, 255, 255, 0.1)' },
  overlaySelectedCell: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  overlaySelectedCellDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },

  fab: {
    position: 'absolute',
    bottom: 60,
    alignSelf: 'center',
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    // backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    paddingTop: 100,
    paddingLeft: 20,
  },
  menuBox: {
    backgroundColor: '#ffffff',
    width: 160,
    borderRadius: 20,
    // overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  darkMenuBox: { backgroundColor: '#1e1e1e' },
  menuItem: {
    padding: 16,
    borderBottomWidth: 1,
    alignItems: 'center',
    borderBottomColor: '#f1f2f3',
    flexDirection: 'row',
    gap: 4,
  },
  lastMenuItem: {
    borderBottomWidth: 0,
  },
  darkMenuItem: { borderBottomColor: '#333' },
  menuText: { fontSize: 14 },
});
