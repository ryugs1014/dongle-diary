import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Modal } from 'react-native';
import AppText from '@/components/AppText';
import { router } from 'expo-router';
import { CalendarList, LocaleConfig } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import { useDiaryStore } from '../store/useDiaryStore';
import {
  CalandarIcon,
  SelectArrowIcon,
  SearchIcon,
  MenuIcon,
  AddBigIcon,
} from '../../assets/icons';

LocaleConfig.locales['kr'] = {
  monthNames: [
    '1월',
    '2월',
    '3월',
    '4월',
    '5월',
    '6월',
    '7월',
    '8월',
    '9월',
    '10월',
    '11월',
    '12월',
  ],
  monthNamesShort: [
    '1월',
    '2월',
    '3월',
    '4월',
    '5월',
    '6월',
    '7월',
    '8월',
    '9월',
    '10월',
    '11월',
    '12월',
  ],
  dayNames: [
    '일요일',
    '월요일',
    '화요일',
    '수요일',
    '목요일',
    '금요일',
    '토요일',
  ],
  dayNamesShort: ['일', '월', '화', '수', '목', '금', '토'],
  today: '오늘',
};

LocaleConfig.locales['en'] = {
  monthNames: [
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
  ],
  monthNamesShort: [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ],
  dayNames: [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ],
  dayNamesShort: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  today: 'Today',
};

// (LocaleConfig 설정은 index.tsx나 RootLayout 등 최상단에서 한 번만 해주는 것이 좋지만 편의상 유지합니다)
const getLocalToday = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
const localTodayStr = getLocalToday();

interface CalendarViewProps {
  isDark: boolean;
  t: (ko: string, en: string) => string;
}

