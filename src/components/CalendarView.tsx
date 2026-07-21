import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, StyleSheet, Text, Modal } from 'react-native';
import AppTouchableOpacity from '@/components/AppTouchableOpacity';
import { Image } from 'expo-image';
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
import {
  EMOTION_IMAGE_MAP,
  ANIMATED_EMOTION_IMAGE_MAP,
} from '@/constants/emotions';
import {
  setupCalendarLocales,
  EN_CALENDAR_LOCALE,
  KR_CALENDAR_LOCALE,
} from '@/constants/calendar';

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
      const displayEmotion = marking?.emotion || '';

      const dateObj = new Date(
        date?.year || 2024,
        (date?.month || 1) - 1,
        date?.day || 1,
      );
      const isSunday = dateObj.getDay() === 0;
      const isFuture = dateStr > localTodayStr;

      return (
        <AppTouchableOpacity
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
          {hasDiary && displayEmotion && EMOTION_IMAGE_MAP[displayEmotion] ? (
            <Image
              source={
                isSelected && ANIMATED_EMOTION_IMAGE_MAP[displayEmotion]
                  ? ANIMATED_EMOTION_IMAGE_MAP[displayEmotion]
                  : EMOTION_IMAGE_MAP[displayEmotion]
              }
              style={[
                styles.emotionImage,
                isSelected && styles.selectedEmotionImage,
              ]}
              contentFit="contain"
              transition={200}
            />
          ) : (
            <AppText
              style={[
                styles.dayText,
                isDark && styles.darkDayText,
                isSunday && styles.sundayText,
                isFuture &&
                  (isDark ? styles.darkDisabledText : styles.disabledText),
                isSelected && !isFuture && styles.selectedText,
              ]}
            >
              {date?.day}
            </AppText>
          )}
        </AppTouchableOpacity>
      );
    },
    [isDark, handleDayPress],
  );

  return (
    <View style={styles.container}>
      <View style={[styles.customHeader]}>
        <AppTouchableOpacity
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
        </AppTouchableOpacity>

        <View style={styles.rightIconsWrapper}>
          <AppTouchableOpacity onPress={() => router.push('/search')}>
            <SearchIcon
              width={28}
              height={28}
              color={isDark ? 'white' : 'black'}
            />
          </AppTouchableOpacity>

          <AppTouchableOpacity onPress={() => router.push('/settings')}>
            <MenuIcon
              width={28}
              height={28}
              color={isDark ? 'white' : 'black'}
            />
          </AppTouchableOpacity>
        </View>
      </View>

      <View style={[styles.fixedHeader, isDark && styles.darkFixedHeader]}>
        <AppTouchableOpacity
          style={styles.headerTitleBtn}
          onPress={() => {
            setPickerYear(parseInt(dispYear, 10));
            setDatePickerVisible(true);
          }}
        >
          <AppText style={[styles.fixedYearText]}>{headerYear}</AppText>

          <AppText style={[styles.fixedMonthText]}>{headerMonth}</AppText>
        </AppTouchableOpacity>

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
          markedDates={markedDates}
          dayComponent={renderDay}
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

      <AppTouchableOpacity
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
      </AppTouchableOpacity>

      <Modal visible={datePickerVisible} transparent animationType="fade">
        <AppTouchableOpacity
          style={styles.alertOverlay}
          activeOpacity={1}
          onPress={() => setDatePickerVisible(false)}
        >
          <View
            style={[styles.pickerBox, isDark && styles.darkPickerBox]}
            onStartShouldSetResponder={() => true}
          >
            <View style={styles.pickerYearHeader}>
              <AppTouchableOpacity
                onPress={() => setPickerYear(pickerYear - 1)}
                style={{ padding: 10 }}
              >
                <Ionicons
                  name="chevron-back"
                  size={24}
                  color={isDark ? '#fff' : '#333'}
                />
              </AppTouchableOpacity>
              <AppText
                style={[styles.pickerYearText, isDark && styles.darkText]}
              >
                {pickerYear}년
              </AppText>
              <AppTouchableOpacity
                onPress={() => setPickerYear(pickerYear + 1)}
                style={{ padding: 10 }}
              >
                <Ionicons
                  name="chevron-forward"
                  size={24}
                  color={isDark ? '#fff' : '#333'}
                />
              </AppTouchableOpacity>
            </View>
            <View style={styles.pickerMonthGrid}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                <AppTouchableOpacity
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
                </AppTouchableOpacity>
              ))}
            </View>
          </View>
        </AppTouchableOpacity>
      </Modal>

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
              <AppTouchableOpacity
                style={styles.alertBtn}
                onPress={() => setWarningModalVisible(false)}
              >
                <AppText style={[styles.alertBtnText, { fontWeight: 'bold' }]}>
                  {t('확인', 'OK')}
                </AppText>
              </AppTouchableOpacity>
            </View>
          </View>
        </View>
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
