import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  useColorScheme,
  Alert,
  Platform,
} from 'react-native';
import AppText from '@/components/AppText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Notifications from 'expo-notifications';
import { useDiaryStore } from '../store/useDiaryStore';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function AlarmSettingsScreen() {
  const { isAlarmEnabled, alarmTime, setAlarmEnabled, setAlarmTime, theme } =
    useDiaryStore();
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

  // 💡 2. 최신 onValueChange 규격에 맞게 파라미터를 유연하게 받도록 수정
  const onChangeTime = (event: any, selectedDate?: Date) => {
    // 이벤트 객체로 넘어올 수도 있고, 날짜 객체가 바로 넘어올 수도 있습니다.
    const targetDate = selectedDate || (event instanceof Date ? event : null);

    if (targetDate) {
      setAlarmTime(targetDate);
      if (isAlarmEnabled) {
        scheduleAlarm(targetDate);
      }
    }
  };

  const scheduleAlarm = async (time: Date) => {
    await Notifications.cancelAllScheduledNotificationsAsync();

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('diary-alarm', {
        name: '일기 작성 알림',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF6F61',
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

  return (
    <SafeAreaView
      style={[styles.container, isDark && styles.darkContainer]}
      edges={['bottom']}
    >
      <Stack.Screen
        options={{ headerTitle: '일기 작성 알림', headerBackTitle: '설정' }}
      />

      <View style={[styles.section, isDark && styles.darkSection]}>
        <View style={styles.row}>
          <AppText style={[styles.titleText, isDark && styles.darkText]}>
            알림 켜기
          </AppText>
          <Switch
            value={isAlarmEnabled}
            onValueChange={handleToggle}
            trackColor={{ true: '#FF6F61', false: '#ddd' }}
          />
        </View>

        <View style={styles.divider} />

        <View style={[styles.row, !isAlarmEnabled && styles.disabledRow]}>
          <AppText style={[styles.titleText, isDark && styles.darkText]}>
            알림 시간
          </AppText>
          <DateTimePicker
            value={new Date(alarmTime)}
            mode="time"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            // 💡 2. onChange 대신 onValueChange 사용
            onValueChange={onChangeTime}
            disabled={!isAlarmEnabled}
            textColor={isDark ? '#fff' : '#000'}
            style={{ width: 100 }}
          />
        </View>
      </View>

      <AppText style={[styles.infoText, isDark && styles.darkSubText]}>
        설정한 시간에 매일 일기 작성 안내 알림을 보내드립니다.
      </AppText>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  darkContainer: { backgroundColor: '#121212' },
  section: {
    marginTop: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#eee',
    paddingHorizontal: 20,
  },
  darkSection: { backgroundColor: '#1e1e1e', borderColor: '#333' },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
  },
  disabledRow: { opacity: 0.3 },
  titleText: { fontSize: 16, color: '#333' },
  darkText: { color: '#fff' },
  divider: { height: 1, backgroundColor: '#f0f0f0' },
  infoText: {
    marginTop: 15,
    paddingHorizontal: 20,
    fontSize: 13,
    color: '#888',
    lineHeight: 20,
  },
  darkSubText: { color: '#aaa' },
});