export default function CalendarView({ isDark, t }: CalendarViewProps) {
  const { selectedDate, setSelectedDate, diaries } = useDiaryStore();
  const [warningModalVisible, setWarningModalVisible] = useState(false);
  const [displayedMonth, setDisplayedMonth] = useState(localTodayStr);
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [pickerYear, setPickerYear] = useState(
    parseInt(localTodayStr.split('-')[0], 10),
  );

  useEffect(() => {
    setSelectedDate(localTodayStr);
  }, []);

  const dispYear = displayedMonth.split('-')[0];
  const dispMonth = displayedMonth.split('-')[1];
  // 1. 연도 (한국어/영어 모두 숫자만 필요하므로 dispYear만 넣습니다)
  const headerYear = t(`${dispYear}`, `${dispYear}`);

  // 2. 월 (한국어는 '7월', 영어는 'JULY')
  const headerMonth = t(
    // `${parseInt(dispMonth, 10)}월`,
    // .toUpperCase() 를 붙이면 'July'가 대문자 'JULY'로 변환됩니다.
    `${LocaleConfig.locales['en'].monthNames[parseInt(dispMonth, 10) - 1].toUpperCase()}`,
    `${LocaleConfig.locales['en'].monthNames[parseInt(dispMonth, 10) - 1].toUpperCase()}`,
  );
  const weekDays = t(
    LocaleConfig.locales['kr'].dayNamesShort,
    LocaleConfig.locales['en'].dayNamesShort,
  ) as string[];

  const diariesMap = useMemo(() => {
    const map: Record<string, any> = {};
    diaries.forEach((d) => {
      // 해당 날짜에 여러 일기가 있을 수 있으니 배열로 담거나, 마지막 일기만 덮어씌웁니다.
      map[d.date] = d;
    });
    return map;
  }, [diaries]);

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

    if (marks[selectedDate]) {
      marks[selectedDate] = { ...marks[selectedDate], selected: true };
    } else {
      marks[selectedDate] = { selected: true };
    }

    return marks;
  }, [diariesMap, selectedDate]);

  const handleMonthSelect = (month: number) => {
    const newDateStr = `${pickerYear}-${String(month).padStart(2, '0')}-01`;
    setSelectedDate(newDateStr);
    setDisplayedMonth(newDateStr);
    setDatePickerVisible(false);
  };

  // 💡 날짜 클릭 핸들러도 분리하여 참조를 유지합니다.
  const handleDayPress = useCallback(
    (dateStr: string, hasDiary: boolean) => {
      setSelectedDate(dateStr);
      if (hasDiary) router.push('/diary-list');
    },
    [setSelectedDate],
  );

  // 💡 [성능 최적화 2] 렌더링 함수를 useCallback으로 감싸고, 의존성 배열에서 selectedDate를 제거합니다.
  // 이렇게 하면 달력의 모든 날짜가 불필요하게 리렌더링되지 않고, 변경된 날짜만 똑똑하게 업데이트됩니다.
  const renderDay = useCallback(
    ({ date, state, marking }: any) => {
      const dateStr = date?.dateString || '';
      const hasDiary = !!marking?.hasDiary;
      const isSelected = !!marking?.selected;
      const displayEmotion = marking?.emotion || '';

      const dateObj = new Date(
        date?.year || 2024,
        (date?.month || 1) - 1,
        date?.day || 1,
      );
      const isSunday = dateObj.getDay() === 0;
      const isFuture = dateStr > localTodayStr;

      return (
        <TouchableOpacity
          activeOpacity={1}
          disabled={state === 'disabled' || isFuture}
          onPress={() => handleDayPress(dateStr, hasDiary)}
          style={[
            styles.dayCell,
            isSelected && !isFuture && !hasDiary && styles.selectedCell,
            isDark &&
              isSelected &&
              !isFuture &&
              !hasDiary &&
              styles.selectedCellDark,
          ]}
        >
          <AppText
            style={[
              styles.dayText,
              isDark && styles.darkDayText,
              isSunday && styles.sundayText,
              isFuture &&
                (isDark ? styles.darkDisabledText : styles.disabledText),
              isSelected && !isFuture && styles.selectedText,
              hasDiary && { fontSize: 24 },
            ]}
          >
            {hasDiary ? displayEmotion : date?.day}
          </AppText>
        </TouchableOpacity>
      );
    },
    [isDark, handleDayPress],
  ); // selectedDate가 빠진 것이 핵심입니다!

  return (
    <View style={styles.container}>
      <View style={[styles.customHeader]}>
        <TouchableOpacity
          style={styles.contentSelect}
          onPress={() => router.push('/')}
        >
          <CalandarIcon
            width={28}
            height={28}
            color={isDark ? 'white' : 'black'}
          />
          <SelectArrowIcon
            width={16}
            height={16}
            color={isDark ? 'white' : 'black'}
          />
        </TouchableOpacity>

        <View style={styles.rightIconsWrapper}>
          <TouchableOpacity onPress={() => router.push('/search')}>
            <SearchIcon
              width={28}
              height={28}
              color={isDark ? 'white' : 'black'}
            />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push('/settings')}>
            <MenuIcon
              width={28}
              height={28}
              color={isDark ? 'white' : 'black'}
            />
          </TouchableOpacity>
        </View>
      </View>

      <View style={[styles.fixedHeader, isDark && styles.darkFixedHeader]}>
        <TouchableOpacity
          style={styles.headerTitleBtn}
          onPress={() => {
            setPickerYear(parseInt(dispYear, 10));
            setDatePickerVisible(true);
          }}
        >
          <AppText style={[styles.fixedYearText]}>{headerYear}</AppText>

          <AppText style={[styles.fixedMonthText]}>{headerMonth}</AppText>
        </TouchableOpacity>

        {/*<View style={styles.weekDaysContainer}>*/}
        {/*  {weekDays.map((day, idx) => (*/}
        {/*    <AppText*/}
        {/*      key={idx}*/}
        {/*      style={[*/}
        {/*        styles.weekDayText,*/}
        {/*        isDark && styles.darkSubText,*/}
        {/*        idx === 0 && styles.sundayText,*/}
        {/*        idx === 6 && styles.saturdayText,*/}
        {/*      ]}*/}
        {/*    >*/}
        {/*      {day}*/}
        {/*    </AppText>*/}
        {/*  ))}*/}
        {/*</View>*/}
      </View>

      <View style={styles.calendarWrapper}>
        <CalendarList
          current={selectedDate}
          pastScrollRange={60}
          futureScrollRange={12}
          horizontal={false}
          pagingEnabled={true}
          calendarHeight={330}
          hideDayNames={true}
          renderHeader={() => <View style={{ height: 0 }} />}
          onVisibleMonthsChange={(months) => {
            if (months && months.length > 0)
              setDisplayedMonth(months[0].dateString);
          }}
          markedDates={markedDates} // 💡 위에서 묶은 markedDates를 넘겨줍니다.
          dayComponent={renderDay} // 💡 인라인 함수 대신 안정적인 useCallback 함수를 넘겨줍니다.
          theme={{
            calendarBackground: 'transparent',
            dayTextColor: isDark ? '#ffffff' : '#212529',
            textDisabledColor: isDark
              ? 'rgba(255, 255, 255, 0.2)'
              : 'rgba(0, 0, 0, 0.2)',
            'stylesheet.calendar-list.main': {
              placeholderText: {
                color: 'transparent',
              },
            },
          }}
        />
      </View>

      <TouchableOpacity
        style={styles.fab}
        onPress={() => {
          if (selectedDate > localTodayStr) return;
          const hasDiary = diaries.some((d) => d.date === selectedDate);
          if (hasDiary) {
            setWarningModalVisible(true);
            return;
          }
          router.push('/emotion-select');
        }}
      >
        <AddBigIcon width={60} height={60} color={isDark ? 'white' : 'black'} />
      </TouchableOpacity>

      {/* 년/월 선택 모달 */}
      <Modal visible={datePickerVisible} transparent animationType="fade">
        <TouchableOpacity
          style={styles.alertOverlay}
          activeOpacity={1}
          onPress={() => setDatePickerVisible(false)}
        >
          <View
            style={[styles.pickerBox, isDark && styles.darkPickerBox]}
            onStartShouldSetResponder={() => true}
          >
            <View style={styles.pickerYearHeader}>
              <TouchableOpacity
                onPress={() => setPickerYear(pickerYear - 1)}
                style={{ padding: 10 }}
              >
                <Ionicons
                  name="chevron-back"
                  size={24}
                  color={isDark ? '#fff' : '#333'}
                />
              </TouchableOpacity>
              <AppText
                style={[styles.pickerYearText, isDark && styles.darkText]}
              >
                {pickerYear}년
              </AppText>
              <TouchableOpacity
                onPress={() => setPickerYear(pickerYear + 1)}
                style={{ padding: 10 }}
              >
                <Ionicons
                  name="chevron-forward"
                  size={24}
                  color={isDark ? '#fff' : '#333'}
                />
              </TouchableOpacity>
            </View>
            <View style={styles.pickerMonthGrid}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                <TouchableOpacity
                  key={m}
                  style={[
                    styles.pickerMonthBtn,
                    isDark && styles.darkPickerMonthBtn,
                  ]}
                  onPress={() => handleMonthSelect(m)}
                >
                  <AppText
                    style={[styles.pickerMonthText, isDark && styles.darkText]}
                  >
                    {m}월
                  </AppText>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* 경고 모달 */}
      <Modal visible={warningModalVisible} transparent animationType="fade">
        <View style={styles.alertOverlay}>
          <View style={[styles.alertBox, isDark && styles.darkAlertBox]}>
            <AppText style={[styles.alertTitle, isDark && styles.darkText]}>
              {t('작성 불가', 'Cannot Write')}
            </AppText>
            <AppText
              style={[styles.alertMessage, isDark && styles.darkSubText]}
            >
              {t(
                '선택하신 날짜에는 이미 일기가 있습니다.\n수정은 일기 상세 페이지에서 가능합니다.',
                'A diary already exists for this date.\nYou can edit it on the detail page.',
              )}
            </AppText>
            <View style={[styles.alertButtons, isDark && styles.darkBorder]}>
              <TouchableOpacity
                style={styles.alertBtn}
                onPress={() => setWarningModalVisible(false)}
              >
                <AppText style={[styles.alertBtnText, { fontWeight: 'bold' }]}>
                  {t('확인', 'OK')}
                </AppText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  // 💡 SafeArea나 전체 배경은 메인(index)에서 처리합니다.
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

  // weekDaysContainer: {
  //   flexDirection: 'row',
  //   justifyContent: 'space-around',
  //   width: '100%',
  //   paddingHorizontal: 10,
  // },
  // weekDayText: {
  //   width: 40,
  //   textAlign: 'center',
  //   fontSize: 13,
  //   color: '#b6c1cd',
  //   fontWeight: 'bold',
  // },
  // saturdayText: { color: '#4285F4' },
  // darkSubText: { color: '#aaa' },

  calendarWrapper: {
    height: 330,
    width: '100%',
  },
  dayText: { fontSize: 12, color: '#2d4150' },
  darkDayText: { color: '#d9e1e8' },
  disabledText: { color: '#d9e1e8' },
  darkDisabledText: { color: '#444' },
  sundayText: { color: '#FF6262' },
  dayCell: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 100,
  },
  selectedCell: { backgroundColor: 'rgba(0, 0, 0, 0.1)' },
  selectedCellDark: { backgroundColor: 'rgba(255, 255, 255, 0.1)' },

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

  alertOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerBox: {
    width: '85%',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
  },
  darkPickerBox: { backgroundColor: '#2c2c2e' },
  pickerYearHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  pickerYearText: { fontSize: 22, fontWeight: 'bold' },
  pickerMonthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  pickerMonthBtn: {
    width: '30%',
    paddingVertical: 15,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 15,
  },
  darkPickerMonthBtn: { backgroundColor: '#444' },
  pickerMonthText: { fontSize: 16, fontWeight: '500' },
  alertBox: {
    width: 300,
    backgroundColor: 'white',
    borderRadius: 14,
    overflow: 'hidden',
  },
  darkAlertBox: { backgroundColor: '#2c2c2e' },
  alertTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 20,
  },
  alertMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 20,
    paddingHorizontal: 20,
    lineHeight: 20,
  },
  alertButtons: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderColor: '#eee',
  },
  darkBorder: { borderColor: '#444' },
  alertBtn: { flex: 1, paddingVertical: 15, alignItems: 'center' },
  alertBtnText: { fontSize: 16, color: '#007AFF' },
});
