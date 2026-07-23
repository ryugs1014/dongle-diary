import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Modal,
  Alert,
  Platform,
  useColorScheme,
  Pressable,
  Linking,
} from 'react-native';
import AppText from '@/components/atoms/AppText';
import AppTouchableOpacity from '@/components/atoms/AppTouchableOpacity';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { useDiaryStore } from '../store/useDiaryStore';
import { BackIcon, ArrowRightIcon } from '@/assets/icons';
import SvgDashedLine from '@/components/ui/SvgDashedLine';
import CustomSwitch from '@/components/common/CustomSwitch';
import WheelPicker from 'react-native-wheel-picker-expo';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const ITEM_HEIGHT = 60;

export default function AlarmSettingsScreen() {
  const ampmRef = useRef<any>(null);
  const hourRef = useRef<any>(null);
  const minuteRef = useRef<any>(null);

  const { isAlarmEnabled, alarmTime, setAlarmEnabled, setAlarmTime, theme } =
    useDiaryStore();

  const [showPicker, setShowPicker] = useState(false);
  const [pickerKey, setPickerKey] = useState(Date.now());

  // 현재 가리키고 있는 임시 State
  const [tempAmPm, setTempAmPm] = useState('오전');
  const [tempHour, setTempHour] = useState('10');
  const [tempMinute, setTempMinute] = useState('00');

  // 각 피커가 스와이프(터치 또는 관성 스크롤) 중인지 구조적으로 추적하는 State
  const [interacting, setInteracting] = useState({
    ampm: false,
    hour: false,
    minute: false,
  });

  const systemColorScheme = useColorScheme();
  const isDark =
    theme === 'system' ? systemColorScheme === 'dark' : theme === 'dark';

  const handleToggle = async (value: boolean) => {
    if (value) {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          '권한 필요',
          '알림을 받으려면 기기 설정에서 알림 권한을 허용해주세요.',
          [
            { text: '취소', style: 'cancel' },
            {
              text: '설정으로 이동',
              onPress: () => Linking.openSettings(),
            },
          ],
        );
        return;
      }
      setAlarmEnabled(true);
      scheduleAlarm(alarmTime);
    } else {
      setAlarmEnabled(false);
      await Notifications.cancelAllScheduledNotificationsAsync();
    }
  };

  const scheduleAlarm = async (time: Date) => {
    await Notifications.cancelAllScheduledNotificationsAsync();

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('diary-alarm', {
        name: '일기 작성 알림',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF6262',
      });
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: '오늘의 일기 ✍️',
        body: '오늘 하루는 어떠셨나요? 소중한 기억을 남겨보세요.',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: time.getHours(),
        minute: time.getMinutes(),
        repeats: true,
        channelId: 'diary-alarm',
      } as any,
    });
  };

  const openTimePicker = () => {
    // 1. 초기값 세팅
    setTempAmPm('오전');
    setTempHour('1');
    setTempMinute('00');

    // 2. 열릴 때만 새로운 Key를 발급해서 피커를 깔끔하게 0번에서 새로 렌더링
    setPickerKey(Date.now());
    setShowPicker(true);

    const d = new Date(alarmTime);
    const h = d.getHours();
    const m = d.getMinutes();

    const targetAmPmIndex = h >= 12 ? 1 : 0;
    const formattedHour = h % 12 === 0 ? 12 : h % 12;
    const targetHourIndex = formattedHour - 1;
    const targetMinuteIndex = m;

    // 3. 차르르륵 굴러가도록 타이머 간격을 다르게 설정 (슬롯머신 효과)
    setTimeout(() => {
      ampmRef.current?.flatListRef?.current?.scrollToOffset({
        offset: targetAmPmIndex * ITEM_HEIGHT,
        animated: true,
      });
    }, 200); // 오전/오후 제일 먼저 출발

    setTimeout(() => {
      hourRef.current?.flatListRef?.current?.scrollToOffset({
        offset: targetHourIndex * ITEM_HEIGHT,
        animated: true,
      });
    }, 200); // 0.2초 뒤 시간이 출발

    setTimeout(() => {
      minuteRef.current?.flatListRef?.current?.scrollToOffset({
        offset: targetMinuteIndex * ITEM_HEIGHT,
        animated: true,
      });
    }, 200); // 제일 마지막에 분이 출발
  };

  const handleConfirmTime = () => {
    let h = parseInt(tempHour, 10);
    if (tempAmPm === '오후' && h < 12) h += 12;
    if (tempAmPm === '오전' && h === 12) h = 0;

    const newDate = new Date(alarmTime);
    newDate.setHours(h, parseInt(tempMinute, 10), 0, 0);

    setAlarmTime(newDate);
    if (isAlarmEnabled) {
      scheduleAlarm(newDate);
    }
    setShowPicker(false);
  };

  // ----- 구조적 스크롤 추적 핸들러 생성 함수 -----
  const createScrollProps = (key: 'ampm' | 'hour' | 'minute') => ({
    // 사용자가 스크롤을 시작할 때
    onScrollBeginDrag: () =>
      setInteracting((prev) => ({ ...prev, [key]: true })),
    // 관성 스크롤(손을 뗐지만 빠르게 돌아가는 상태)이 시작될 때
    onMomentumScrollBegin: () =>
      setInteracting((prev) => ({ ...prev, [key]: true })),
    // 관성 스크롤이 완전히 멈췄을 때
    onMomentumScrollEnd: () =>
      setInteracting((prev) => ({ ...prev, [key]: false })),
    // 사용자가 터치를 뗐을 때 (관성이 없는 느린 스크롤 시 처리)
    onScrollEndDrag: (e: any) => {
      const velocity = e.nativeEvent.velocity?.y ?? 0;
      // 스와이프 속도가 느려서 관성 스크롤(Momentum)로 이어지지 않고 바로 멈출 때만 false로 변경
      if (Math.abs(velocity) < 0.2) {
        setInteracting((prev) => ({ ...prev, [key]: false }));
      }
    },
  });
  // ---------------------------------------------

  const formatTime = (date: Date | string) => {
    const d = new Date(date);
    const hours = d.getHours();
    const minutes = d.getMinutes();
    const ampm = hours >= 12 ? '오후' : '오전';
    const h = hours % 12 || 12;
    const m = minutes < 10 ? `0${minutes}` : minutes;
    return `${ampm} ${h}:${m}`;
  };

  const SettingItem = ({
    title,
    rightText,
    onPress,
    rightElement,
    disabled,
  }: {
    title: string;
    rightText?: string;
    onPress?: () => void;
    rightElement?: React.ReactNode;
    disabled?: boolean;
  }) => (
    <AppTouchableOpacity
      style={[styles.settingItem, disabled && { opacity: 0.2 }]}
      onPress={onPress}
      disabled={disabled || !onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={styles.settingLeft}>
        <AppText style={[styles.settingTitle, isDark && styles.darkText]}>
          {title}
        </AppText>
      </View>

      <View style={[styles.settingRight, disabled && { opacity: 0.7 }]}>
        {rightText && (
          <AppText style={[styles.rightText, isDark && styles.darkSubText]}>
            {rightText}
          </AppText>
        )}
        {rightElement ? (
          rightElement
        ) : (
          <ArrowRightIcon
            width={28}
            height={28}
            color={isDark ? '#666666' : '#cccccc'}
          />
        )}
      </View>
    </AppTouchableOpacity>
  );

  const ampmItems = ['오전', '오후'].map((v) => ({ label: v, value: v }));
  const hourItems = Array.from({ length: 12 }, (_, i) => ({
    label: String(i + 1),
    value: String(i + 1),
  }));
  const minuteItems = Array.from({ length: 60 }, (_, i) => {
    const val = String(i).padStart(2, '0');
    return { label: val, value: val };
  });

  const getIndex = (arr: any[], value: string) => {
    const idx = arr.findIndex((item) => item.value === value);
    return idx >= 0 ? idx : 0;
  };

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={[styles.container, isDark && styles.darkContainer]}
    >
      <Stack.Screen options={{ headerShown: false }} />

      <View style={[styles.customHeader, isDark && styles.darkCustomHeader]}>
        <View style={styles.leftIconsWrapper}>
          <AppTouchableOpacity onPress={() => router.back()}>
            <BackIcon
              width={28}
              height={28}
              color={isDark ? '#ffffff' : '#111111'}
            />
          </AppTouchableOpacity>
        </View>
        <View style={styles.headerTitleWrapper}>
          <AppText
            style={[styles.customHeaderTitle, isDark && styles.darkText]}
          >
            일기 알림
          </AppText>
        </View>
        <View style={styles.rightIconsWrapper} />
      </View>

      <ScrollView
        style={styles.scrollWrapper}
        contentContainerStyle={{ paddingBottom: 40, paddingTop: 10 }}
      >
        <SettingItem
          title="알림 켜기"
          rightElement={
            <CustomSwitch
              value={isAlarmEnabled}
              onValueChange={handleToggle}
              isDark={isDark}
            />
          }
        />

        {/*<View style={styles.dividerWrapper}>*/}
        {/*  <SvgDashedLine />*/}
        {/*</View>*/}

        <SettingItem
          title="알림 시간"
          rightText={formatTime(alarmTime)}
          disabled={!isAlarmEnabled}
          onPress={openTimePicker}
        />

        <View style={styles.dividerWrapper}>
          <SvgDashedLine />
        </View>

        <AppText style={[styles.infoText, isDark && styles.darkSubText]}>
          설정한 시간에 매일 일기 작성 안내 알림을 보내드립니다.
        </AppText>
      </ScrollView>

      <Modal visible={showPicker} transparent animationType="fade">
        <View style={styles.alertOverlay}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setShowPicker(false)}
          />

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

              {/* 1. 오전/오후 피커 */}
              <View style={styles.wheelWrapper}>
                <WheelPicker
                  ref={ampmRef}
                  initialSelectedIndex={0}
                  // initialSelectedIndex={getIndex(ampmItems, tempAmPm)}
                  items={ampmItems}
                  onChange={({ item }) => setTempAmPm(item.value)}
                  height={ITEM_HEIGHT * 5}
                  itemHeight={ITEM_HEIGHT}
                  backgroundColor={isDark ? '#1e1e1e' : '#ffffff'}
                  selectedStyle={{ borderWidth: 0 }}
                  haptics={true}
                  flatListProps={createScrollProps('ampm')} // <-- Native 이벤트 주입
                  renderItem={(props) => {
                    // 스크롤(터치/관성) 중이 아닐 때만 하이라이트 적용
                    const isSelected =
                      !interacting.ampm && props.label === tempAmPm;
                    return (
                      <AppText
                        style={{
                          fontSize: 20,
                          fontWeight: 'bold',
                          color: isDark
                            ? isSelected
                              ? '#FFFFFF'
                              : '#666666'
                            : isSelected
                              ? '#333333'
                              : '#999999',
                          textAlign: 'center',
                        }}
                      >
                        {props.label}
                      </AppText>
                    );
                  }}
                />
              </View>

              {/* 2. 시간 피커 */}
              <View style={styles.wheelWrapper}>
                <WheelPicker
                  ref={hourRef}
                  initialSelectedIndex={0}
                  // initialSelectedIndex={getIndex(hourItems, tempHour)}
                  items={hourItems}
                  onChange={({ item }) => setTempHour(item.value)}
                  height={ITEM_HEIGHT * 5}
                  itemHeight={ITEM_HEIGHT}
                  backgroundColor={isDark ? '#1e1e1e' : '#ffffff'}
                  selectedStyle={{ borderWidth: 0 }}
                  haptics={true}
                  flatListProps={createScrollProps('hour')}
                  renderItem={(props) => {
                    const isSelected =
                      !interacting.hour && props.label === tempHour;
                    return (
                      <AppText
                        style={{
                          fontSize: 20,
                          fontWeight: 'bold',
                          color: isDark
                            ? isSelected
                              ? '#FFFFFF'
                              : '#666666'
                            : isSelected
                              ? '#333333'
                              : '#999999',
                          textAlign: 'center',
                        }}
                      >
                        {props.label}
                      </AppText>
                    );
                  }}
                />
              </View>

              {/* 3. 분 피커 */}
              <View style={styles.wheelWrapper}>
                <WheelPicker
                  ref={minuteRef}
                  initialSelectedIndex={0}
                  // initialSelectedIndex={getIndex(minuteItems, tempMinute)}
                  items={minuteItems}
                  onChange={({ item }) => setTempMinute(item.value)}
                  height={ITEM_HEIGHT * 5}
                  itemHeight={ITEM_HEIGHT}
                  backgroundColor={isDark ? '#1e1e1e' : '#ffffff'}
                  selectedStyle={{ borderWidth: 0 }}
                  haptics={true}
                  flatListProps={createScrollProps('minute')}
                  renderItem={(props) => {
                    const isSelected =
                      !interacting.minute && props.label === tempMinute;
                    return (
                      <AppText
                        style={{
                          fontSize: 20,
                          fontWeight: 'bold',
                          color: isDark
                            ? isSelected
                              ? '#FFFFFF'
                              : '#666666'
                            : isSelected
                              ? '#333333'
                              : '#999999',
                          textAlign: 'center',
                        }}
                      >
                        {props.label}
                      </AppText>
                    );
                  }}
                />
              </View>
            </View>

            <View style={[styles.alertButtons, isDark && styles.darkMenuItem]}>
              <AppTouchableOpacity
                style={styles.alertBtn}
                onPress={() => setShowPicker(false)}
              >
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
                onPress={handleConfirmTime}
              >
                <AppText style={[styles.alertBtnText, { color: '#FF6F61' }]}>
                  확인
                </AppText>
              </AppTouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FCFBFA' },
  darkContainer: { backgroundColor: '#111111' },

  customHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    height: 50,
  },
  darkCustomHeader: {
    backgroundColor: '#111111',
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
  },
  leftIconsWrapper: { flex: 1, flexDirection: 'row' },
  headerTitleWrapper: { flex: 2, alignItems: 'center' },
  customHeaderTitle: { fontSize: 16, fontWeight: 'bold' },
  rightIconsWrapper: { flex: 1 },

  scrollWrapper: { paddingVertical: 10 },

  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    height: 52,
  },
  settingLeft: { flexDirection: 'column', justifyContent: 'center' },
  settingRight: { flexDirection: 'row', alignItems: 'center' },
  settingTitle: { fontSize: 16, color: '#333' },
  rightText: { fontSize: 16, color: '#111111', marginRight: 4 },
  darkText: { color: '#ffffff' },
  darkSubText: { color: '#aaaaaa' },

  dividerWrapper: { paddingHorizontal: 20, paddingVertical: 10 },

  infoText: {
    marginTop: 15,
    marginBottom: 40,
    paddingHorizontal: 20,
    fontSize: 13,
    color: '#888888',
    textAlign: 'left',
    lineHeight: 20,
  },

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
  alertTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
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

  pickerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
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
  lightPickerHighlight: {
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  darkPickerHighlight: {
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  wheelWrapper: {
    flex: 1,
    alignItems: 'center',
  },
});
